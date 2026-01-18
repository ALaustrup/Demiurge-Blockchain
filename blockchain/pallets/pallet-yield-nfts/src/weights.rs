//! Weights for the yield NFTs pallet

use frame_support::weights::Weight;

/// Weight information for extrinsics
pub trait WeightInfo {
    fn stake_nft() -> Weight;
    fn unstake_nft() -> Weight;
    fn claim_yield() -> Weight;
}

/// Substrate weight implementation
pub struct SubstrateWeight<T>(sp_std::marker::PhantomData<T>);

impl<T: frame_system::Config> WeightInfo for SubstrateWeight<T> {
    /// Storage: StakingInfoMap (r:1 w:1)
    /// Storage: YieldPoolMap (r:1 w:1)
    /// Storage: TotalStaked (r:1 w:1)
    /// Storage: DRC-369 ItemOwners (r:1)
    /// Storage: DRC-369 Items (r:1)
    fn stake_nft() -> Weight {
        Weight::from_parts(60_000_000, 0)
            .saturating_add(Weight::from_parts(5_000, 0) * 5) // 5 storage reads
            .saturating_add(Weight::from_parts(20_000, 0) * 3) // 3 storage writes
    }

    /// Storage: StakingInfoMap (r:1 w:1)
    /// Storage: YieldPoolMap (r:1 w:1)
    /// Storage: TotalStaked (r:1 w:1)
    /// Storage: DRC-369 ItemOwners (r:1)
    /// Storage: Currency deposit (w:1)
    fn unstake_nft() -> Weight {
        Weight::from_parts(70_000_000, 0)
            .saturating_add(Weight::from_parts(5_000, 0) * 4) // 4 storage reads
            .saturating_add(Weight::from_parts(20_000, 0) * 4) // 4 storage writes
    }

    /// Storage: StakingInfoMap (r:1)
    /// Storage: YieldPoolMap (r:1 w:1)
    /// Storage: DRC-369 ItemOwners (r:1)
    /// Storage: Currency deposit (w:1)
    fn claim_yield() -> Weight {
        Weight::from_parts(50_000_000, 0)
            .saturating_add(Weight::from_parts(5_000, 0) * 3) // 3 storage reads
            .saturating_add(Weight::from_parts(20_000, 0) * 2) // 2 storage writes
    }
}

/// Default weights for testing
impl WeightInfo for () {
    fn stake_nft() -> Weight {
        Weight::from_parts(60_000_000, 0)
    }
    fn unstake_nft() -> Weight {
        Weight::from_parts(70_000_000, 0)
    }
    fn claim_yield() -> Weight {
        Weight::from_parts(50_000_000, 0)
    }
}
