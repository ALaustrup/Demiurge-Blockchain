//! # Yield-Generating NFTs Pallet
//!
//! NFTs that earn passive income through staking and revenue sharing from games.
//!
//! ## Overview
//!
//! This pallet enables NFTs to generate yield through:
//! - **Staking**: Stake NFTs to earn rewards over time
//! - **Revenue Sharing**: Receive a percentage of game revenue
//! - **Yield Accumulation**: Yield accumulates in a yield pool per NFT
//! - **Claimable Rewards**: Owners can claim accumulated yield
//!
//! ## Key Features
//!
//! - Staking/unstaking NFTs
//! - Yield calculation based on staking duration
//! - Revenue sharing from games
//! - Yield pool management per NFT
//! - Claimable yield rewards
//! - Integration with DRC-369 NFT standard

#![cfg_attr(not(feature = "std"), no_std)]

pub use pallet::*;

#[cfg(test)]
mod mock;

#[cfg(test)]
mod tests;

#[cfg(feature = "runtime-benchmarks")]
mod benchmarking;

pub mod weights;
pub use weights::WeightInfo;

#[frame_support::pallet]
pub mod pallet {
    use frame_support::{
        pallet_prelude::*,
        traits::{Currency, ReservableCurrency},
    };
    use frame_system::pallet_prelude::*;
    use sp_runtime::traits::{Saturating, UniqueSaturatedInto, Zero};
    use sp_std::prelude::*;
    use crate::weights::WeightInfo;

    /// Type alias for balance
    pub type BalanceOf<T> =
        <<T as Config>::Currency as Currency<<T as frame_system::Config>::AccountId>>::Balance;
    
    // Helper function to convert BlockNumber to Balance
    // Since Balance is u128 in the runtime, we can safely convert u64 to u128
    fn block_number_to_balance<T: Config>(block_num: BlockNumberFor<T>) -> BalanceOf<T>
    where
        BalanceOf<T>: sp_runtime::traits::AtLeast32BitUnsigned,
    {
        // Convert BlockNumber -> u64 -> Balance
        let block_u64: u64 = block_num.unique_saturated_into();
        // Use TryInto with a fallback, or use a direct conversion if Balance is u128
        // For now, use saturating conversion through u128
        let block_u128: u128 = block_u64 as u128;
        block_u128.unique_saturated_into()
    }

    /// NFT UUID type (32 bytes)
    pub type NftUuid = [u8; 32];

    /// Staking information for an NFT
    #[derive(Clone, Encode, Decode, Eq, PartialEq, RuntimeDebug, TypeInfo, MaxEncodedLen)]
    pub struct StakingInfo<BlockNumber, Balance> {
        /// Block number when staking started
        pub staked_at: BlockNumber,
        /// Staking duration in blocks (0 = indefinite)
        pub duration: BlockNumber,
        /// Yield rate per block (in smallest units)
        pub yield_rate_per_block: Balance,
    }

    /// Yield pool information for an NFT
    #[derive(Clone, Encode, Decode, Eq, PartialEq, RuntimeDebug, TypeInfo, MaxEncodedLen)]
    #[scale_info(skip_type_params(T))]
    pub struct YieldPool<T: Config> {
        /// Total accumulated yield
        pub accumulated_yield: BalanceOf<T>,
        /// Total revenue shared
        pub revenue_shared: BalanceOf<T>,
        /// Last update block
        pub last_updated: BlockNumberFor<T>,
    }
    
    impl<T: Config> Default for YieldPool<T> {
        fn default() -> Self {
            Self {
                accumulated_yield: Zero::zero(),
                revenue_shared: Zero::zero(),
                last_updated: Zero::zero(),
            }
        }
    }


    #[pallet::pallet]
    pub struct Pallet<T>(_);

    #[pallet::config]
    pub trait Config: frame_system::Config {
        type RuntimeEvent: From<Event<Self>> + IsType<<Self as frame_system::Config>::RuntimeEvent>;

        /// Currency for yield payments
        type Currency: Currency<Self::AccountId> + ReservableCurrency<Self::AccountId>;

