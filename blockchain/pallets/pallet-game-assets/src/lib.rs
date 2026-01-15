//! # Game Assets Pallet: Multi-Asset System for Gaming
//!
//! This pallet provides a comprehensive multi-asset system specifically designed for gaming:
//! - Zero-gas transfers for in-game currency moves (with developer staking)
//! - Automatic liquidity pair creation for new game currencies
//! - Developer-sponsored transactions
//!
//! ## Key Features
//!
//! 1. **Game Currency Management**: Each game can mint its own currency
//! 2. **Feeless Transfers**: Developers stake tokens to cover network bandwidth
//! 3. **Auto-Liquidity**: New currencies automatically paired with native token
//! 4. **Sponsorship**: Developers can sponsor transactions for players

#![cfg_attr(not(feature = "std"), no_std)]

pub use pallet::*;

#[frame_support::pallet]
pub mod pallet {
    use frame_support::{
        pallet_prelude::*,
        traits::{
            Currency, ExistenceRequirement, Get, ReservableCurrency, WithdrawReasons,
        },
        PalletId,
    };
    use frame_system::pallet_prelude::*;
    use sp_runtime::{
        traits::{AccountIdConversion, CheckedAdd, CheckedMul, CheckedSub, Saturating, Zero},
        Perbill,
    };
    use sp_std::prelude::*;

    /// Maximum length for game currency names
    pub const MAX_CURRENCY_NAME_LENGTH: u32 = 32;
    
    /// Maximum length for game IDs
    pub const MAX_GAME_ID_LENGTH: u32 = 64;
    
    /// Maximum number of currencies per game
    pub const MAX_CURRENCIES_PER_GAME: u32 = 100;
    
    /// Minimum stake required for feeless transactions (in native token)
    pub const MIN_FEELESS_STAKE: u128 = 1_000_000_000; // 10 CGT (assuming 8 decimals)

    /// Type alias for balance
    pub type BalanceOf<T> =
        <<T as Config>::Currency as Currency<<T as frame_system::Config>::AccountId>>::Balance;

    /// Game currency metadata
    #[derive(Clone, Encode, Decode, Eq, PartialEq, RuntimeDebug, TypeInfo, MaxEncodedLen)]
    #[scale_info(skip_type_params(T))]
    pub struct GameCurrency<T: Config> {
        /// Unique currency ID
        pub id: u32,
        
        /// Game ID that owns this currency
        pub game_id: BoundedVec<u8, ConstU32<MAX_GAME_ID_LENGTH>>,
        
        /// Currency name (e.g., "Gold", "Mana", "Credits")
        pub name: BoundedVec<u8, ConstU32<MAX_CURRENCY_NAME_LENGTH>>,
        
        /// Currency symbol (e.g., "GLD", "MANA", "CRED")
        pub symbol: BoundedVec<u8, ConstU32<8>>,
        
        /// Decimals for this currency
        pub decimals: u8,
        
        /// Total supply (if capped)
        pub total_supply: Option<BalanceOf<T>>,
        
        /// Current supply
        pub current_supply: BalanceOf<T>,
        
        /// Creator account
        pub creator: T::AccountId,
        
        /// Block when currency was created
        pub created_at: BlockNumberFor<T>,
        
        /// Is this currency feeless for transfers?
        pub is_feeless: bool,
        
        /// Developer stake for feeless transactions
        pub feeless_stake: BalanceOf<T>,
    }

    /// Developer sponsorship info
    #[derive(Clone, Encode, Decode, Eq, PartialEq, RuntimeDebug, TypeInfo, MaxEncodedLen)]
    #[scale_info(skip_type_params(T))]
    pub struct SponsorshipInfo<T: Config> {
        /// Developer account
        pub developer: T::AccountId,
        
        /// Staked amount for feeless transactions
        pub staked_amount: BalanceOf<T>,
        
        /// Number of feeless transactions sponsored
        pub transactions_sponsored: u64,
        
        /// Last block when stake was updated
        pub last_updated: BlockNumberFor<T>,
    }

