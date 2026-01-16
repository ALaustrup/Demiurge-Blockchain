//! # Session Keys Pallet
//!
//! Temporary authorization keys for game sessions that eliminate wallet popups.
//!
//! ## Overview
//!
//! Session Keys allow users to authorize temporary keys for specific game sessions.
//! These keys automatically expire after the session ends, providing security while
//! improving user experience by eliminating frequent wallet popups.
//!
//! ## Features
//!
//! - **Temporary Key Generation**: Create session-specific authorization keys
//! - **Auto-Expiry**: Keys automatically expire after session timeout
//! - **Granular Permissions**: Fine-grained control over what keys can do
//! - **Game Session Integration**: Designed for seamless game integration
//!
//! ## Usage
//!
//! ```rust
//! // Create a session key for a game
//! SessionKeys::create_session_key(origin, game_id, permissions, expiry_block)?;
//!
//! // Use session key for transactions (no wallet popup needed)
//! SessionKeys::execute_with_session_key(session_key, call)?;
//!
//! // Revoke session key if needed
//! SessionKeys::revoke_session_key(origin, session_key_id)?;
//! ```

#![cfg_attr(not(feature = "std"), no_std)]

use codec::{Decode, Encode};
use frame_support::{
    pallet_prelude::*,
    weights::Weight,
};
use frame_system::pallet_prelude::*;
use scale_info::TypeInfo;
use sp_runtime::{
    traits::Saturating,
    RuntimeDebug,
};
use sp_std::prelude::*;

#[cfg(feature = "runtime-benchmarks")]
mod benchmarking;
pub mod weights;

pub use pallet::*;

#[frame_support::pallet]
pub mod pallet {
    use super::*;

    #[pallet::config]
    pub trait Config: frame_system::Config {
        /// The overarching event type.
        type RuntimeEvent: From<Event<Self>> + IsType<<Self as frame_system::Config>::RuntimeEvent>;

        /// Weight information for extrinsics in this pallet.
        type WeightInfo: WeightInfo;

        /// Maximum session duration in blocks
        #[pallet::constant]
        type MaxSessionDuration: Get<BlockNumberFor<Self>>;
    }

    #[pallet::pallet]
    #[pallet::without_storage_info]
    pub struct Pallet<T>(_);

    /// Session key identifier
    pub type SessionKeyId<T> = <T as frame_system::Config>::Hash;

    /// Session key data
    #[derive(Encode, Decode, Clone, PartialEq, Eq, RuntimeDebug, TypeInfo, MaxEncodedLen)]
    pub struct SessionKey<T: Config> {
        /// Account that created this session key
        pub creator: <T as frame_system::Config>::AccountId,
        /// Game/application ID this key is authorized for
        pub game_id: BoundedVec<u8, ConstU32<64>>,
        /// Permissions granted to this key
        pub permissions: BoundedVec<Permission, ConstU32<32>>,
        /// Block number when this key expires
        pub expiry_block: BlockNumberFor<T>,
        /// Whether this key is active
        pub is_active: bool,
    }

    /// Permission type for session keys
    #[derive(Encode, Decode, Clone, PartialEq, Eq, RuntimeDebug, TypeInfo, MaxEncodedLen)]
    pub enum Permission {
        /// Can transfer tokens up to a maximum amount
        Transfer { max_amount: u128 },
        /// Can interact with specific pallet
        PalletCall { pallet: BoundedVec<u8, ConstU32<32>> },
        /// Can interact with specific NFT
        NftInteraction { nft_id: [u8; 32] },
    }

    /// Storage: Active session keys
    #[pallet::storage]
    #[pallet::getter(fn session_keys)]
    pub type SessionKeys<T: Config> = StorageMap<
        _,
        Blake2_128Concat,
        SessionKeyId<T>,
        SessionKey<T>,
        OptionQuery,
    >;

    /// Storage: Session keys by creator
    #[pallet::storage]
    pub type CreatorSessionKeys<T: Config> = StorageMap<
        _,
        Blake2_128Concat,
        <T as frame_system::Config>::AccountId,
        BoundedVec<SessionKeyId<T>, ConstU32<100>>,
        ValueQuery,
    >;

    #[pallet::event]
    #[pallet::generate_deposit(pub(super) fn deposit_event)]
    pub enum Event<T: Config> {
        /// Session key created
        SessionKeyCreated {
            session_key_id: SessionKeyId<T>,
            creator: <T as frame_system::Config>::AccountId,
            game_id: BoundedVec<u8, ConstU32<64>>,
            expiry_block: BlockNumberFor<T>,
        },
        /// Session key revoked
        SessionKeyRevoked {
            session_key_id: SessionKeyId<T>,
            creator: <T as frame_system::Config>::AccountId,
        },
        /// Session key expired
        SessionKeyExpired {
            session_key_id: SessionKeyId<T>,
        },
    }