        /// DRC-369 pallet for NFT operations
        type Drc369: pallet_drc369::Config<AccountId = Self::AccountId>;

        /// Minimum staking duration in blocks
        #[pallet::constant]
        type MinStakingDuration: Get<BlockNumberFor<Self>>;

        /// Maximum staking duration in blocks (0 = unlimited)
        #[pallet::constant]
        type MaxStakingDuration: Get<BlockNumberFor<Self>>;

        /// Default yield rate per block (in smallest currency units)
        #[pallet::constant]
        type DefaultYieldRate: Get<BalanceOf<Self>>;

        /// Weight information
        type WeightInfo: crate::weights::WeightInfo;
    }

    /// Map from NFT UUID to staking information
    #[pallet::storage]
    #[pallet::getter(fn staking_info)]
    pub type StakingInfoMap<T: Config> = StorageMap<
        _,
        Blake2_128Concat,
        NftUuid,
        StakingInfo<BlockNumberFor<T>, BalanceOf<T>>,
        OptionQuery,
    >;

    /// Map from NFT UUID to yield pool
    #[pallet::storage]
    #[pallet::getter(fn yield_pool)]
    pub type YieldPoolMap<T: Config> = StorageMap<
        _,
        Blake2_128Concat,
        NftUuid,
        YieldPool<T>,
        ValueQuery,
    >;

    /// Total staked NFTs count
    #[pallet::storage]
    #[pallet::getter(fn total_staked)]
    pub type TotalStaked<T> = StorageValue<_, u64, ValueQuery>;

    #[pallet::event]
    #[pallet::generate_deposit(pub(super) fn deposit_event)]
    pub enum Event<T: Config> {
        /// NFT has been staked. [nft_uuid, owner, staked_at, duration, yield_rate]
        NftStaked {
            nft_uuid: NftUuid,
            owner: T::AccountId,
            staked_at: BlockNumberFor<T>,
            duration: BlockNumberFor<T>,
            yield_rate_per_block: BalanceOf<T>,
        },
        /// NFT has been unstaked. [nft_uuid, owner, yield_claimed]
        NftUnstaked {
            nft_uuid: NftUuid,
            owner: T::AccountId,
            yield_claimed: BalanceOf<T>,
        },
        /// Yield has been claimed. [nft_uuid, owner, amount]
        YieldClaimed {
            nft_uuid: NftUuid,
            owner: T::AccountId,
            amount: BalanceOf<T>,
        },
        /// Revenue has been shared to NFT. [nft_uuid, amount]
        RevenueShared {
            nft_uuid: NftUuid,
            amount: BalanceOf<T>,
        },
    }

    #[pallet::error]
    pub enum Error<T> {
        /// NFT is already staked
        AlreadyStaked,
        /// NFT is not staked
        NotStaked,
        /// NFT not found in DRC-369
        NftNotFound,
        /// Caller is not the owner of the NFT
        NotOwner,
        /// Staking duration is too short
        DurationTooShort,
        /// Staking duration exceeds maximum
        DurationExceedsMax,
        /// No yield available to claim
        NoYieldAvailable,
        /// NFT is soulbound and cannot be staked
        SoulboundNft,
    }