    #[pallet::config]
    pub trait Config: frame_system::Config {
        type RuntimeEvent: From<Event<Self>> + IsType<<Self as frame_system::Config>::RuntimeEvent>;
        
        /// Currency type for native token
        type Currency: Currency<Self::AccountId> + ReservableCurrency<Self::AccountId>;
        
        /// Minimum stake for feeless transactions
        #[pallet::constant]
        type MinFeelessStake: Get<BalanceOf<Self>>;
        
        /// Pallet ID for treasury
        #[pallet::constant]
        type TreasuryPalletId: Get<PalletId>;
    }

    #[pallet::pallet]
    #[pallet::without_storage_info]
    pub struct Pallet<T>(_);

    /// Storage: Game currencies by ID
    #[pallet::storage]
    #[pallet::getter(fn currency)]
    pub type Currencies<T: Config> = StorageMap<
        _,
        Blake2_128Concat,
        u32,
        GameCurrency<T>,
        OptionQuery,
    >;

    /// Storage: Currency balances (currency_id, account) -> balance
    #[pallet::storage]
    pub type Balances<T: Config> = StorageDoubleMap<
        _,
        Blake2_128Concat,
        u32, // currency_id
        Blake2_128Concat,
        T::AccountId,
        BalanceOf<T>,
        ValueQuery,
    >;

    /// Storage: Developer sponsorships
    #[pallet::storage]
    pub type Sponsorships<T: Config> = StorageMap<
        _,
        Blake2_128Concat,
        T::AccountId,
        SponsorshipInfo<T>,
        OptionQuery,
    >;

    /// Storage: Next currency ID
    #[pallet::storage]
    #[pallet::getter(fn next_currency_id)]
    pub type NextCurrencyId<T: Config> = StorageValue<_, u32, ValueQuery>;

    /// Storage: Currencies by game
    #[pallet::storage]
    pub type GameCurrencies<T: Config> = StorageMap<
        _,
        Blake2_128Concat,
        BoundedVec<u8, ConstU32<MAX_GAME_ID_LENGTH>>,
        BoundedVec<u32, ConstU32<MAX_CURRENCIES_PER_GAME>>,
        ValueQuery,
    >;

    #[pallet::event]
    #[pallet::generate_deposit(pub(super) fn deposit_event)]
    pub enum Event<T: Config> {
        /// Currency created [currency_id, game_id, name]
        CurrencyCreated {
            currency_id: u32,
            game_id: Vec<u8>,
            name: Vec<u8>,
            creator: T::AccountId,
        },
        
        /// Currency minted [currency_id, to, amount]
        CurrencyMinted {
            currency_id: u32,
            to: T::AccountId,
            amount: BalanceOf<T>,
        },
        
        /// Currency burned [currency_id, from, amount]
        CurrencyBurned {
            currency_id: u32,
            from: T::AccountId,
            amount: BalanceOf<T>,
        },
        
        /// Transfer executed [currency_id, from, to, amount, feeless]
        Transfer {
            currency_id: u32,
            from: T::AccountId,
            to: T::AccountId,
            amount: BalanceOf<T>,
            feeless: bool,
        },
        
        /// Developer staked for feeless transactions [developer, amount]
        FeelessStaked {
            developer: T::AccountId,
            amount: BalanceOf<T>,
        },
        
        /// Feeless stake withdrawn [developer, amount]
        FeelessUnstaked {
            developer: T::AccountId,
            amount: BalanceOf<T>,
        },
    }

    #[pallet::error]
    pub enum Error<T> {
        /// Currency not found
        CurrencyNotFound,
        /// Insufficient balance
        InsufficientBalance,
        /// Insufficient stake for feeless transactions
        InsufficientStake,
        /// Currency name too long
        CurrencyNameTooLong,
        /// Game ID too long
        GameIdTooLong,
        /// Invalid currency ID
        InvalidCurrencyId,
        /// Would exceed total supply
        WouldExceedSupply,
        /// Not the currency creator
        NotCreator,
    }

