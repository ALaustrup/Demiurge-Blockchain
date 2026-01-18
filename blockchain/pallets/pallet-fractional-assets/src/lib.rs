//! # Fractional Assets Pallet: Guild-Owned Assets
//!
//! This pallet implements fractionalized utility where multiple players can own shares
//! of a single asset (e.g., a legendary spaceship owned by 100 players).
//!
//! ## Key Features
//!
//! 1. **Shared Ownership**: Multiple accounts own shares of an asset
//! 2. **Scheduling Logic**: Each share grants time-based access (e.g., 1 hour per week)
//! 3. **Voting Rights**: Shareholders can vote on asset usage
//! 4. **Time-Based Access**: L1 scheduling logic manages access periods

#![cfg_attr(not(feature = "std"), no_std)]

pub use pallet::*;

#[frame_support::pallet]
pub mod pallet {
    use frame_support::{
        pallet_prelude::*,
        traits::Get,
    };
    use frame_system::pallet_prelude::*;
    use sp_runtime::traits::{Saturating, UniqueSaturatedInto, Zero};
    use sp_std::prelude::*;

    /// Maximum number of shares per asset
    pub const MAX_SHARES_PER_ASSET: u32 = 1000;
    
    /// Maximum number of assets per account
    pub const MAX_ASSETS_PER_ACCOUNT: u32 = 100;

    /// Share information
    #[derive(Clone, Encode, Decode, Eq, PartialEq, RuntimeDebug, TypeInfo, MaxEncodedLen)]
    #[scale_info(skip_type_params(T))]
    pub struct Share<T: Config> {
        /// Shareholder account
        pub owner: T::AccountId,
        
        /// Number of shares owned
        pub share_count: u32,
        
        /// Time allocation per share (in blocks)
        pub time_per_share: BlockNumberFor<T>,
        
        /// Last time access was used
        pub last_access_block: BlockNumberFor<T>,
        
        /// Total time used this period
        pub time_used_this_period: BlockNumberFor<T>,
    }

    /// Fractional asset
    #[derive(Clone, Encode, Decode, Eq, PartialEq, RuntimeDebug, TypeInfo, MaxEncodedLen)]
    #[scale_info(skip_type_params(T))]
    pub struct FractionalAsset<T: Config> {
        /// Base NFT UUID (from DRC-369)
        pub base_uuid: [u8; 32],
        
        /// Total shares issued
        pub total_shares: u32,
        
        /// Shares by account
        pub shares: BoundedVec<Share<T>, ConstU32<MAX_SHARES_PER_ASSET>>,
        
        /// Current user (if asset is in use)
        pub current_user: Option<T::AccountId>,
        
        /// Block when current usage started
        pub usage_start_block: Option<BlockNumberFor<T>>,
        
        /// Access period reset block
        pub period_reset_block: BlockNumberFor<T>,
        
        /// Period length (in blocks, e.g., 1 week)
        pub period_length: BlockNumberFor<T>,
    }

    #[pallet::config]
    pub trait Config: frame_system::Config + pallet_timestamp::Config {
        type RuntimeEvent: From<Event<Self>> + IsType<<Self as frame_system::Config>::RuntimeEvent>;
        
        /// DRC-369 pallet for NFT ownership verification
        type Drc369: pallet_drc369::Config<AccountId = Self::AccountId>;
    }

    #[pallet::pallet]
    #[pallet::without_storage_info]
    pub struct Pallet<T>(_);

    /// Storage: Fractional assets by base UUID
    #[pallet::storage]
    pub type FractionalAssets<T: Config> = StorageMap<
        _,
        Blake2_128Concat,
        [u8; 32], // base_uuid
        FractionalAsset<T>,
        OptionQuery,
    >;

    /// Storage: Assets owned by account (for quick lookup)
    #[pallet::storage]
    pub type AccountAssets<T: Config> = StorageMap<
        _,
        Blake2_128Concat,
        T::AccountId,
        BoundedVec<[u8; 32], ConstU32<MAX_ASSETS_PER_ACCOUNT>>,
        ValueQuery,
    >;

    #[pallet::event]
    #[pallet::generate_deposit(pub(super) fn deposit_event)]
    pub enum Event<T: Config> {
        /// Fractional asset created [base_uuid, total_shares]
        FractionalAssetCreated {
            base_uuid: [u8; 32],
            total_shares: u32,
        },
        