    #[pallet::call]
    impl<T: Config> Pallet<T> {
        /// Stake an NFT to start earning yield
        /// 
        /// The NFT must be owned by the caller and not already staked.
        /// Yield accumulates based on the yield rate and staking duration.
        #[pallet::call_index(0)]
        #[pallet::weight(T::WeightInfo::stake_nft())]
        pub fn stake_nft(
            origin: OriginFor<T>,
            nft_uuid: NftUuid,
            duration: BlockNumberFor<T>,
        ) -> DispatchResult {
            let owner = ensure_signed(origin)?;

            // Verify NFT exists and is owned by caller
            let nft_owner = pallet_drc369::ItemOwners::<T::Drc369>::get(&nft_uuid)
                .ok_or(Error::<T>::NftNotFound)?;
            ensure!(nft_owner == owner, Error::<T>::NotOwner);

            // Verify NFT is not soulbound (soulbound NFTs cannot be staked)
            let asset = pallet_drc369::Items::<T::Drc369>::get(&nft_uuid)
                .ok_or(Error::<T>::NftNotFound)?;
            ensure!(!asset.is_soulbound, Error::<T>::SoulboundNft);

            // Verify not already staked
            ensure!(!StakingInfoMap::<T>::contains_key(&nft_uuid), Error::<T>::AlreadyStaked);

            // Verify duration
            ensure!(
                duration >= T::MinStakingDuration::get(),
                Error::<T>::DurationTooShort
            );
            if !T::MaxStakingDuration::get().is_zero() {
                ensure!(
                    duration <= T::MaxStakingDuration::get(),
                    Error::<T>::DurationExceedsMax
                );
            }

            let current_block = <frame_system::Pallet<T>>::block_number();
            let yield_rate = T::DefaultYieldRate::get();

            // Store staking information
            StakingInfoMap::<T>::insert(
                &nft_uuid,
                StakingInfo {
                    staked_at: current_block,
                    duration,
                    yield_rate_per_block: yield_rate,
                },
            );

            // Initialize yield pool if not exists
            YieldPoolMap::<T>::insert(
                &nft_uuid,
                YieldPool::<T> {
                    accumulated_yield: Zero::zero(),
                    revenue_shared: Zero::zero(),
                    last_updated: current_block,
                },
            );

            // Update total staked count
            TotalStaked::<T>::mutate(|count| *count += 1);

            Self::deposit_event(Event::NftStaked {
                nft_uuid,
                owner: owner.clone(),
                staked_at: current_block,
                duration,
                yield_rate_per_block: yield_rate,
            });

            Ok(())
        }

        /// Unstake an NFT and claim accumulated yield
        /// 
        /// Calculates yield based on staking duration and claims it to the owner.
        #[pallet::call_index(1)]
        #[pallet::weight(T::WeightInfo::unstake_nft())]
        pub fn unstake_nft(origin: OriginFor<T>, nft_uuid: NftUuid) -> DispatchResult {
            let owner = ensure_signed(origin)?;

            // Verify NFT is staked
            let staking_info = StakingInfoMap::<T>::get(&nft_uuid)
                .ok_or(Error::<T>::NotStaked)?;

            // Verify owner
            let nft_owner = pallet_drc369::ItemOwners::<T::Drc369>::get(&nft_uuid)
                .ok_or(Error::<T>::NftNotFound)?;
            ensure!(nft_owner == owner, Error::<T>::NotOwner);

            let current_block = <frame_system::Pallet<T>>::block_number();

            // Calculate yield based on staking duration
            let staking_duration = if staking_info.duration.is_zero() {
                // Indefinite staking - calculate from staked_at to now
                current_block.saturating_sub(staking_info.staked_at)
            } else {
                // Fixed duration - use minimum of duration and actual staking time
                let actual_duration = current_block.saturating_sub(staking_info.staked_at);
                sp_std::cmp::min(actual_duration, staking_info.duration)
            };

            // Calculate yield: duration * yield_rate_per_block
            // Convert BlockNumber to Balance
            let duration_balance = block_number_to_balance::<T>(staking_duration);
            let yield_amount = staking_info
                .yield_rate_per_block
                .saturating_mul(duration_balance);

            // Get current yield pool
            let mut yield_pool = YieldPoolMap::<T>::get(&nft_uuid);
            let total_yield = yield_pool.accumulated_yield.saturating_add(yield_amount);

            // Transfer yield to owner
            if !total_yield.is_zero() {
                T::Currency::deposit_creating(&owner, total_yield);
            }

            // Remove staking information
            StakingInfoMap::<T>::remove(&nft_uuid);

            // Update yield pool
            yield_pool.accumulated_yield = Zero::zero();
            yield_pool.last_updated = current_block;
            YieldPoolMap::<T>::insert(&nft_uuid, yield_pool);

            // Update total staked count
            TotalStaked::<T>::mutate(|count| *count = count.saturating_sub(1));

            Self::deposit_event(Event::NftUnstaked {
                nft_uuid,
                owner: owner.clone(),
                yield_claimed: total_yield,
            });

            Ok(())
        }