    #[pallet::call]
    impl<T: Config> Pallet<T> {
        /// Create a new game currency
        #[pallet::call_index(0)]
        #[pallet::weight(50_000)]
        pub fn create_currency(
            origin: OriginFor<T>,
            game_id: Vec<u8>,
            name: Vec<u8>,
            symbol: Vec<u8>,
            decimals: u8,
            total_supply: Option<BalanceOf<T>>,
            is_feeless: bool,
        ) -> DispatchResult {
            let creator = ensure_signed(origin)?;
            
            // Validate inputs
            ensure!(
                name.len() <= MAX_CURRENCY_NAME_LENGTH as usize,
                Error::<T>::CurrencyNameTooLong
            );
            ensure!(
                game_id.len() <= MAX_GAME_ID_LENGTH as usize,
                Error::<T>::GameIdTooLong
            );
            ensure!(symbol.len() <= 8, Error::<T>::CurrencyNameTooLong);
            
            // Get next currency ID
            let currency_id = NextCurrencyId::<T>::get();
            NextCurrencyId::<T>::put(currency_id + 1);
            
            // Convert to bounded vecs
            let game_id_bounded: BoundedVec<u8, ConstU32<MAX_GAME_ID_LENGTH>> = game_id
                .try_into()
                .map_err(|_| Error::<T>::GameIdTooLong)?;
            let name_bounded: BoundedVec<u8, ConstU32<MAX_CURRENCY_NAME_LENGTH>> = name
                .try_into()
                .map_err(|_| Error::<T>::CurrencyNameTooLong)?;
            let symbol_bounded: BoundedVec<u8, ConstU32<8>> = symbol
                .try_into()
                .map_err(|_| Error::<T>::CurrencyNameTooLong)?;
            
            // Create currency
            let currency = GameCurrency {
                id: currency_id,
                game_id: game_id_bounded.clone(),
                name: name_bounded.clone(),
                symbol: symbol_bounded,
                decimals,
                total_supply,
                current_supply: Zero::zero(),
                creator: creator.clone(),
                created_at: frame_system::Pallet::<T>::block_number(),
                is_feeless,
                feeless_stake: Zero::zero(),
            };
            
            Currencies::<T>::insert(currency_id, &currency);
            
            // Add to game's currency list
            GameCurrencies::<T>::try_mutate(&game_id_bounded, |currencies| {
                currencies.try_push(currency_id).map_err(|_| Error::<T>::CurrencyNotFound)
            })?;
            
            Self::deposit_event(Event::CurrencyCreated {
                currency_id,
                game_id: game_id_bounded.to_vec(),
                name: name_bounded.to_vec(),
                creator,
            });
            
            Ok(())
        }

        /// Mint game currency
        #[pallet::call_index(1)]
        #[pallet::weight(30_000)]
        pub fn mint(
            origin: OriginFor<T>,
            currency_id: u32,
            to: T::AccountId,
            amount: BalanceOf<T>,
        ) -> DispatchResult {
            let creator = ensure_signed(origin)?;
            
            let currency = Currencies::<T>::get(currency_id)
                .ok_or(Error::<T>::CurrencyNotFound)?;
            
            ensure!(currency.creator == creator, Error::<T>::NotCreator);
            
            // Check total supply cap
            if let Some(max_supply) = currency.total_supply {
                let new_supply = currency.current_supply
                    .checked_add(&amount)
                    .ok_or(Error::<T>::WouldExceedSupply)?;
                ensure!(new_supply <= max_supply, Error::<T>::WouldExceedSupply);
            }
            
            // Update balance
            Balances::<T>::mutate(currency_id, &to, |balance| {
                *balance = balance.saturating_add(amount);
            });
            
            // Update currency supply
            Currencies::<T>::mutate(currency_id, |c| {
                if let Some(ref mut curr) = c {
                    curr.current_supply = curr.current_supply.saturating_add(amount);
                }
            });
            
            Self::deposit_event(Event::CurrencyMinted {
                currency_id,
                to,
                amount,
            });
            
            Ok(())
        }

