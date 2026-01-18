#![cfg_attr(not(feature = "std"), no_std)]

pub use pallet::*;

#[cfg(test)]
mod mock;

#[cfg(test)]
mod tests;

#[cfg(feature = "runtime-benchmarks")]
mod benchmarking;

// Runtime API for session keys queries
#[cfg(feature = "runtime")]
pub mod runtime_api {
    use sp_api::decl_runtime_apis;
    use sp_runtime::traits::Block as BlockT;

    decl_runtime_apis! {
        /// Runtime API for querying session keys
        pub trait SessionKeysApi<Block: BlockT> {
            /// Get all active session keys for a primary account
            /// Returns a vector of (session_key, expiry_block) tuples
            fn get_active_session_keys(primary_account: <Block as BlockT>::AccountId) -> Vec<(<Block as BlockT>::AccountId, <Block as BlockT>::BlockNumber)>;
            
            /// Check if a session key is currently valid for a primary account
            fn is_session_key_valid(primary_account: <Block as BlockT>::AccountId, session_key: <Block as BlockT>::AccountId) -> bool;
            
            /// Get the expiry block number for a session key
            fn get_session_key_expiry(primary_account: <Block as BlockT>::AccountId, session_key: <Block as BlockT>::AccountId) -> Option<<Block as BlockT>::BlockNumber>;
        }
    }
}

#[frame_support::pallet]
pub mod pallet {
    use frame_support::pallet_prelude::*;
    use frame_system::pallet_prelude::*;
    use sp_runtime::traits::{Saturating, Zero};
    use sp_std::prelude::*;

    #[pallet::pallet]
    pub struct Pallet<T>(_);

    /// Trait for querying QOR Identity information
    pub trait QorIdentityQuery<T: Config> {
        /// Get QOR ID username for an account (if registered)
        fn get_qor_id_username(account: &T::AccountId) -> Option<BoundedVec<u8, ConstU32<20>>>;
    }

    #[pallet::config]
    pub trait Config: frame_system::Config {
        type RuntimeEvent: From<Event<Self>> + IsType<<Self as frame_system::Config>::RuntimeEvent>;
        
        #[pallet::constant]
        type MaxSessionDuration: Get<BlockNumberFor<Self>>;
        
        /// QOR Identity pallet for QOR ID lookups
        type QorIdentity: pallet_qor_identity::Config<AccountId = Self::AccountId>;
        
        /// Trait for querying QOR Identity (implemented at runtime level)
        type QorIdentityQuery: QorIdentityQuery<Self>;
    }

    /// Stores the session keys for a given primary account.
    /// The session key itself is the key to the storage map.
    /// (PrimaryAccountId, SessionKeyAccountId) -> ExpiryBlockNumber
    #[pallet::storage]
    #[pallet::getter(fn session_key_expiry)]
    pub type SessionKeys<T: Config> = StorageDoubleMap<
        _,
        Blake2_128Concat, T::AccountId, // Primary Account
        Blake2_128Concat, T::AccountId, // Session Key
        BlockNumberFor<T>, // Expiry Block Number
    >;

    #[pallet::event]
    #[pallet::generate_deposit(pub(super) fn deposit_event)]
    pub enum Event<T: Config> {
        /// A session key has been authorized. [primary_account, session_key, expiry_block, qor_id]
        SessionKeyAuthorized {
            primary_account: T::AccountId,
            session_key: T::AccountId,
            expiry_block: BlockNumberFor<T>,
            qor_id: Option<BoundedVec<u8, ConstU32<20>>>, // Username if QOR ID exists
        },
        /// A session key has been revoked. [primary_account, session_key, qor_id]
        SessionKeyRevoked {
            primary_account: T::AccountId,
            session_key: T::AccountId,
            qor_id: Option<BoundedVec<u8, ConstU32<20>>>, // Username if QOR ID exists
        },
    }

    #[pallet::error]
    pub enum Error<T> {
        /// The specified session key is already authorized for this account.
        SessionKeyAlreadyExists,
        /// The session key to be revoked was not found.
        SessionKeyNotFound,
        /// The specified duration exceeds the maximum allowed session duration.
        DurationExceedsMax,
        /// The session key has expired.
        SessionKeyExpired,
    }