        /// Claim accumulated yield without unstaking
        /// 
        /// Allows NFT owners to claim yield while keeping the NFT staked.
        #[pallet::call_index(2)]
        #[pallet::weight(T::WeightInfo::claim_yield())]
        pub fn claim_yield(origin: OriginFor<T>, nft_uuid: NftUuid) -> DispatchResult {
            let owner = ensure_signed(origin)?;

            // Verify NFT is staked
            let staking_info = StakingInfoMap::<T>::get(&nft_uuid)
                .ok_or(Error::<T>::NotStaked)?;

            // Verify owner
            let nft_owner = pallet_drc369::ItemOwners::<T::Drc369>::get(&nft_uuid)
                .ok_or(Error::<T>::NftNotFound)?;
            ensure!(nft_owner == owner, Error::<T>::NotOwner);

            let current_block = <frame_system::Pallet<T>>::block_number();

            // Calculate yield since last update
            let blocks_since_update = current_block.saturating_sub(staking_info.staked_at);
            let blocks_balance = block_number_to_balance::<T>(blocks_since_update);
            let new_yield = staking_info
                .yield_rate_per_block
                .saturating_mul(blocks_balance);

            // Get current yield pool
            let mut yield_pool = YieldPoolMap::<T>::get(&nft_uuid);
            let total_yield = yield_pool.accumulated_yield.saturating_add(new_yield);

            ensure!(!total_yield.is_zero(), Error::<T>::NoYieldAvailable);

            // Transfer yield to owner
            T::Currency::deposit_creating(&owner, total_yield);

            // Reset accumulated yield
            yield_pool.accumulated_yield = Zero::zero();
            yield_pool.last_updated = current_block;
            YieldPoolMap::<T>::insert(&nft_uuid, yield_pool);

            Self::deposit_event(Event::YieldClaimed {
                nft_uuid,
                owner,
                amount: total_yield,
            });

            Ok(())
        }
    }

    impl<T: Config> Pallet<T> {
        /// Share revenue with a staked NFT
        /// 
        /// This function can be called by games or other pallets to share revenue
        /// with staked NFTs. The revenue is added to the NFT's yield pool.
        pub fn share_revenue(nft_uuid: &NftUuid, amount: BalanceOf<T>) -> DispatchResult {
            // Verify NFT is staked
            ensure!(
                StakingInfoMap::<T>::contains_key(nft_uuid),
                Error::<T>::NotStaked
            );

            // Update yield pool
            YieldPoolMap::<T>::mutate(nft_uuid, |pool| {
                pool.revenue_shared = pool.revenue_shared.saturating_add(amount);
            });

            Self::deposit_event(Event::RevenueShared {
                nft_uuid: *nft_uuid,
                amount,
            });

            Ok(())
        }

        /// Get total yield for an NFT (staking yield + revenue)
        pub fn get_total_yield(nft_uuid: &NftUuid) -> BalanceOf<T> {
            if let Some(staking_info) = StakingInfoMap::<T>::get(nft_uuid) {
                let current_block = <frame_system::Pallet<T>>::block_number();
                let blocks_staked = current_block.saturating_sub(staking_info.staked_at);
                let blocks_balance = block_number_to_balance::<T>(blocks_staked);
                let staking_yield = staking_info
                    .yield_rate_per_block
                    .saturating_mul(blocks_balance);

                let yield_pool = YieldPoolMap::<T>::get(nft_uuid);
                staking_yield
                    .saturating_add(yield_pool.accumulated_yield)
                    .saturating_add(yield_pool.revenue_shared)
            } else {
                Zero::zero()
            }
        }

        /// Check if an NFT is currently staked
        pub fn is_staked(nft_uuid: &NftUuid) -> bool {
            StakingInfoMap::<T>::contains_key(nft_uuid)
        }
    }

    #[pallet::hooks]
    impl<T: Config> Hooks<BlockNumberFor<T>> for Pallet<T> {
        /// Update yield pools on each block
        fn on_initialize(_n: BlockNumberFor<T>) -> Weight {
            // In a production system, you might want to update yield pools here
            // For now, yield is calculated on-demand when claiming
            Weight::zero()
        }
    }
}