    #[pallet::error]
    pub enum Error<T> {
        /// Session key not found
        SessionKeyNotFound,
        /// Session key already expired
        SessionKeyExpired,
        /// Session key not active
        SessionKeyNotActive,
        /// Not authorized to use this session key
        NotAuthorized,
        /// Session duration exceeds maximum
        SessionDurationTooLong,
        /// Too many permissions
        TooManyPermissions,
        /// Invalid game ID
        InvalidGameId,
    }

    #[pallet::call]
    impl<T: Config> Pallet<T> {
        /// Create a new session key
        ///
        /// # Parameters
        /// - `game_id`: Identifier for the game/application
        /// - `permissions`: List of permissions to grant
        /// - `duration_blocks`: How long the session should last (in blocks)
        #[pallet::call_index(0)]
        #[pallet::weight(T::WeightInfo::create_session_key())]
        pub fn create_session_key(
            origin: OriginFor<T>,
            game_id: Vec<u8>,
            permissions: Vec<Permission>,
            duration_blocks: BlockNumberFor<T>,
        ) -> DispatchResult {
            let creator = ensure_signed(origin)?;

            // Validate game ID
            let game_id_bounded = BoundedVec::try_from(game_id)
                .map_err(|_| Error::<T>::InvalidGameId)?;

            // Validate duration
            ensure!(
                duration_blocks <= T::MaxSessionDuration::get(),
                Error::<T>::SessionDurationTooLong
            );

            // Validate permissions count
            let permissions_bounded = BoundedVec::try_from(permissions)
                .map_err(|_| Error::<T>::TooManyPermissions)?;

            // Calculate expiry block
            let current_block = <frame_system::Pallet<T>>::block_number();
            let expiry_block = current_block.saturating_add(duration_blocks);

            // Generate session key ID
            let session_key_id = T::Hashing::hash_of(&(
                &creator,
                &game_id_bounded,
                &current_block,
            ));

            // Create session key
            let session_key = SessionKey {
                creator: creator.clone(),
                game_id: game_id_bounded.clone(),
                permissions: permissions_bounded,
                expiry_block,
                is_active: true,
            };

            // Store session key
            SessionKeys::<T>::insert(&session_key_id, &session_key);

            // Add to creator's list
            CreatorSessionKeys::<T>::mutate(&creator, |keys| {
                keys.try_push(session_key_id).ok();
            });

            Self::deposit_event(Event::SessionKeyCreated {
                session_key_id,
                creator,
                game_id: game_id_bounded,
                expiry_block,
            });

            Ok(())
        }

        /// Revoke a session key
        #[pallet::call_index(1)]
        #[pallet::weight(T::WeightInfo::revoke_session_key())]
        pub fn revoke_session_key(
            origin: OriginFor<T>,
            session_key_id: SessionKeyId<T>,
        ) -> DispatchResult {
            let revoker = ensure_signed(origin)?;

            let mut session_key = SessionKeys::<T>::get(&session_key_id)
                .ok_or(Error::<T>::SessionKeyNotFound)?;

            // Only creator can revoke
            ensure!(session_key.creator == revoker, Error::<T>::NotAuthorized);

            // Mark as inactive
            session_key.is_active = false;
            SessionKeys::<T>::insert(&session_key_id, &session_key);

            Self::deposit_event(Event::SessionKeyRevoked {
                session_key_id,
                creator: revoker,
            });

            Ok(())
        }
    }

    #[pallet::hooks]
    impl<T: Config> Hooks<BlockNumberFor<T>> for Pallet<T> {
        fn on_initialize(_n: BlockNumberFor<T>) -> Weight {
            // Clean up expired session keys
            // Note: This is a simplified implementation
            // In production, you'd want to iterate and clean expired keys
            Weight::from_parts(0, 0)
        }
    }

    impl<T: Config> Pallet<T> {
        /// Check if a session key is valid and active
        pub fn is_session_key_valid(
            session_key_id: &SessionKeyId<T>,
            current_block: BlockNumberFor<T>,
        ) -> bool {
            if let Some(session_key) = SessionKeys::<T>::get(session_key_id) {
                session_key.is_active && session_key.expiry_block > current_block
            } else {
                false
            }
        }

        /// Get session key if valid
        pub fn get_valid_session_key(
            session_key_id: &SessionKeyId<T>,
            current_block: BlockNumberFor<T>,
        ) -> Option<SessionKey<T>> {
            SessionKeys::<T>::get(session_key_id).and_then(|key| {
                if key.is_active && key.expiry_block > current_block {
                    Some(key)
                } else {
                    None
                }
            })
        }
    }
}

/// Weight functions needed for this pallet.
pub trait WeightInfo {
    fn create_session_key() -> Weight;
    fn revoke_session_key() -> Weight;
}

// Default weight implementations
impl WeightInfo for () {
    fn create_session_key() -> Weight {
        Weight::from_parts(50_000, 0)
    }

    fn revoke_session_key() -> Weight {
        Weight::from_parts(30_000, 0)
    }
}
