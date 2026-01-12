# 💰 CREATOR GOD TOKEN (CGT) TOKENOMICS

> *"From the divine treasury, value emanates."*

---

## 📋 Table of Contents

1. [Token Overview](#token-overview)
2. [Supply Distribution](#supply-distribution)
3. [Utility Functions](#utility-functions)
4. [Economic Model](#economic-model)
5. [Governance](#governance)
6. [Technical Implementation](#technical-implementation)
7. [Emission Schedule](#emission-schedule)

---

## Token Overview

### Core Parameters

| Parameter | Value |
|-----------|-------|
| **Name** | Creator God Token |
| **Symbol** | CGT |
| **Total Supply** | 1,000,000,000 (1 Billion) |
| **Precision** | 8 decimals |
| **Smallest Unit** | 0.00000001 CGT |
| **Blockchain** | Demiurge (Substrate) |
| **Standard** | Native / pallet-cgt |

### Denomination Reference

| Name | CGT Value | Smallest Units |
|------|-----------|----------------|
| **1 CGT** | 1.00000000 | 100,000,000 |
| **1 mCGT (milli)** | 0.00100000 | 100,000 |
| **1 μCGT (micro)** | 0.00000100 | 100 |
| **1 Spark** | 0.00000001 | 1 |

---

## Supply Distribution

### Genesis Allocation

```
Total Supply: 1,000,000,000 CGT (100%)
═══════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ████████████████████████████████████░░░░░░░░░░ 35%        │
│  Ecosystem & Community Treasury                             │
│  350,000,000 CGT                                           │
│                                                             │
│  ██████████████████████████░░░░░░░░░░░░░░░░░░░░ 25%        │
│  Staking Rewards (10-year emission)                        │
│  250,000,000 CGT                                           │
│                                                             │
│  ████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 15%        │
│  Team & Advisors (4-year vest, 1-year cliff)               │
│  150,000,000 CGT                                           │
│                                                             │
│  ██████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 10%        │
│  Development Fund                                          │
│  100,000,000 CGT                                           │
│                                                             │
│  ██████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 10%        │
│  Liquidity & Exchange Listings                             │
│  100,000,000 CGT                                           │
│                                                             │
│  █████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 5%         │
│  Early Backers / Private Sale                              │
│  50,000,000 CGT                                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Allocation Details

#### Ecosystem & Community Treasury (35%)

| Purpose | Allocation | Unlock |
|---------|------------|--------|
| Grants Program | 100,000,000 | Governance-controlled |
| Bug Bounties | 25,000,000 | On-demand |
| Community Events | 50,000,000 | Quarterly release |
| Partnerships | 75,000,000 | Governance-controlled |
| Reserve | 100,000,000 | Emergency only |

#### Team & Advisors (15%)

| Milestone | % Unlocked | Cumulative |
|-----------|------------|------------|
| TGE | 0% | 0% |
| Year 1 (Cliff) | 25% | 25% |
| Year 2 | 25% | 50% |
| Year 3 | 25% | 75% |
| Year 4 | 25% | 100% |

---

## Utility Functions

### Primary Uses

```
┌─────────────────────────────────────────────────────────────┐
│                     CGT UTILITY MAP                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   STAKING   │    │ GOVERNANCE  │    │   IN-GAME   │     │
│  │             │    │             │    │   ECONOMY   │     │
│  │ • Validate  │    │ • Vote      │    │ • Purchase  │     │
│  │ • Nominate  │    │ • Propose   │    │ • Trade     │     │
│  │ • Earn      │    │ • Delegate  │    │ • Craft     │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│         │                 │                 │               │
│         └─────────────────┼─────────────────┘               │
│                           │                                 │
│                    ┌──────▼───────┐                        │
│                    │     CGT      │                        │
│                    └──────┬───────┘                        │
│                           │                                 │
│         ┌─────────────────┼─────────────────┐               │
│         │                 │                 │               │
│  ┌──────▼──────┐   ┌──────▼──────┐   ┌──────▼──────┐       │
│  │    FEES     │   │   IDENTITY  │   │    NFTs     │       │
│  │             │   │             │   │             │       │
│  │ • Tx fees   │   │ • Qor ID    │   │ • Minting   │       │
│  │ • Storage   │   │ • Premium   │   │ • Royalties │       │
│  │ • Compute   │   │ • Badges    │   │ • Trading   │       │
│  └─────────────┘   └─────────────┘   └─────────────┘       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Fee Structure

| Action | CGT Cost | Destination |
|--------|----------|-------------|
| Standard Transfer | 0.001 CGT | 80% Burned / 20% Treasury |
| Smart Contract Call | 0.01 CGT base | Validators |
| NFT Minting | 1.0 CGT | 50% Burned / 50% Creator |
| Qor ID Registration | 5.0 CGT | 100% Burned |
| Governance Proposal | 100.0 CGT (refundable) | Locked until vote |

---

## Economic Model

### Deflationary Mechanisms

#### 1. Fee Burning

```
Every transaction burns a portion:

Transfer: 0.001 CGT → 0.0008 CGT burned
                   → 0.0002 CGT to treasury

Annual Burn Estimate (at 1M tx/day):
= 1,000,000 × 0.0008 × 365
= 292,000 CGT/year
```

#### 2. Slashing

Misbehaving validators lose staked CGT:

| Offense | Slash % | Destination |
|---------|---------|-------------|
| Double signing | 10% | Burned |
| Extended downtime | 1% | Treasury |
| Invalid block | 5% | Burned |

#### 3. Identity Burns

Each Qor ID registration burns 5 CGT permanently.

### Inflationary Mechanisms

#### Staking Rewards

| Year | Annual Inflation | Total New CGT |
|------|-----------------|---------------|
| 1 | 5.0% | 50,000,000 |
| 2 | 4.5% | 47,250,000 |
| 3 | 4.0% | 44,100,000 |
| 4 | 3.5% | 40,635,000 |
| 5 | 3.0% | 36,889,500 |
| 6-10 | 2.5%/year | ~125,000,000 |

**Note:** Inflation rate decreases yearly. After year 10, governance decides continuation.

### Net Supply Projection

```
Year 1:  1,000,000,000 + 50,000,000 (staking) - ~500,000 (burns) ≈ 1,049,500,000
Year 5:  ~1,200,000,000 (peak)
Year 10: ~1,350,000,000 (equilibrium estimate)

Long-term: Burn rate designed to eventually exceed inflation
```

---

## Governance

### Voting Power

```
Voting Power = Staked CGT × Time Multiplier

Time Multiplier:
- No lock: 1.0x
- 1 month: 1.1x
- 6 months: 1.5x
- 1 year: 2.0x
- 2 years: 3.0x
```

### Proposal Types

| Type | Threshold | Quorum | Voting Period |
|------|-----------|--------|---------------|
| Parameter Change | 50%+1 | 10% | 7 days |
| Treasury Spend | 60% | 15% | 14 days |
| Protocol Upgrade | 66.67% | 20% | 21 days |
| Emergency | 75% | 25% | 3 days |

### Delegation

Users can delegate voting power while retaining token ownership:

```rust
// Delegation structure
delegate(
    delegatee: AccountId,
    amount: Balance,
    lock_period: Option<Duration>,
    conviction: Conviction,  // 1x to 6x multiplier
)
```

---

## Technical Implementation

### Substrate Pallet Structure

```rust
// pallet-cgt/src/lib.rs

#![cfg_attr(not(feature = "std"), no_std)]

pub use pallet::*;

#[frame_support::pallet]
pub mod pallet {
    use frame_support::{
        pallet_prelude::*,
        traits::{Currency, ReservableCurrency, ExistenceRequirement},
    };
    use frame_system::pallet_prelude::*;
    use sp_runtime::traits::{Zero, Saturating};

    /// CGT precision: 8 decimals
    pub const DECIMALS: u8 = 8;
    
    /// Total supply: 1 billion CGT
    pub const TOTAL_SUPPLY: u128 = 1_000_000_000 * 10u128.pow(DECIMALS as u32);
    
    /// Minimum balance to keep account alive
    pub const EXISTENTIAL_DEPOSIT: u128 = 100_000; // 0.001 CGT

    #[pallet::pallet]
    pub struct Pallet<T>(_);

    #[pallet::config]
    pub trait Config: frame_system::Config {
        type RuntimeEvent: From<Event<Self>> + IsType<<Self as frame_system::Config>::RuntimeEvent>;
        
        /// The currency mechanism
        type Currency: Currency<Self::AccountId> + ReservableCurrency<Self::AccountId>;
        
        /// Burn destination (usually no-op for true burn)
        type BurnDestination: OnUnbalanced<NegativeImbalanceOf<Self>>;
        
        /// Treasury account for fee collection
        #[pallet::constant]
        type TreasuryAccount: Get<Self::AccountId>;
        
        /// Percentage of fees burned (80% = 8000 basis points)
        #[pallet::constant]
        type BurnPercentage: Get<Permill>;
    }

    #[pallet::storage]
    #[pallet::getter(fn total_burned)]
    pub type TotalBurned<T> = StorageValue<_, u128, ValueQuery>;

    #[pallet::storage]
    #[pallet::getter(fn circulating_supply)]
    pub type CirculatingSupply<T> = StorageValue<_, u128, ValueQuery>;

    #[pallet::event]
    #[pallet::generate_deposit(pub(super) fn deposit_event)]
    pub enum Event<T: Config> {
        /// CGT transferred [from, to, amount]
        Transfer {
            from: T::AccountId,
            to: T::AccountId,
            amount: u128,
        },
        /// CGT burned [amount, total_burned]
        Burned {
            amount: u128,
            total_burned: u128,
        },
        /// CGT minted (staking rewards) [to, amount]
        Minted {
            to: T::AccountId,
            amount: u128,
        },
    }

    #[pallet::error]
    pub enum Error<T> {
        /// Insufficient balance for transfer
        InsufficientBalance,
        /// Transfer to self not allowed
        SelfTransfer,
        /// Amount below minimum
        AmountTooLow,
        /// Account would be killed
        WouldKillAccount,
    }

    #[pallet::call]
    impl<T: Config> Pallet<T> {
        /// Transfer CGT with automatic fee deduction
        #[pallet::call_index(0)]
        #[pallet::weight(10_000)]
        pub fn transfer(
            origin: OriginFor<T>,
            to: T::AccountId,
            #[pallet::compact] amount: u128,
        ) -> DispatchResult {
            let from = ensure_signed(origin)?;
            
            ensure!(from != to, Error::<T>::SelfTransfer);
            ensure!(amount > 0, Error::<T>::AmountTooLow);
            
            // Execute transfer with fee handling
            Self::do_transfer(&from, &to, amount)?;
            
            Ok(())
        }

        /// Burn CGT from own account
        #[pallet::call_index(1)]
        #[pallet::weight(10_000)]
        pub fn burn(
            origin: OriginFor<T>,
            #[pallet::compact] amount: u128,
        ) -> DispatchResult {
            let who = ensure_signed(origin)?;
            
            Self::do_burn(&who, amount)?;
            
            Ok(())
        }
    }

    impl<T: Config> Pallet<T> {
        /// Internal transfer with fee calculation
        fn do_transfer(
            from: &T::AccountId,
            to: &T::AccountId,
            amount: u128,
        ) -> DispatchResult {
            // Calculate fee (0.1% of amount, min 0.001 CGT)
            let fee = amount
                .saturating_mul(10) // 0.1%
                .saturating_div(10_000)
                .max(100_000); // 0.001 CGT minimum
            
            let total_deduct = amount.saturating_add(fee);
            
            // Burn portion of fee
            let burn_amount = T::BurnPercentage::get().mul_floor(fee);
            let treasury_amount = fee.saturating_sub(burn_amount);
            
            // Execute transfers...
            // (Implementation details)
            
            Self::deposit_event(Event::Transfer {
                from: from.clone(),
                to: to.clone(),
                amount,
            });
            
            if burn_amount > 0 {
                Self::do_burn_internal(burn_amount)?;
            }
            
            Ok(())
        }

        /// Internal burn implementation
        fn do_burn(who: &T::AccountId, amount: u128) -> DispatchResult {
            // Deduct from account
            // Update TotalBurned
            // Update CirculatingSupply
            
            let new_total = TotalBurned::<T>::get().saturating_add(amount);
            TotalBurned::<T>::put(new_total);
            
            CirculatingSupply::<T>::mutate(|supply| {
                *supply = supply.saturating_sub(amount);
            });
            
            Self::deposit_event(Event::Burned {
                amount,
                total_burned: new_total,
            });
            
            Ok(())
        }
    }
}
```

### Chain Specification

```rust
// Genesis configuration for CGT

fn cgt_genesis_config() -> GenesisConfig {
    GenesisConfig {
        cgt: CgtConfig {
            balances: vec![
                // Treasury (35%)
                (treasury_account(), 350_000_000 * CGT),
                // Staking Rewards Pool (25%)
                (staking_rewards_account(), 250_000_000 * CGT),
                // Team (15%) - Vesting contract
                (team_vesting_account(), 150_000_000 * CGT),
                // Development Fund (10%)
                (dev_fund_account(), 100_000_000 * CGT),
                // Liquidity (10%)
                (liquidity_account(), 100_000_000 * CGT),
                // Early Backers (5%)
                (early_backers_account(), 50_000_000 * CGT),
            ],
        },
    }
}

const CGT: u128 = 100_000_000; // 10^8 (8 decimals)
```

---

## Emission Schedule

### Year 1-5 Staking Rewards

```
Block Time: 6 seconds
Blocks/Year: 5,256,000

Year 1 Emission: 50,000,000 CGT
Per Block: 50,000,000 / 5,256,000 ≈ 9.51 CGT/block

Halving Schedule:
- Year 1: 9.51 CGT/block
- Year 2: 8.99 CGT/block  
- Year 3: 8.39 CGT/block
- Year 4: 7.73 CGT/block
- Year 5: 7.02 CGT/block
```

### Validator Reward Distribution

```
Block Reward: X CGT

Distribution:
├── Block Producer: 20%
├── All Validators (proportional to stake): 70%
└── Treasury: 10%
```

---

## Summary

| Metric | Value |
|--------|-------|
| **Total Supply** | 1,000,000,000 CGT |
| **Precision** | 8 decimals |
| **Initial Circulating** | ~150,000,000 CGT |
| **Year 1 Inflation** | 5% |
| **Burn Rate** | 80% of tx fees |
| **Governance Threshold** | 50-75% based on type |

---

*Last Updated: January 12, 2026*  
*Document Version: 1.0*  
*Maintainer: Alaustrup*
