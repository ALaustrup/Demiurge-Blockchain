//! # Qor Identity Pallet
//!
//! The non-dual identity system for the Demiurge Ecosystem.
//!
//! ## Overview
//!
//! Qor ID provides a unified identity layer that connects:
//! - Off-chain authentication (qor-auth service)
//! - On-chain account management
//! - CGT wallet ownership
//!
//! ## Features
//!
//! - Register Qor ID linked to on-chain account
//! - Link multiple wallets to single identity
//! - ZK-proof based verification attestations
//! - Identity recovery mechanisms
//!
//! ## Identity Format (Username-Only)
//!
//! **Username:** Globally unique, 3-20 alphanumeric characters (case-insensitive)
//! **Qor Key:** Visual short-key format `Q[hex]:[hex]` (e.g., `Q7A1:9F2`)
//! - Derived from first 3 and last 3 bytes of AccountId
//! - Used as "Digital Soul" reference for users

#![cfg_attr(not(feature = "std"), no_std)]

pub use pallet::*;

#[cfg(test)]
mod mock;

#[cfg(test)]
mod tests;

#[cfg(feature = "runtime-benchmarks")]
mod benchmarking;

pub mod weights;
pub use weights::*;

#[frame_support::pallet]
pub mod pallet {
    use frame_support::{
        pallet_prelude::*,
        traits::{Currency, ReservableCurrency},
    };
    use frame_system::pallet_prelude::*;
    use sp_runtime::traits::Saturating;
    use sp_std::prelude::*;

    /// Maximum username length
    pub const MAX_USERNAME_LENGTH: u32 = 20;
    
    /// Minimum username length
    pub const MIN_USERNAME_LENGTH: u32 = 3;

    /// Type alias for balance
    pub type BalanceOf<T> =
        <<T as Config>::Currency as Currency<<T as frame_system::Config>::AccountId>>::Balance;

    /// Qor ID structure stored on-chain
    #[derive(Clone, Encode, Decode, Eq, PartialEq, RuntimeDebug, TypeInfo, MaxEncodedLen)]
    #[scale_info(skip_type_params(T))]
    pub struct QorIdentity<T: Config> {
        /// Username (lowercase, 3-20 chars, globally unique)
        pub username: BoundedVec<u8, ConstU32<MAX_USERNAME_LENGTH>>,
        /// Qor Key: Visual short format (6 bytes: first 3 + last 3 of AccountId)
        pub qor_key: [u8; 6],
        /// Primary on-chain account
        pub primary_account: T::AccountId,
        /// Additional linked accounts
        pub linked_accounts: BoundedVec<T::AccountId, ConstU32<10>>,
        /// Identity status
        pub status: IdentityStatus,
        /// Block number when registered
        pub registered_at: BlockNumberFor<T>,
        /// ZK attestations
        pub attestations: BoundedVec<Attestation, ConstU32<20>>,
    }

    /// Identity status
    #[derive(Clone, Encode, Decode, Eq, PartialEq, RuntimeDebug, TypeInfo, MaxEncodedLen)]
    pub enum IdentityStatus {
        Active,
        Suspended,
        Recovering,
    }

    /// ZK attestation record
    #[derive(Clone, Encode, Decode, Eq, PartialEq, RuntimeDebug, TypeInfo, MaxEncodedLen)]
    pub struct Attestation {
        /// Type of attestation
        pub attestation_type: AttestationType,
        /// Hash of the proof (stored off-chain)
        pub proof_hash: [u8; 32],
        /// Block when verified
        pub verified_at: u32,
        /// Expiry block (if applicable)
        pub expires_at: Option<u32>,
    }

    /// Types of attestations
    #[derive(Clone, Encode, Decode, Eq, PartialEq, RuntimeDebug, TypeInfo, MaxEncodedLen)]
    pub enum AttestationType {
        AgeVerification,
        RegionVerification,
        KycComplete,
        ReputationThreshold,
    }

    #[pallet::pallet]
    pub struct Pallet<T>(_);

    #[pallet::config]
    pub trait Config: frame_system::Config {
        /// Runtime event type
        type RuntimeEvent: From<Event<Self>> + IsType<<Self as frame_system::Config>::RuntimeEvent>;

