#![cfg_attr(not(feature = "std"), no_std)]

pub use pallet::*;

#[cfg(test)]
mod mock;

#[cfg(test)]
mod tests;

#[cfg(feature = "runtime-benchmarks")]
mod benchmarking;

#[frame_support::pallet]
pub mod pallet {
    use frame_support::pallet_prelude::*;
    use frame_system::pallet_prelude::*;
    use sp_std::prelude::*;

    #[pallet::pallet]
    pub struct Pallet<T>(_);

    #[pallet::config]
    pub trait Config: frame_system::Config {
        type RuntimeEvent: From<Event<Self>> + IsType<<Self as frame_system::Config>::RuntimeEvent>;
        
        #[pallet::constant]
        type MaxSessionDuration: Get<BlockNumberFor<Self>>;
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
        /// A session key has been authorized. [primary_account, session_key, expiry_block]
        SessionKeyAuthorized {
            primary_account: T::AccountId,
            session_key: T::AccountId,
            expiry_block: BlockNumberFor<T>,
        },
        /// A session key has been revoked. [primary_account, session_key]
        SessionKeyRevoked {
            primary_account: T::AccountId,
            session_key: T::AccountId,
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
        #[pallet::call_index(0)]
        #[pallet::weight(T::DbWeight::get().writes(1).saturating_add(10_000))]
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

            Self::deposit_event(Event::SessionKeyAuthorized {
                primary_account,
                session_key,
                expiry_block,
            });

            Ok(())
        }

        /// Revoke an existing session key.
        #[pallet::call_index(1)]
        #[pallet::weight(T::DbWeight::get().writes(1).saturating_add(10_000))]
        pub fn revoke_session_key(
            origin: OriginFor<T>,
            session_key: T::AccountId,
        ) -> DispatchResult {
            let primary_account = ensure_signed(origin)?;

            ensure!(SessionKeys::<T>::contains_key(&primary_account, &session_key), Error::<T>::SessionKeyNotFound);

            SessionKeys::<T>::remove(&primary_account, &session_key);

            Self::deposit_event(Event::SessionKeyRevoked {
                primary_account,
                session_key,
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
    }
}