        /// Shares purchased [base_uuid, buyer, share_count]
        SharesPurchased {
            base_uuid: [u8; 32],
            buyer: T::AccountId,
            share_count: u32,
        },
        
        /// Asset access started [base_uuid, user, duration]
        AssetAccessStarted {
            base_uuid: [u8; 32],
            user: T::AccountId,
            duration: BlockNumberFor<T>,
        },
        
        /// Asset access ended [base_uuid, user]
        AssetAccessEnded {
            base_uuid: [u8; 32],
            user: T::AccountId,
        },
    }

    #[pallet::error]
    pub enum Error<T> {
        /// Fractional asset not found
        AssetNotFound,
        /// Insufficient shares
        InsufficientShares,
        /// Asset already in use
        AssetInUse,
        /// Access period expired
        AccessPeriodExpired,
        /// Not enough time allocation
        InsufficientTimeAllocation,
        /// Not the owner of the base NFT
        NotOwner,
    }

    #[pallet::hooks]
    impl<T: Config> Hooks<BlockNumberFor<T>> for Pallet<T> {
        /// Reset access periods and end expired usage
        fn on_initialize(_n: BlockNumberFor<T>) -> Weight {
            // In production, efficiently iterate and reset periods
            // For now, this is handled on-demand
            Weight::from_parts(1_000, 0)
        }
    }

    #[pallet::call]
    impl<T: Config> Pallet<T> {
        /// Create a fractional asset from a base NFT
        #[pallet::call_index(0)]
        #[pallet::weight(50_000)]
        pub fn create_fractional_asset(
            origin: OriginFor<T>,
            base_uuid: [u8; 32],
            total_shares: u32,
            time_per_share: BlockNumberFor<T>,
            period_length: BlockNumberFor<T>,
        ) -> DispatchResult {
            let creator = ensure_signed(origin)?;
            
            // Verify base_uuid exists in DRC-369 pallet and creator owns it
            let nft_owner = pallet_drc369::ItemOwners::<T::Drc369>::get(&base_uuid)
                .ok_or(Error::<T>::AssetNotFound)?;
            ensure!(nft_owner == creator, Error::<T>::AssetNotFound);
            
            // Verify the NFT actually exists in Items storage
            ensure!(
                pallet_drc369::Items::<T::Drc369>::contains_key(&base_uuid),
                Error::<T>::AssetNotFound
            );
            
            ensure!(
                total_shares <= MAX_SHARES_PER_ASSET,
                Error::<T>::InsufficientShares
            );
            
            let current_block = frame_system::Pallet::<T>::block_number();
            
            let asset = FractionalAsset {
                base_uuid,
                total_shares,
                shares: BoundedVec::new(),
                current_user: None,
                usage_start_block: None,
                period_reset_block: current_block,
                period_length,
            };
            
            FractionalAssets::<T>::insert(base_uuid, &asset);
            
            Self::deposit_event(Event::FractionalAssetCreated {
                base_uuid,
                total_shares,
            });
            
            Ok(())
        }

        /// Purchase shares of a fractional asset
        #[pallet::call_index(1)]
        #[pallet::weight(30_000)]
        pub fn purchase_shares(
            origin: OriginFor<T>,
            base_uuid: [u8; 32],
            share_count: u32,
        ) -> DispatchResult {
            let buyer = ensure_signed(origin)?;
            
            let mut asset = FractionalAssets::<T>::get(&base_uuid)
                .ok_or(Error::<T>::AssetNotFound)?;
            
            // Calculate total shares after purchase
            let current_total: u32 = asset.shares.iter()
                .map(|s| s.share_count)
                .sum();
            
            ensure!(
                current_total + share_count <= asset.total_shares,
                Error::<T>::InsufficientShares
            );
            
            // Find or create share entry
            let share_index = asset.shares.iter()
                .position(|s| s.owner == buyer);
            
            if let Some(idx) = share_index {
                asset.shares[idx].share_count += share_count;
            } else {
                let current_block = frame_system::Pallet::<T>::block_number();
                let time_per_share = asset.shares.first()
                    .map(|s| s.time_per_share)
                    .unwrap_or(BlockNumberFor::<T>::from(1000u32));
                
                let time_per_share_value = if asset.shares.is_empty() {
                    BlockNumberFor::<T>::from(1000u32) // Default: 1000 blocks per share
                } else {
                    asset.shares.first().map(|s| s.time_per_share)
                        .unwrap_or(BlockNumberFor::<T>::from(1000u32))
                };
                
                asset.shares.try_push(Share::<T> {
                    owner: buyer.clone(),
                    share_count,
                    time_per_share: time_per_share_value,
                    last_access_block: current_block,
                    time_used_this_period: Zero::zero(),
                }).map_err(|_| Error::<T>::InsufficientShares)?;
            }
            
            FractionalAssets::<T>::insert(base_uuid, &asset);
            
            // Update account's asset list
            AccountAssets::<T>::mutate(&buyer, |assets| {
                if !assets.iter().any(|&uuid| uuid == base_uuid) {
                    assets.try_push(base_uuid).ok();
                }
            });
            
            Self::deposit_event(Event::SharesPurchased {
                base_uuid,
                buyer,
                share_count,
            });
            
            Ok(())
        }