        /// Currency for registration fee
        type Currency: Currency<Self::AccountId> + ReservableCurrency<Self::AccountId>;

        /// Registration fee (burned)
        #[pallet::constant]
        type RegistrationFee: Get<BalanceOf<Self>>;

        /// Weight information
        type WeightInfo: WeightInfo;
    }

    /// Map from Qor ID hash to identity
    #[pallet::storage]
    #[pallet::getter(fn identities)]
    pub type Identities<T: Config> = StorageMap<
        _,
        Blake2_128Concat,
        [u8; 32], // Hash of "username#discriminator"
        QorIdentity<T>,
        OptionQuery,
    >;

    /// Map from account to Qor ID hash
    #[pallet::storage]
    #[pallet::getter(fn account_to_identity)]
    pub type AccountToIdentity<T: Config> = StorageMap<
        _,
        Blake2_128Concat,
        T::AccountId,
        [u8; 32],
        OptionQuery,
    >;

    /// Direct username to account mapping for availability checks
    /// Usernames are case-insensitive and globally unique
    #[pallet::storage]
    #[pallet::getter(fn usernames)]
    pub type Usernames<T: Config> = StorageMap<
        _,
        Blake2_128Concat,
        BoundedVec<u8, ConstU32<MAX_USERNAME_LENGTH>>,
        T::AccountId,
        OptionQuery,
    >;

    /// Total registered identities
    #[pallet::storage]
    #[pallet::getter(fn total_identities)]
    pub type TotalIdentities<T> = StorageValue<_, u64, ValueQuery>;

    #[pallet::event]
    #[pallet::generate_deposit(pub(super) fn deposit_event)]
    pub enum Event<T: Config> {
        /// New Qor ID registered
        /// [qor_id_hash, account, username, qor_key]
        IdentityRegistered {
            qor_id_hash: [u8; 32],
            account: T::AccountId,
            username: Vec<u8>,
            qor_key: [u8; 6],
        },

        /// Account linked to Qor ID
        /// [qor_id_hash, new_account]
        AccountLinked {
            qor_id_hash: [u8; 32],
            new_account: T::AccountId,
        },

        /// Account unlinked from Qor ID
        /// [qor_id_hash, removed_account]
        AccountUnlinked {
            qor_id_hash: [u8; 32],
            removed_account: T::AccountId,
        },

        /// Attestation added
        /// [qor_id_hash, attestation_type]
        AttestationAdded {
            qor_id_hash: [u8; 32],
            attestation_type: AttestationType,
        },

        /// Identity suspended
        /// [qor_id_hash]
        IdentitySuspended { qor_id_hash: [u8; 32] },

        /// Identity recovered
        /// [qor_id_hash, new_primary_account]
        IdentityRecovered {
            qor_id_hash: [u8; 32],
            new_primary_account: T::AccountId,
        },
    }

    #[pallet::error]
    pub enum Error<T> {
        /// Username too short (min 3 characters)
        UsernameTooShort,
        /// Username too long (max 20 characters)
        UsernameTooLong,
        /// Invalid username characters (alphanumeric and underscore only)
        InvalidUsername,
        /// Username already taken (not available)
        UsernameAlreadyTaken,
        /// Account already has a Qor ID
        AccountAlreadyRegistered,
        /// Qor ID not found
        IdentityNotFound,
        /// Not authorized to modify this identity
        NotAuthorized,
        /// Cannot link more accounts (max 10)
        MaxLinkedAccounts,
        /// Account already linked
        AccountAlreadyLinked,
        /// Cannot unlink primary account
        CannotUnlinkPrimary,
        /// Identity is suspended
        IdentitySuspended,
        /// Insufficient balance for registration
        InsufficientBalance,
        /// Attestation limit reached
        MaxAttestations,
    }

