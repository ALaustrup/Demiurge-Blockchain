# Yield-Generating NFTs Pallet

**Phase 11: Revolutionary Features** - NFTs that earn passive income through staking and revenue sharing.

## Overview

This pallet enables NFTs to generate yield through:
- **Staking**: Stake NFTs to earn rewards over time
- **Revenue Sharing**: Receive a percentage of game revenue
- **Yield Accumulation**: Yield accumulates in a yield pool per NFT
- **Claimable Rewards**: Owners can claim accumulated yield

## Key Features

### Staking Mechanism
- Stake NFTs for a specified duration (or indefinite)
- Yield accumulates based on staking duration and yield rate
- Minimum and maximum staking durations configurable
- Soulbound NFTs cannot be staked

### Yield Calculation
- Yield rate per block (configurable)
- Calculated as: `duration * yield_rate_per_block`
- Supports both fixed-duration and indefinite staking

### Revenue Sharing
- Games can share revenue with staked NFTs
- Revenue is added to the NFT's yield pool
- Separate tracking of staking yield vs revenue sharing

### Claiming
- Claim yield without unstaking (keeps NFT staked)
- Unstake NFT to claim all accumulated yield
- Automatic yield calculation on claim/unstake

## Integration with DRC-369

This pallet integrates with the DRC-369 NFT standard:
- Uses `ItemOwners` storage to verify ownership
- Uses `Items` storage to check soulbound status
- Respects DRC-369 ownership rules

## Storage

- `StakingInfoMap`: Maps NFT UUID to staking information
- `YieldPoolMap`: Maps NFT UUID to yield pool (accumulated yield + revenue)
- `TotalStaked`: Total count of staked NFTs

## Extrinsics

### `stake_nft(nft_uuid, duration)`
Stake an NFT to start earning yield.

**Parameters:**
- `nft_uuid`: The NFT UUID (32 bytes)
- `duration`: Staking duration in blocks (0 = indefinite)

**Requirements:**
- Caller must own the NFT
- NFT must not be soulbound
- NFT must not already be staked
- Duration must meet minimum/maximum requirements

### `unstake_nft(nft_uuid)`
Unstake an NFT and claim all accumulated yield.

**Parameters:**
- `nft_uuid`: The NFT UUID (32 bytes)

**Requirements:**
- Caller must own the NFT
- NFT must be staked

**Returns:**
- All accumulated yield (staking yield + revenue) is transferred to owner

### `claim_yield(nft_uuid)`
Claim accumulated yield without unstaking the NFT.

**Parameters:**
- `nft_uuid`: The NFT UUID (32 bytes)

**Requirements:**
- Caller must own the NFT
- NFT must be staked
- Yield must be available

## Public Functions

### `share_revenue(nft_uuid, amount)`
Share revenue with a staked NFT (called by games/other pallets).

**Parameters:**
- `nft_uuid`: The NFT UUID (32 bytes)
- `amount`: Amount of revenue to share

**Requirements:**
- NFT must be staked

### `get_total_yield(nft_uuid) -> Balance`
Get total yield for an NFT (staking yield + revenue).

**Returns:**
- Total yield amount (staking yield + accumulated yield + revenue shared)

### `is_staked(nft_uuid) -> bool`
Check if an NFT is currently staked.

**Returns:**
- `true` if NFT is staked, `false` otherwise

## Events

- `NftStaked`: Emitted when an NFT is staked
- `NftUnstaked`: Emitted when an NFT is unstaked
- `YieldClaimed`: Emitted when yield is claimed
- `RevenueShared`: Emitted when revenue is shared with an NFT

## Configuration

The pallet requires the following configuration:
- `Currency`: Currency type for yield payments
- `Drc369`: DRC-369 pallet instance
- `MinStakingDuration`: Minimum staking duration in blocks
- `MaxStakingDuration`: Maximum staking duration in blocks (0 = unlimited)
- `DefaultYieldRate`: Default yield rate per block

## Usage Example

```rust
// Stake an NFT for 1000 blocks
YieldNfts::stake_nft(origin, nft_uuid, 1000)?;

// Claim yield without unstaking
YieldNfts::claim_yield(origin, nft_uuid)?;

// Unstake and claim all yield
YieldNfts::unstake_nft(origin, nft_uuid)?;

// Share revenue (called by game pallet)
YieldNfts::share_revenue(&nft_uuid, 1000)?;
```

## Testing

Unit tests are located in `src/tests.rs`. To run tests:

```bash
cargo test --package pallet-yield-nfts
```

## Status

✅ **Implementation Complete**
- Core staking mechanism implemented
- Yield calculation implemented
- Revenue sharing implemented
- DRC-369 integration complete
- Runtime integration complete
- ⏳ Unit tests pending (dependency issue with `time` crate)

## Next Steps

1. Add comprehensive unit tests
2. Add benchmarking for extrinsics
3. Add integration tests with DRC-369
4. Add frontend integration for staking UI
5. Add game integration for revenue sharing