        /// Start using a fractional asset (if user has available time)
        #[pallet::call_index(2)]
        #[pallet::weight(30_000)]
        pub fn start_asset_access(
            origin: OriginFor<T>,
            base_uuid: [u8; 32],
            duration: BlockNumberFor<T>,
        ) -> DispatchResult {
            let user = ensure_signed(origin)?;
            
            let mut asset = FractionalAssets::<T>::get(&base_uuid)
                .ok_or(Error::<T>::AssetNotFound)?;
            
            ensure!(asset.current_user.is_none(), Error::<T>::AssetInUse);
            
            // Find user's share
            let share = asset.shares.iter_mut()
                .find(|s| s.owner == user)
                .ok_or(Error::<T>::InsufficientShares)?;
            
            // Reset period if needed
            let current_block = frame_system::Pallet::<T>::block_number();
            let needs_reset = current_block >= asset.period_reset_block;
            if needs_reset {
                // Reset all shares
                for s in asset.shares.iter_mut() {
                    s.time_used_this_period = Zero::zero();
                }
                asset.period_reset_block = current_block + asset.period_length;
            }
            
            // Find the share again after potential reset
            let share = asset.shares.iter()
                .find(|s| s.owner == user)
                .ok_or(Error::<T>::InsufficientShares)?;
            
            // Calculate available time
            let time_per_share_u64: u64 = share.time_per_share.unique_saturated_into();
            let time_used_u64: u64 = share.time_used_this_period.unique_saturated_into();
            let duration_u64: u64 = duration.unique_saturated_into();
            
            let total_time_allocation = (share.share_count as u64).saturating_mul(time_per_share_u64);
            let available_time = total_time_allocation.saturating_sub(time_used_u64);
            
            ensure!(
                duration_u64 <= available_time,
                Error::<T>::InsufficientTimeAllocation
            );
            
            // Start usage
            asset.current_user = Some(user.clone());
            asset.usage_start_block = Some(current_block);
            
            FractionalAssets::<T>::insert(base_uuid, &asset);
            
            Self::deposit_event(Event::AssetAccessStarted {
                base_uuid,
                user,
                duration,
            });
            
            Ok(())
        }

        /// End asset access (called automatically or manually)
        #[pallet::call_index(3)]
        #[pallet::weight(20_000)]
        pub fn end_asset_access(
            origin: OriginFor<T>,
            base_uuid: [u8; 32],
        ) -> DispatchResult {
            let user = ensure_signed(origin)?;
            
            let mut asset = FractionalAssets::<T>::get(&base_uuid)
                .ok_or(Error::<T>::AssetNotFound)?;
            
            ensure!(
                asset.current_user == Some(user.clone()),
                Error::<T>::AssetNotFound
            );
            
            // Calculate time used
            let current_block = frame_system::Pallet::<T>::block_number();
            let usage_start = asset.usage_start_block
                .ok_or(Error::<T>::AssetNotFound)?;
            let time_used = current_block.saturating_sub(usage_start);
            
            // Update share's time used
            if let Some(share) = asset.shares.iter_mut().find(|s| s.owner == user) {
                share.time_used_this_period = share.time_used_this_period.saturating_add(time_used);
                share.last_access_block = current_block;
            }
            
            // End usage
            asset.current_user = None;
            asset.usage_start_block = None;
            
            FractionalAssets::<T>::insert(base_uuid, &asset);
            
            Self::deposit_event(Event::AssetAccessEnded {
                base_uuid,
                user,
            });
            
            Ok(())
        }
    }
}