    #[pallet::call]
    impl<T: Config> Pallet<T> {
        /// Register a new Qor ID.
        ///
        /// Burns the registration fee (5 CGT default).
        ///
        /// # Arguments
        /// * `username` - Desired username (3-20 alphanumeric chars)
        #[pallet::call_index(0)]
        #[pallet::weight(T::WeightInfo::register())]
        pub fn register(
            origin: OriginFor<T>,
            username: Vec<u8>,
        ) -> DispatchResult {
            let who = ensure_signed(origin)?;

            // Validate username
            ensure!(
                username.len() >= MIN_USERNAME_LENGTH as usize,
                Error::<T>::UsernameTooShort
            );
            ensure!(
                username.len() <= MAX_USERNAME_LENGTH as usize,
                Error::<T>::UsernameTooLong
            );
            ensure!(
                username.iter().all(|c| c.is_ascii_alphanumeric() || *c == b'_'),
                Error::<T>::InvalidUsername
            );

            // Check account doesn't already have identity
            ensure!(
                AccountToIdentity::<T>::get(&who).is_none(),
                Error::<T>::AccountAlreadyRegistered
            );

            // Convert to lowercase BoundedVec
            let username_lower: Vec<u8> = username.iter().map(|c| c.to_ascii_lowercase()).collect();
            let username_bounded: BoundedVec<u8, ConstU32<MAX_USERNAME_LENGTH>> = username_lower
                .clone()
                .try_into()
                .map_err(|_| Error::<T>::UsernameTooLong)?;

            // Check username availability (globally unique)
            ensure!(
                !Usernames::<T>::contains_key(&username_bounded),
                Error::<T>::UsernameAlreadyTaken
            );

            // Generate Qor Key from account
            let qor_key = Self::generate_qor_key(&who);

            // Charge registration fee (burned)
            let fee = T::RegistrationFee::get();
            T::Currency::withdraw(
                &who,
                fee,
                frame_support::traits::WithdrawReasons::FEE,
                frame_support::traits::ExistenceRequirement::KeepAlive,
            )?;

            // Create identity (username-only, no discriminator)
            let qor_id_hash = sp_core::blake2_256(&username_bounded);
            let identity = QorIdentity {
                username: username_bounded.clone(),
                qor_key,
                primary_account: who.clone(),
                linked_accounts: BoundedVec::default(),
                status: IdentityStatus::Active,
                registered_at: frame_system::Pallet::<T>::block_number(),
                attestations: BoundedVec::default(),
            };

            // Store identity and username mapping
            Identities::<T>::insert(qor_id_hash, identity);
            AccountToIdentity::<T>::insert(&who, qor_id_hash);
            Usernames::<T>::insert(&username_bounded, &who);

            // Increment total
            TotalIdentities::<T>::mutate(|total| *total = total.saturating_add(1));

            // Emit event
            Self::deposit_event(Event::IdentityRegistered {
                qor_id_hash,
                account: who,
                username: username_lower,
                qor_key,
            });

            Ok(())
        }

        /// Link an additional account to existing Qor ID.
        ///
        /// Must be called by the primary account owner.
        ///
        /// # Arguments
        /// * `new_account` - Account to link
        #[pallet::call_index(1)]
        #[pallet::weight(T::WeightInfo::link_account())]
        pub fn link_account(
            origin: OriginFor<T>,
            new_account: T::AccountId,
        ) -> DispatchResult {
            let who = ensure_signed(origin)?;

            // Get caller's identity
            let qor_id_hash = AccountToIdentity::<T>::get(&who)
                .ok_or(Error::<T>::IdentityNotFound)?;

            // Verify caller is primary account
            Identities::<T>::try_mutate(qor_id_hash, |maybe_identity| {
                let identity = maybe_identity.as_mut().ok_or(Error::<T>::IdentityNotFound)?;
                ensure!(identity.primary_account == who, Error::<T>::NotAuthorized);
                ensure!(identity.status == IdentityStatus::Active, Error::<T>::IdentitySuspended);

                // Check new account isn't already registered
                ensure!(
                    AccountToIdentity::<T>::get(&new_account).is_none(),
                    Error::<T>::AccountAlreadyLinked
                );

                // Add to linked accounts
                identity
                    .linked_accounts
                    .try_push(new_account.clone())
                    .map_err(|_| Error::<T>::MaxLinkedAccounts)?;

                // Map new account to identity
                AccountToIdentity::<T>::insert(&new_account, qor_id_hash);

                Self::deposit_event(Event::AccountLinked {
                    qor_id_hash,
                    new_account,
                });

                Ok(())
            })
        }

