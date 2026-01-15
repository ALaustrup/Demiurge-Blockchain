//! # DEX Pallet: Automatic Liquidity Pairs
//!
//! This pallet automatically creates liquidity pairs for new game currencies with the native token.
//! Enables instant "cash-out" or "buy-in" for players.
//!
//! ## Key Features
//!
//! 1. **Auto-Pairing**: New currencies automatically paired with native token
//! 2. **Liquidity Provision**: Developers can add liquidity
//! 3. **Swap Functionality**: Trade between currencies
//! 4. **Constant Product Formula**: AMM-style swaps (x * y = k)

#![cfg_attr(not(feature = "std"), no_std)]

pub use pallet::*;

#[frame_support::pallet]
pub mod pallet {
    use frame_support::{
        pallet_prelude::*,
        traits::Currency,
    };
    use frame_system::pallet_prelude::*;
    use sp_runtime::traits::{CheckedMul, CheckedDiv, Saturating, Zero};
    use sp_std::prelude::*;

    /// Type alias for balance
    pub type BalanceOf<T> =
        <<T as Config>::Currency as Currency<<T as frame_system::Config>::AccountId>>::Balance;

    /// Liquidity pair
    #[derive(Clone, Encode, Decode, Eq, PartialEq, RuntimeDebug, TypeInfo, MaxEncodedLen)]
    #[scale_info(skip_type_params(T))]
    pub struct LiquidityPair<T: Config> {
        /// Currency ID (from pallet-game-assets)
        pub currency_id: u32,
        
        /// Reserve of native token
        pub native_reserve: BalanceOf<T>,
        
        /// Reserve of game currency
        pub currency_reserve: BalanceOf<T>,
        
        /// Total liquidity tokens
        pub total_liquidity: BalanceOf<T>,
        
        /// Block when pair was created
        pub created_at: BlockNumberFor<T>,
    }

    #[pallet::config]
    pub trait Config: frame_system::Config {
        type RuntimeEvent: From<Event<Self>> + IsType<<Self as frame_system::Config>::RuntimeEvent>;
        
        /// Currency type for native token
        type Currency: Currency<Self::AccountId>;
    }

    #[pallet::pallet]
    #[pallet::without_storage_info]
    pub struct Pallet<T>(_);

    /// Storage: Liquidity pairs by currency ID
    #[pallet::storage]
    pub type LiquidityPairs<T: Config> = StorageMap<
        _,
        Blake2_128Concat,
        u32, // currency_id
        LiquidityPair<T>,
        OptionQuery,
    >;

    /// Storage: Liquidity providers (currency_id, provider) -> liquidity_tokens
    #[pallet::storage]
    pub type LiquidityProviders<T: Config> = StorageDoubleMap<
        _,
        Blake2_128Concat,
        u32, // currency_id
        Blake2_128Concat,
        T::AccountId,
        BalanceOf<T>,
        ValueQuery,
    >;

    #[pallet::event]
    #[pallet::generate_deposit(pub(super) fn deposit_event)]
    pub enum Event<T: Config> {
        /// Liquidity pair created [currency_id, native_amount, currency_amount]
        PairCreated {
            currency_id: u32,
            native_amount: BalanceOf<T>,
            currency_amount: BalanceOf<T>,
        },
        
        /// Liquidity added [currency_id, provider, native_amount, currency_amount, liquidity_tokens]
        LiquidityAdded {
            currency_id: u32,
            provider: T::AccountId,
            native_amount: BalanceOf<T>,
            currency_amount: BalanceOf<T>,
            liquidity_tokens: BalanceOf<T>,
        },
        
        /// Liquidity removed [currency_id, provider, native_amount, currency_amount]
        LiquidityRemoved {
            currency_id: u32,
            provider: T::AccountId,
            native_amount: BalanceOf<T>,
            currency_amount: BalanceOf<T>,
        },
        
        /// Swap executed [currency_id, from_token, to_token, amount_in, amount_out]
        SwapExecuted {
            currency_id: u32,
            from_native: bool, // true if swapping native -> currency, false if currency -> native
            amount_in: BalanceOf<T>,
            amount_out: BalanceOf<T>,
        },
    }

    #[pallet::error]
    pub enum Error<T> {
        /// Pair not found
        PairNotFound,
        /// Insufficient liquidity
        InsufficientLiquidity,
        /// Insufficient balance
        InsufficientBalance,
        /// Pair already exists
        PairAlreadyExists,
        /// Invalid amounts (must be > 0)
        InvalidAmounts,
    }

    #[pallet::call]
    impl<T: Config> Pallet<T> {
        /// Create a liquidity pair (automatically called when currency is created)
        #[pallet::call_index(0)]
        #[pallet::weight(50_000)]
        pub fn create_pair(
            origin: OriginFor<T>,
            currency_id: u32,
            initial_native: BalanceOf<T>,
            initial_currency: BalanceOf<T>,
        ) -> DispatchResult {
            let provider = ensure_signed(origin)?;
            
            ensure!(
                !LiquidityPairs::<T>::contains_key(currency_id),
                Error::<T>::PairAlreadyExists
            );
            ensure!(initial_native > Zero::zero(), Error::<T>::InvalidAmounts);
            ensure!(initial_currency > Zero::zero(), Error::<T>::InvalidAmounts);
            
            // TODO: Transfer native tokens from provider
            // TODO: Transfer currency tokens from provider (via pallet-game-assets)
            
            // Calculate initial liquidity tokens (sqrt(x * y))
            let liquidity = initial_native
                .checked_mul(&initial_currency)
                .and_then(|product| {
                    // Simplified: use geometric mean
                    // In production, use proper sqrt calculation
                    Some((product / BalanceOf::<T>::from(2u32)).saturating_add(BalanceOf::<T>::from(1000u32)))
                })
                .ok_or(Error::<T>::InvalidAmounts)?;
            
            let pair = LiquidityPair {
                currency_id,
                native_reserve: initial_native,
                currency_reserve: initial_currency,
                total_liquidity: liquidity,
                created_at: frame_system::Pallet::<T>::block_number(),
            };
            
            LiquidityPairs::<T>::insert(currency_id, &pair);
            LiquidityProviders::<T>::insert(currency_id, &provider, liquidity);
            
            Self::deposit_event(Event::PairCreated {
                currency_id,
                native_amount: initial_native,
                currency_amount: initial_currency,
            });
            
            Self::deposit_event(Event::LiquidityAdded {
                currency_id,
                provider,
                native_amount: initial_native,
                currency_amount: initial_currency,
                liquidity_tokens: liquidity,
            });
            
            Ok(())
        }

