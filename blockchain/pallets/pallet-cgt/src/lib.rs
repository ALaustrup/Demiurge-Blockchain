//! # Creator God Token (CGT) Pallet
//!
//! The divine currency of the Demiurge Ecosystem.
//!
//! ## Overview
//!
//! CGT is the native token with the following properties:
//! - **Total Supply**: 13,000,000,000 (13 Billion) - Fixed
//! - **Precision**: 8 decimals
//! - **Smallest Unit**: 1 Spark (0.00000001 CGT)
//!
//! ## Features
//!
//! - Standard token transfers with fee burning
//! - Deflationary mechanics (80% of fees burned)
//! - Treasury allocation for remaining fees
//! - Staking reward emission (Archon rewards)
//!
//! ## Tokenomics: "The Creation Model"
//!
//! Distribution designed to reward creators and validators:
//!
//! | Bucket               | Allocation | Amount (CGT)  | Purpose                           |
//! |----------------------|------------|---------------|-----------------------------------|
//! | Pleroma Mining       | 40%        | 5,200,000,000 | In-game creation & Play-to-Earn   |
//! | Archon Staking       | 20%        | 2,600,000,000 | Validator/Nominator rewards       |
//! | Demiurge Treasury    | 15%        | 1,950,000,000 | DAO-managed ecosystem growth      |
//! | Core Team & Founders | 15%        | 1,950,000,000 | 4-year linear vesting             |
//! | Genesis Offering     | 10%        | 1,300,000,000 | Initial public liquidity          |
//!
//! ## Governance: The Archon Consensus
//!
//! - Model: Nominated Proof of Stake (NPoS)
//! - Validators: "Archons"
//! - Nominators: "Aeons"
//! - Voting: Quadratic voting based on CGT stake + Qor ID Reputation Score

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
        traits::{
            Currency, ExistenceRequirement, Imbalance, OnUnbalanced, ReservableCurrency,
            WithdrawReasons,
        },
        PalletId,
    };
    use frame_system::pallet_prelude::*;
    use sp_runtime::{
        traits::Zero,
        Permill,
    };
    use sp_std::prelude::*;
    
    use crate::weights::WeightInfo;

    /// CGT precision: 8 decimals
    pub const DECIMALS: u8 = 8;

    /// One CGT in smallest units (Sparks)
    pub const CGT: u128 = 100_000_000; // 10^8

    /// Total supply: 13 billion CGT (Fixed)
    pub const TOTAL_SUPPLY: u128 = 13_000_000_000 * CGT;

    /// Existential deposit: 0.001 CGT (prevents dust accounts)
    pub const EXISTENTIAL_DEPOSIT: u128 = CGT / 1000;

    /// Pallet ID for treasury (Demiurge Treasury)
    pub const PALLET_ID: PalletId = PalletId(*b"cgt/trsy");
    
    // ═══════════════════════════════════════════════════════════════════════════
    // TOKENOMICS: The Creation Model - Distribution Buckets
    // ═══════════════════════════════════════════════════════════════════════════
    
    /// 40% - Pleroma Mining: In-game creation rewards & Play-to-Earn
    pub const PLEROMA_MINING_ALLOCATION: u128 = 5_200_000_000 * CGT;
    
    /// 20% - Archon Staking: Validator/Nominator rewards (NPoS)
    pub const ARCHON_STAKING_ALLOCATION: u128 = 2_600_000_000 * CGT;
    
    /// 15% - Demiurge Treasury: DAO-managed ecosystem growth
    pub const TREASURY_ALLOCATION: u128 = 1_950_000_000 * CGT;
    
    /// 15% - Core Team & Founders: 4-year linear vesting
    pub const TEAM_ALLOCATION: u128 = 1_950_000_000 * CGT;
    
    /// 10% - Initial Genesis Offering: Public liquidity
    pub const GENESIS_OFFERING_ALLOCATION: u128 = 1_300_000_000 * CGT;

    /// Type alias for currency balance
    pub type BalanceOf<T> =
        <<T as Config>::Currency as Currency<<T as frame_system::Config>::AccountId>>::Balance;

    /// Type alias for negative imbalance
    pub type NegativeImbalanceOf<T> = <<T as Config>::Currency as Currency<
        <T as frame_system::Config>::AccountId,
    >>::NegativeImbalance;

    #[pallet::pallet]
    pub struct Pallet<T>(_);

    #[pallet::config]
    pub trait Config: frame_system::Config {
        /// The overarching runtime event type
        type RuntimeEvent: From<Event<Self>> + IsType<<Self as frame_system::Config>::RuntimeEvent>;

        /// The currency mechanism (typically pallet-balances)
        type Currency: Currency<Self::AccountId> + ReservableCurrency<Self::AccountId>;

        /// Handler for burned fees
        type OnBurn: OnUnbalanced<NegativeImbalanceOf<Self>>;

        /// Percentage of fees to burn (default: 80%)
        #[pallet::constant]
        type BurnPercentage: Get<Permill>;

        /// Minimum transfer amount (prevents dust)
        #[pallet::constant]
        type MinTransferAmount: Get<BalanceOf<Self>>;

        /// Weight information for extrinsics
        type WeightInfo: WeightInfo;
    }

    /// Total CGT burned since genesis
    #[pallet::storage]
    #[pallet::getter(fn total_burned)]
    pub type TotalBurned<T> = StorageValue<_, u128, ValueQuery>;

    /// Total CGT minted since genesis (staking rewards)
    #[pallet::storage]
    #[pallet::getter(fn total_minted)]
    pub type TotalMinted<T> = StorageValue<_, u128, ValueQuery>;

    /// Current circulating supply
    #[pallet::storage]
    #[pallet::getter(fn circulating_supply)]
    pub type CirculatingSupply<T> = StorageValue<_, u128, ValueQuery>;

    /// Genesis block configuration
    #[pallet::genesis_config]
    #[derive(frame_support::DefaultNoBound)]
    pub struct GenesisConfig<T: Config> {
        /// Initial balances
        pub balances: Vec<(T::AccountId, BalanceOf<T>)>,
    }

    #[pallet::genesis_build]
    impl<T: Config> BuildGenesisConfig for GenesisConfig<T> {
        fn build(&self) {
            let mut total: u128 = 0;

            for (account, balance) in &self.balances {
                let balance_u128: u128 = (*balance).try_into().unwrap_or(0);
                total = total.saturating_add(balance_u128);

                // Note: Actual minting would happen via Currency trait
                // This is tracked for circulating supply
                log::info!(
                    "CGT Genesis: {:?} receives {} CGT",
                    account,
                    balance_u128 / CGT
                );
            }

            CirculatingSupply::<T>::put(total);
            log::info!(
                "CGT Genesis complete. Circulating supply: {} CGT",
                total / CGT
            );
        }
    }

    #[pallet::event]
    #[pallet::generate_deposit(pub(super) fn deposit_event)]
    pub enum Event<T: Config> {
        /// CGT transferred successfully
        /// [from, to, amount]
        Transferred {
            from: T::AccountId,
            to: T::AccountId,
            amount: BalanceOf<T>,
        },

        /// CGT burned
        /// [amount, total_burned]
        Burned { amount: u128, total_burned: u128 },

        /// CGT minted (staking rewards)
        /// [to, amount]
        Minted { to: T::AccountId, amount: BalanceOf<T> },

        /// Fee collected
        /// [fee_amount, burned, treasury]
        FeeCollected {
            fee_amount: BalanceOf<T>,
            burned: BalanceOf<T>,
            treasury: BalanceOf<T>,
        },
    }

    #[pallet::error]
    pub enum Error<T> {
        /// Insufficient balance for transfer
        InsufficientBalance,
        /// Transfer amount below minimum
        AmountTooLow,
        /// Cannot transfer to self
        SelfTransfer,
        /// Transfer would kill the account
        WouldKillAccount,
        /// Arithmetic overflow
        Overflow,
    }

    #[pallet::call]
    impl<T: Config> Pallet<T> {
        /// Transfer CGT to another account.
        ///
        /// A small fee is deducted from the sender:
        /// - 80% of the fee is burned (deflationary)
        /// - 20% goes to the treasury
        ///
        /// # Arguments
        /// * `to` - Destination account
        /// * `amount` - Amount to transfer (excluding fees)
        ///
        /// # Weight
        /// Base weight plus read/write operations
        #[pallet::call_index(0)]
        #[pallet::weight(T::WeightInfo::transfer())]
        pub fn transfer(
            origin: OriginFor<T>,
            to: T::AccountId,
            #[pallet::compact] amount: BalanceOf<T>,
        ) -> DispatchResult {
            let from = ensure_signed(origin)?;

            // Validate
            ensure!(from != to, Error::<T>::SelfTransfer);
            ensure!(amount >= T::MinTransferAmount::get(), Error::<T>::AmountTooLow);

            // Calculate fee (0.1% of amount, minimum 0.001 CGT)
            let fee = Self::calculate_fee(amount);
            // Convert to u128 for arithmetic, then back
            let amount_u128: u128 = amount.try_into().unwrap_or(0);
            let fee_u128: u128 = fee.try_into().unwrap_or(0);
            let total_debit_u128 = amount_u128.saturating_add(fee_u128);
            let total_debit: BalanceOf<T> = total_debit_u128.try_into().unwrap_or_else(|_| amount);

            // Ensure sender has enough balance
            let sender_balance = T::Currency::free_balance(&from);
            ensure!(sender_balance >= total_debit, Error::<T>::InsufficientBalance);

            // Execute transfer
            T::Currency::transfer(&from, &to, amount, ExistenceRequirement::KeepAlive)?;

            // Process fee
            Self::process_fee(&from, fee)?;

            // Emit event
            Self::deposit_event(Event::Transferred { from, to, amount });

            Ok(())
        }

        /// Burn CGT from own account (permanently remove from supply).
        ///
        /// This is a voluntary deflationary action.
        ///
        /// # Arguments
        /// * `amount` - Amount to burn
        #[pallet::call_index(1)]
        #[pallet::weight(T::WeightInfo::burn())]
        pub fn burn(
            origin: OriginFor<T>,
            #[pallet::compact] amount: BalanceOf<T>,
        ) -> DispatchResult {
            let who = ensure_signed(origin)?;

            // Validate
            ensure!(amount > Zero::zero(), Error::<T>::AmountTooLow);

            // Withdraw and burn
            let imbalance = T::Currency::withdraw(
                &who,
                amount,
                WithdrawReasons::TRANSFER,
                ExistenceRequirement::KeepAlive,
            )?;

            // Handle the imbalance (burn it)
            T::OnBurn::on_unbalanced(imbalance);

            // Update storage
            let amount_u128: u128 = amount.try_into().unwrap_or(0);
            let new_total = TotalBurned::<T>::get().saturating_add(amount_u128);
            TotalBurned::<T>::put(new_total);

            CirculatingSupply::<T>::mutate(|supply| {
                *supply = supply.saturating_sub(amount_u128);
            });

            // Emit event
            Self::deposit_event(Event::Burned {
                amount: amount_u128,
                total_burned: new_total,
            });

            Ok(())
        }
    }

    impl<T: Config> Pallet<T> {
        /// Get the treasury account ID
        /// Converts PalletId to AccountId using Substrate's standard account derivation
        pub fn treasury_account() -> T::AccountId {
            // Standard Substrate account derivation: "modl" + pallet_id_bytes -> blake2_256 -> AccountId32
            let pallet_id_bytes = PALLET_ID.0;
            let mut input = [0u8; 12];
            input[0..4].copy_from_slice(b"modl");
            input[4..12].copy_from_slice(&pallet_id_bytes);
            
            // Use sp_core::hashing for blake2_256 (available in no_std)
            let hash = sp_core::hashing::blake2_256(&input);
            
            // Convert [u8; 32] to AccountId using Decode trait
            // AccountId32 can be decoded from raw bytes
            use codec::Decode;
            T::AccountId::decode(&mut &hash[..])
                .expect("Failed to decode treasury account ID - AccountId must be AccountId32")
        }

        /// Calculate transfer fee (0.1% minimum 0.001 CGT)
        fn calculate_fee(amount: BalanceOf<T>) -> BalanceOf<T> {
            let amount_u128: u128 = amount.try_into().unwrap_or(0);

            // 0.1% fee = amount * 10 / 10000
            let fee = amount_u128.saturating_mul(10).saturating_div(10000);

            // Minimum fee: 0.001 CGT = 100_000 Sparks
            let min_fee = CGT / 1000;
            let final_fee = fee.max(min_fee);

            final_fee.try_into().unwrap_or_else(|_| amount)
        }

        /// Process fee: burn portion and send rest to treasury
        fn process_fee(from: &T::AccountId, fee: BalanceOf<T>) -> DispatchResult {
            if fee == Zero::zero() {
                return Ok(());
            }

            // Calculate burn amount (80%)
            let burn_percentage = T::BurnPercentage::get();
            let burn_amount = burn_percentage.mul_floor(fee);
            // Convert to u128 for arithmetic
            let fee_u128: u128 = fee.try_into().unwrap_or(0);
            let burn_amount_u128: u128 = burn_amount.try_into().unwrap_or(0);
            let treasury_amount_u128 = fee_u128.saturating_sub(burn_amount_u128);
            let treasury_amount: BalanceOf<T> = treasury_amount_u128.try_into().unwrap_or_else(|_| Zero::zero());

            // Withdraw fee from sender
            let imbalance = T::Currency::withdraw(
                from,
                fee,
                WithdrawReasons::FEE,
                ExistenceRequirement::KeepAlive,
            )?;

            // Split the imbalance
            let (burn_imbalance, treasury_imbalance) = imbalance.split(burn_amount);

            // Burn the burn portion
            T::OnBurn::on_unbalanced(burn_imbalance);

            // Send treasury portion
            if !treasury_imbalance.peek().is_zero() {
                let treasury = Self::treasury_account();
                let _ = T::Currency::deposit_creating(&treasury, treasury_imbalance.peek());
            }

            // Update burned amount
            let burn_u128: u128 = burn_amount.try_into().unwrap_or(0);
            if burn_u128 > 0 {
                let new_total = TotalBurned::<T>::get().saturating_add(burn_u128);
                TotalBurned::<T>::put(new_total);

                CirculatingSupply::<T>::mutate(|supply| {
                    *supply = supply.saturating_sub(burn_u128);
                });
            }

            // Emit fee event
            Self::deposit_event(Event::FeeCollected {
                fee_amount: fee,
                burned: burn_amount,
                treasury: treasury_amount,
            });

            Ok(())
        }
    }
}
