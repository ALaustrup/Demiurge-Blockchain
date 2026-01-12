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
//! ## Identity Format
//!
//! `username#discriminator` (e.g., `alaustrup#1337`)
//! - Username: 3-20 alphanumeric characters
//! - Discriminator: 0001-9999

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
    
    /// Maximum discriminator value
    pub const MAX_DISCRIMINATOR: u16 = 9999;

    /// Type alias for balance
    pub type BalanceOf<T> =
        <<T as Config>::Currency as Currency<<T as frame_system::Config>::AccountId>>::Balance;

    /// Qor ID structure stored on-chain
    #[derive(Clone, Encode, Decode, Eq, PartialEq, RuntimeDebug, TypeInfo, MaxEncodedLen)]
    #[scale_info(skip_type_params(T))]
    pub struct QorIdentity<T: Config> {
        /// Username (lowercase, 3-20 chars)
        pub username: BoundedVec<u8, ConstU32<MAX_USERNAME_LENGTH>>,
        /// Discriminator (0001-9999)
        pub discriminator: u16,
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

    /// Map from username to used discriminators
    #[pallet::storage]
    #[pallet::getter(fn username_discriminators)]
    pub type UsernameDiscriminators<T: Config> = StorageMap<
        _,
        Blake2_128Concat,
        BoundedVec<u8, ConstU32<MAX_USERNAME_LENGTH>>,
        BoundedVec<u16, ConstU32<{ MAX_DISCRIMINATOR as u32 }>>,
        ValueQuery,
    >;

    /// Total registered identities
    #[pallet::storage]
    #[pallet::getter(fn total_identities)]
    pub type TotalIdentities<T> = StorageValue<_, u64, ValueQuery>;

    #[pallet::event]
    #[pallet::generate_deposit(pub(super) fn deposit_event)]
    pub enum Event<T: Config> {
        /// New Qor ID registered
        /// [qor_id_hash, account, username, discriminator]
        IdentityRegistered {
            qor_id_hash: [u8; 32],
            account: T::AccountId,
            username: Vec<u8>,
            discriminator: u16,
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
        /// No discriminator available for this username
        NoDiscriminatorAvailable,
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

            // Find available discriminator
            let discriminator = Self::find_available_discriminator(&username_bounded)?;

            // Charge registration fee (burned)
            let fee = T::RegistrationFee::get();
            T::Currency::withdraw(
                &who,
                fee,
                frame_support::traits::WithdrawReasons::FEE,
                frame_support::traits::ExistenceRequirement::KeepAlive,
            )?;

            // Create identity
            let qor_id_hash = Self::compute_qor_id_hash(&username_bounded, discriminator);
            let identity = QorIdentity {
                username: username_bounded.clone(),
                discriminator,
                primary_account: who.clone(),
                linked_accounts: BoundedVec::default(),
                status: IdentityStatus::Active,
                registered_at: frame_system::Pallet::<T>::block_number(),
                attestations: BoundedVec::default(),
            };

            // Store identity
            Identities::<T>::insert(qor_id_hash, identity);
            AccountToIdentity::<T>::insert(&who, qor_id_hash);

            // Update discriminator tracking
            UsernameDiscriminators::<T>::mutate(&username_bounded, |discs| {
                let _ = discs.try_push(discriminator);
            });

            // Increment total
            TotalIdentities::<T>::mutate(|total| *total = total.saturating_add(1));

            // Emit event
            Self::deposit_event(Event::IdentityRegistered {
                qor_id_hash,
                account: who,
                username: username_lower,
                discriminator,
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
        /// Compute the hash for a Qor ID
        pub fn compute_qor_id_hash(
            username: &BoundedVec<u8, ConstU32<MAX_USERNAME_LENGTH>>,
            discriminator: u16,
        ) -> [u8; 32] {
            let mut input = username.to_vec();
            input.push(b'#');
            input.extend_from_slice(&discriminator.to_le_bytes());
            sp_core::blake2_256(&input)
        }

        /// Find an available discriminator for a username
        fn find_available_discriminator(
            username: &BoundedVec<u8, ConstU32<MAX_USERNAME_LENGTH>>,
        ) -> Result<u16, Error<T>> {
            let used = UsernameDiscriminators::<T>::get(username);

            for d in 1..=MAX_DISCRIMINATOR {
                if !used.contains(&d) {
                    return Ok(d);
                }
            }

            Err(Error::<T>::NoDiscriminatorAvailable)
        }

        /// Format Qor ID string (for display)
        pub fn format_qor_id(
            username: &[u8],
            discriminator: u16,
        ) -> Vec<u8> {
            let mut result = username.to_vec();
            result.push(b'#');
            result.extend_from_slice(format!("{:04}", discriminator).as_bytes());
            result
        }
    }
}