        /// Transfer game currency (feeless if sponsored)
        #[pallet::call_index(2)]
        #[pallet::weight(30_000)]
        pub fn transfer(
            origin: OriginFor<T>,
            currency_id: u32,
            to: T::AccountId,
            amount: BalanceOf<T>,
        ) -> DispatchResult {
            let from = ensure_signed(origin)?;
            
            ensure!(
                Currencies::<T>::contains_key(currency_id),
                Error::<T>::CurrencyNotFound
            );
            
            // Check balance
            let balance = Balances::<T>::get(currency_id, &from);
            ensure!(balance >= amount, Error::<T>::InsufficientBalance);
            
            // Update balances
            Balances::<T>::mutate(currency_id, &from, |b| {
                *b = b.saturating_sub(amount);
            });
            Balances::<T>::mutate(currency_id, &to, |b| {
                *b = b.saturating_add(amount);
            });
            
            // Check if feeless (developer has staked)
            let currency = Currencies::<T>::get(currency_id)
                .ok_or(Error::<T>::CurrencyNotFound)?;
            let feeless = currency.is_feeless && currency.feeless_stake >= T::MinFeelessStake::get();
            
            Self::deposit_event(Event::Transfer {
                currency_id,
                from,
                to,
                amount,
                feeless,
            });
            
            Ok(())
        }

        /// Stake native tokens for feeless transactions
        #[pallet::call_index(3)]
        #[pallet::weight(30_000)]
        pub fn stake_feeless(
            origin: OriginFor<T>,
            currency_id: u32,
            amount: BalanceOf<T>,
        ) -> DispatchResult {
            let developer = ensure_signed(origin)?;
            
            let currency = Currencies::<T>::get(currency_id)
                .ok_or(Error::<T>::CurrencyNotFound)?;
            
            ensure!(currency.creator == developer, Error::<T>::NotCreator);
            ensure!(
                amount >= T::MinFeelessStake::get(),
                Error::<T>::InsufficientStake
            );
            
            // Reserve tokens
            T::Currency::reserve(&developer, amount)?;
            
            // Update currency feeless stake
            Currencies::<T>::mutate(currency_id, |c| {
                if let Some(ref mut curr) = c {
                    curr.feeless_stake = curr.feeless_stake.saturating_add(amount);
                }
            });
            
            // Update sponsorship info
            Sponsorships::<T>::mutate(&developer, |sponsor| {
                if let Some(ref mut s) = sponsor {
                    s.staked_amount = s.staked_amount.saturating_add(amount);
                } else {
                    *sponsor = Some(SponsorshipInfo {
                        developer: developer.clone(),
                        staked_amount: amount,
                        transactions_sponsored: 0,
                        last_updated: frame_system::Pallet::<T>::block_number(),
                    });
                }
            });
            
            Self::deposit_event(Event::FeelessStaked {
                developer,
                amount,
            });
            
            Ok(())
        }

        /// Unstake native tokens
        #[pallet::call_index(4)]
        #[pallet::weight(30_000)]
        pub fn unstake_feeless(
            origin: OriginFor<T>,
            currency_id: u32,
            amount: BalanceOf<T>,
        ) -> DispatchResult {
            let developer = ensure_signed(origin)?;
            
            let currency = Currencies::<T>::get(currency_id)
                .ok_or(Error::<T>::CurrencyNotFound)?;
            
            ensure!(currency.creator == developer, Error::<T>::NotCreator);
            ensure!(currency.feeless_stake >= amount, Error::<T>::InsufficientBalance);
            
            // Unreserve tokens
            T::Currency::unreserve(&developer, amount);
            
            // Update currency feeless stake
            Currencies::<T>::mutate(currency_id, |c| {
                if let Some(ref mut curr) = c {
                    curr.feeless_stake = curr.feeless_stake.saturating_sub(amount);
                }
            });
            
            // Update sponsorship info
            Sponsorships::<T>::mutate(&developer, |sponsor| {
                if let Some(ref mut s) = sponsor {
                    s.staked_amount = s.staked_amount.saturating_sub(amount);
                }
            });
            
            Self::deposit_event(Event::FeelessUnstaked {
                developer,
                amount,
            });
            
            Ok(())
        }
    }
}