        /// Unlink an account from Qor ID.
        ///
        /// Cannot unlink the primary account.
        ///
        /// # Arguments
        /// * `account` - Account to unlink
        #[pallet::call_index(2)]
        #[pallet::weight(T::WeightInfo::unlink_account())]
        pub fn unlink_account(
            origin: OriginFor<T>,
            account: T::AccountId,
        ) -> DispatchResult {
            let who = ensure_signed(origin)?;

            let qor_id_hash = AccountToIdentity::<T>::get(&who)
                .ok_or(Error::<T>::IdentityNotFound)?;

            Identities::<T>::try_mutate(qor_id_hash, |maybe_identity| {
                let identity = maybe_identity.as_mut().ok_or(Error::<T>::IdentityNotFound)?;
                ensure!(identity.primary_account == who, Error::<T>::NotAuthorized);
                ensure!(account != identity.primary_account, Error::<T>::CannotUnlinkPrimary);

                // Remove from linked accounts
                identity.linked_accounts.retain(|a| a != &account);

                // Remove mapping
                AccountToIdentity::<T>::remove(&account);

                Self::deposit_event(Event::AccountUnlinked {
                    qor_id_hash,
                    removed_account: account,
                });

                Ok(())
            })
        }

        /// Add a ZK attestation to identity.
        ///
        /// Only callable by root (bridge from off-chain verifier).
        ///
        /// # Arguments
        /// * `qor_id_hash` - Identity to add attestation to
        /// * `attestation` - The attestation data
        #[pallet::call_index(3)]
        #[pallet::weight(T::WeightInfo::add_attestation())]
        pub fn add_attestation(
            origin: OriginFor<T>,
            qor_id_hash: [u8; 32],
            attestation: Attestation,
        ) -> DispatchResult {
            // Only root can add attestations (from off-chain bridge)
            ensure_root(origin)?;

            Identities::<T>::try_mutate(qor_id_hash, |maybe_identity| {
                let identity = maybe_identity.as_mut().ok_or(Error::<T>::IdentityNotFound)?;

                identity
                    .attestations
                    .try_push(attestation.clone())
                    .map_err(|_| Error::<T>::MaxAttestations)?;

                Self::deposit_event(Event::AttestationAdded {
                    qor_id_hash,
                    attestation_type: attestation.attestation_type,
                });

                Ok(())
            })
        }
    }

    impl<T: Config> Pallet<T> {
        /// Generate Qor Key short format: Q[3-hex]:[3-hex]
        /// Derivation: First 3 bytes + Last 3 bytes of AccountId
        pub fn generate_qor_key(account: &T::AccountId) -> [u8; 6] {
            use codec::Encode;
            let account_bytes = account.encode();
            let mut key = [0u8; 6];
            
            // First 3 bytes
            key[0] = account_bytes[0];
            key[1] = account_bytes[1];
            key[2] = account_bytes[2];
            
            // Last 3 bytes
            let len = account_bytes.len();
            key[3] = account_bytes[len - 3];
            key[4] = account_bytes[len - 2];
            key[5] = account_bytes[len - 1];
            
            key
        }
        
        /// Format Qor Key for display: "Q7A1:9F2"
        pub fn format_qor_key(key: &[u8; 6]) -> Vec<u8> {
            use sp_std::vec;
            let formatted = sp_std::format!(
                "Q{:02X}{:02X}:{:02X}{:02X}",
                key[0], key[1], key[3], key[4]
            );
            formatted.into_bytes()
        }
        
        /// Check if username is available (real-time UI check)
        pub fn check_availability(username: Vec<u8>) -> bool {
            let username_lower: Vec<u8> = username
                .iter()
                .map(|c| c.to_ascii_lowercase())
                .collect();
            
            let username_bounded: Result<BoundedVec<u8, ConstU32<MAX_USERNAME_LENGTH>>, _> = 
                username_lower.try_into();
            
            match username_bounded {
                Ok(bounded) => !Usernames::<T>::contains_key(&bounded),
                Err(_) => false,
            }
        }
    }
}