        /// Add liquidity to an existing pair
        #[pallet::call_index(1)]
        #[pallet::weight(40_000)]
        pub fn add_liquidity(
            origin: OriginFor<T>,
            currency_id: u32,
            native_amount: BalanceOf<T>,
            currency_amount: BalanceOf<T>,
        ) -> DispatchResult {
            let provider = ensure_signed(origin)?;
            
            let mut pair = LiquidityPairs::<T>::get(currency_id)
                .ok_or(Error::<T>::PairNotFound)?;
            
            // TODO: Transfer tokens from provider
            // TODO: Calculate liquidity tokens based on current reserves
            
            // Update reserves
            pair.native_reserve = pair.native_reserve.saturating_add(native_amount);
            pair.currency_reserve = pair.currency_reserve.saturating_add(currency_amount);
            
            // Calculate new liquidity tokens (proportional to reserves)
            let liquidity_tokens = (pair.total_liquidity * native_amount) / pair.native_reserve;
            pair.total_liquidity = pair.total_liquidity.saturating_add(liquidity_tokens);
            
            LiquidityPairs::<T>::insert(currency_id, &pair);
            
            // Update provider's liquidity tokens
            LiquidityProviders::<T>::mutate(currency_id, &provider, |tokens| {
                *tokens = tokens.saturating_add(liquidity_tokens);
            });
            
            Self::deposit_event(Event::LiquidityAdded {
                currency_id,
                provider,
                native_amount,
                currency_amount,
                liquidity_tokens,
            });
            
            Ok(())
        }

        /// Swap native token for game currency
        #[pallet::call_index(2)]
        #[pallet::weight(30_000)]
        pub fn swap_native_for_currency(
            origin: OriginFor<T>,
            currency_id: u32,
            native_amount_in: BalanceOf<T>,
            min_currency_out: BalanceOf<T>, // Slippage protection
        ) -> DispatchResult {
            let who = ensure_signed(origin)?;
            
            let mut pair = LiquidityPairs::<T>::get(currency_id)
                .ok_or(Error::<T>::PairNotFound)?;
            
            // Constant product formula: (x + dx) * (y - dy) = x * y
            // dy = (y * dx) / (x + dx)
            let currency_out = pair.currency_reserve
                .checked_mul(&native_amount_in)
                .and_then(|numerator| {
                    numerator.checked_div(&(pair.native_reserve.saturating_add(native_amount_in)))
                })
                .ok_or(Error::<T>::InsufficientLiquidity)?;
            
            ensure!(currency_out >= min_currency_out, Error::<T>::InsufficientLiquidity);
            
            // TODO: Transfer native tokens from who
            // TODO: Transfer currency tokens to who
            
            // Update reserves
            pair.native_reserve = pair.native_reserve.saturating_add(native_amount_in);
            pair.currency_reserve = pair.currency_reserve.saturating_sub(currency_out);
            
            LiquidityPairs::<T>::insert(currency_id, &pair);
            
            Self::deposit_event(Event::SwapExecuted {
                currency_id,
                from_native: true,
                amount_in: native_amount_in,
                amount_out: currency_out,
            });
            
            Ok(())
        }

        /// Swap game currency for native token
        #[pallet::call_index(3)]
        #[pallet::weight(30_000)]
        pub fn swap_currency_for_native(
            origin: OriginFor<T>,
            currency_id: u32,
            currency_amount_in: BalanceOf<T>,
            min_native_out: BalanceOf<T>, // Slippage protection
        ) -> DispatchResult {
            let who = ensure_signed(origin)?;
            
            let mut pair = LiquidityPairs::<T>::get(currency_id)
                .ok_or(Error::<T>::PairNotFound)?;
            
            // Constant product formula
            let native_out = pair.native_reserve
                .checked_mul(&currency_amount_in)
                .and_then(|numerator| {
                    numerator.checked_div(&(pair.currency_reserve.saturating_add(currency_amount_in)))
                })
                .ok_or(Error::<T>::InsufficientLiquidity)?;
            
            ensure!(native_out >= min_native_out, Error::<T>::InsufficientLiquidity);
            
            // TODO: Transfer currency tokens from who
            // TODO: Transfer native tokens to who
            
            // Update reserves
            pair.currency_reserve = pair.currency_reserve.saturating_add(currency_amount_in);
            pair.native_reserve = pair.native_reserve.saturating_sub(native_out);
            
            LiquidityPairs::<T>::insert(currency_id, &pair);
            
            Self::deposit_event(Event::SwapExecuted {
                currency_id,
                from_native: false,
                amount_in: currency_amount_in,
                amount_out: native_out,
            });
            
            Ok(())
        }
    }
}