    #[pallet::call]
    impl<T: Config> Pallet<T> {
        /// Authorize a new session key for the sender.
        /// 
        /// This creates a temporary authorization key tied to the user's QOR ID account.
        /// The session key will automatically expire after the specified duration.
        #[pallet::call_index(0)]
        #[pallet::weight(T::DbWeight::get().writes(1).saturating_add(Weight::from_parts(10_000, 0)))]
        pub fn authorize_session_key(
            origin: OriginFor<T>,
            session_key: T::AccountId,
            duration: BlockNumberFor<T>,
        ) -> DispatchResult {
            let primary_account = ensure_signed(origin)?;
            
            ensure!(duration <= T::MaxSessionDuration::get(), Error::<T>::DurationExceedsMax);
            ensure!(!SessionKeys::<T>::contains_key(&primary_account, &session_key), Error::<T>::SessionKeyAlreadyExists);

            let current_block = <frame_system::Pallet<T>>::block_number();
            let expiry_block = current_block.saturating_add(duration);

            SessionKeys::<T>::insert(&primary_account, &session_key, expiry_block);

            // Lookup QOR ID username for event
            let qor_id_username = Self::get_qor_id_username(&primary_account);

            Self::deposit_event(Event::SessionKeyAuthorized {
                primary_account: primary_account.clone(),
                session_key,
                expiry_block,
                qor_id: qor_id_username,
            });

            Ok(())
        }

        /// Revoke an existing session key.
        /// 
        /// Immediately invalidates a session key before its expiry.
        #[pallet::call_index(1)]
        #[pallet::weight(T::DbWeight::get().writes(1).saturating_add(Weight::from_parts(10_000, 0)))]
        pub fn revoke_session_key(
            origin: OriginFor<T>,
            session_key: T::AccountId,
        ) -> DispatchResult {
            let primary_account = ensure_signed(origin)?;

            ensure!(SessionKeys::<T>::contains_key(&primary_account, &session_key), Error::<T>::SessionKeyNotFound);

            SessionKeys::<T>::remove(&primary_account, &session_key);

            // Lookup QOR ID username for event
            let qor_id_username = Self::get_qor_id_username(&primary_account);

            Self::deposit_event(Event::SessionKeyRevoked {
                primary_account: primary_account.clone(),
                session_key,
                qor_id: qor_id_username,
            });

            Ok(())
        }
    }

    impl<T: Config> Pallet<T> {
        /// A helper function to check if a session key is currently valid.
        pub fn is_session_key_valid(primary_account: &T::AccountId, session_key: &T::AccountId) -> bool {
            if let Some(expiry_block) = Self::session_key_expiry(primary_account, session_key) {
                let current_block = <frame_system::Pallet<T>>::block_number();
                return current_block < expiry_block;
            }
            false
        }

        /// Get QOR ID username for an account (if registered)
        /// 
        /// Uses the QorIdentityQuery trait to query the QOR Identity pallet.
        fn get_qor_id_username(account: &T::AccountId) -> Option<BoundedVec<u8, ConstU32<20>>> {
            T::QorIdentityQuery::get_qor_id_username(account)
        }

        /// Get all active session keys for a QOR ID account
        /// 
        /// Returns a list of (session_key, expiry_block) tuples
        pub fn get_active_session_keys(primary_account: &T::AccountId) -> Vec<(T::AccountId, BlockNumberFor<T>)> {
            let current_block = <frame_system::Pallet<T>>::block_number();

            // Iterate through all session keys for this account
            SessionKeys::<T>::iter_prefix(primary_account)
                .filter(|(_, expiry_block)| *expiry_block > current_block)
                .map(|(session_key, expiry_block)| (session_key, expiry_block))
                .collect::<Vec<_>>()
        }

        /// Check if account has any active session keys
        pub fn has_active_session_keys(primary_account: &T::AccountId) -> bool {
            !Self::get_active_session_keys(primary_account).is_empty()
        }

        /// Revoke all expired session keys for an account (cleanup helper)
        pub fn cleanup_expired_keys(primary_account: &T::AccountId) -> u32 {
            let current_block = <frame_system::Pallet<T>>::block_number();
            let mut removed_count = 0u32;

            // Collect expired keys
            let expired_keys: Vec<T::AccountId> = SessionKeys::<T>::iter_prefix(primary_account)
                .filter(|(_, expiry_block)| *expiry_block <= current_block)
                .map(|(session_key, _)| session_key)
                .collect::<Vec<_>>();

            // Remove expired keys
            for session_key in expired_keys {
                SessionKeys::<T>::remove(primary_account, &session_key);
                removed_count += 1;
            }

            removed_count
        }
    }
}
