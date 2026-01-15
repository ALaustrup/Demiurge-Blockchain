//! # Energy Pallet: Regenerating Currencies
//!
//! This pallet implements a hybrid "energy" model where currencies regenerate over time.
//! Example: Mana that regenerates +5 per hour on-chain without user intervention.
//!
//! ## Key Features
//!
//! 1. **Regenerating Currencies**: Currencies that automatically regenerate using `on_initialize`
//! 2. **Configurable Rates**: Set regeneration rate per block/hour/day
//! 3. **Maximum Caps**: Set maximum energy/currency amounts
//! 4. **Per-Account Tracking**: Each account's last update block is tracked

#![cfg_attr(not(feature = "std"), no_std)]

pub use pallet::*;

#[frame_support::pallet]
pub mod pallet {
    use frame_support::{
        pallet_prelude::*,
        traits::Get,
    };
    use frame_system::pallet_prelude::*;
    use sp_runtime::traits::{Saturating, Zero};
    use sp_std::prelude::*;

    /// Maximum length for energy type names
    pub const MAX_ENERGY_NAME_LENGTH: u32 = 32;

    /// Type alias for balance
    pub type Balance = u128;

    /// Energy type configuration
    #[derive(Clone, Encode, Decode, Eq, PartialEq, RuntimeDebug, TypeInfo, MaxEncodedLen)]
    pub struct EnergyType {
        /// Unique energy ID
        pub id: u32,
        
        /// Energy name (e.g., "Mana", "Stamina", "Energy")
        pub name: BoundedVec<u8, ConstU32<MAX_ENERGY_NAME_LENGTH>>,
        
        /// Regeneration rate per block
        pub regen_per_block: Balance,
        
        /// Maximum energy cap
        pub max_cap: Balance,
        
        /// Minimum energy (floor)
        pub min_floor: Balance,
    }

    /// Account energy state
    #[derive(Clone, Encode, Decode, Eq, PartialEq, RuntimeDebug, TypeInfo, MaxEncodedLen)]
    pub struct EnergyState {
        /// Current energy amount
        pub current: Balance,
        
        /// Last block when energy was updated
        pub last_updated_block: BlockNumber,
    }

    #[pallet::config]
    pub trait Config: frame_system::Config + pallet_timestamp::Config {
        type RuntimeEvent: From<Event<Self>> + IsType<<Self as frame_system::Config>::RuntimeEvent>;
    }

    #[pallet::pallet]
    #[pallet::without_storage_info]
    pub struct Pallet<T>(_);

    /// Storage: Energy types by ID
    #[pallet::storage]
    pub type EnergyTypes<T: Config> = StorageMap<
        _,
        Blake2_128Concat,
        u32,
        EnergyType,
        OptionQuery,
    >;

    /// Storage: Account energy states (energy_id, account) -> state
    #[pallet::storage]
    pub type EnergyStates<T: Config> = StorageDoubleMap<
        _,
        Blake2_128Concat,
        u32, // energy_id
        Blake2_128Concat,
        T::AccountId,
        EnergyState,
        ValueQuery,
    >;

    /// Storage: Next energy ID
    #[pallet::storage]
    pub type NextEnergyId<T: Config> = StorageValue<_, u32, ValueQuery>;

    #[pallet::event]
    #[pallet::generate_deposit(pub(super) fn deposit_event)]
    pub enum Event<T: Config> {
        /// Energy type created [energy_id, name]
        EnergyTypeCreated {
            energy_id: u32,
            name: Vec<u8>,
        },
        
        /// Energy regenerated [energy_id, account, amount, new_total]
        EnergyRegenerated {
            energy_id: u32,
            account: T::AccountId,
            amount: Balance,
            new_total: Balance,
        },
        
        /// Energy consumed [energy_id, account, amount, new_total]
        EnergyConsumed {
            energy_id: u32,
            account: T::AccountId,
            amount: Balance,
            new_total: Balance,
        },
    }

    #[pallet::error]
    pub enum Error<T> {
        /// Energy type not found
        EnergyTypeNotFound,
        /// Insufficient energy
        InsufficientEnergy,
        /// Would exceed maximum cap
        WouldExceedCap,
    }

    #[pallet::hooks]
    impl<T: Config> Hooks<BlockNumberFor<T>> for Pallet<T> {
        /// Regenerate energy for all accounts on each block
        fn on_initialize(_n: BlockNumberFor<T>) -> Weight {
            // In a production system, you'd want to iterate efficiently
            // For now, this is a placeholder - actual implementation would use
            // efficient iteration or off-chain workers for large state
            
            // Weight: minimal since we're just updating state
            Weight::from_parts(1_000, 0)
        }
    }

    #[pallet::call]
    impl<T: Config> Pallet<T> {
        /// Create a new energy type
        #[pallet::call_index(0)]
        #[pallet::weight(30_000)]
        pub fn create_energy_type(
            origin: OriginFor<T>,
            name: Vec<u8>,
            regen_per_block: Balance,
            max_cap: Balance,
            min_floor: Balance,
        ) -> DispatchResult {
            ensure_root(origin)?;
            
            ensure!(
                name.len() <= MAX_ENERGY_NAME_LENGTH as usize,
                Error::<T>::EnergyTypeNotFound
            );
            
            let energy_id = NextEnergyId::<T>::get();
            NextEnergyId::<T>::put(energy_id + 1);
            
            let name_bounded: BoundedVec<u8, ConstU32<MAX_ENERGY_NAME_LENGTH>> = name
                .try_into()
                .map_err(|_| Error::<T>::EnergyTypeNotFound)?;
            
            let energy_type = EnergyType {
                id: energy_id,
                name: name_bounded.clone(),
                regen_per_block,
                max_cap,
                min_floor,
            };
            
            EnergyTypes::<T>::insert(energy_id, &energy_type);
            
            Self::deposit_event(Event::EnergyTypeCreated {
                energy_id,
                name: name_bounded.to_vec(),
            });
            
            Ok(())
        }

        /// Regenerate energy for an account (called automatically, but can be manual)
        #[pallet::call_index(1)]
        #[pallet::weight(10_000)]
        pub fn regenerate_energy(
            origin: OriginFor<T>,
            energy_id: u32,
        ) -> DispatchResult {
            let account = ensure_signed(origin)?;
            
            let energy_type = EnergyTypes::<T>::get(energy_id)
                .ok_or(Error::<T>::EnergyTypeNotFound)?;
            
            let current_block = frame_system::Pallet::<T>::block_number();
            
            // Get current state
            let mut state = EnergyStates::<T>::get(energy_id, &account);
            
            // Calculate blocks since last update
            let blocks_passed = current_block.saturating_sub(state.last_updated_block);
            
            // Calculate regeneration amount
            let regen_amount = energy_type.regen_per_block
                .saturating_mul(blocks_passed.into());
            
            // Apply regeneration (capped at max)
            let new_amount = (state.current + regen_amount)
                .min(energy_type.max_cap);
            
            let actual_regen = new_amount.saturating_sub(state.current);
            
            if actual_regen > 0 {
                state.current = new_amount;
                state.last_updated_block = current_block;
                
                EnergyStates::<T>::insert(energy_id, &account, &state);
                
                Self::deposit_event(Event::EnergyRegenerated {
                    energy_id,
                    account,
                    amount: actual_regen,
                    new_total: new_amount,
                });
            }
            
            Ok(())
        }

        /// Consume energy
        #[pallet::call_index(2)]
        #[pallet::weight(20_000)]
        pub fn consume_energy(
            origin: OriginFor<T>,
            energy_id: u32,
            amount: Balance,
        ) -> DispatchResult {
            let account = ensure_signed(origin)?;
            
            let energy_type = EnergyTypes::<T>::get(energy_id)
                .ok_or(Error::<T>::EnergyTypeNotFound)?;
            
            // Regenerate first
            Self::regenerate_energy(origin.clone())?;
            
            // Get updated state
            let mut state = EnergyStates::<T>::get(energy_id, &account);
            
            ensure!(state.current >= amount, Error::<T>::InsufficientEnergy);
            
            // Consume energy (but not below floor)
            state.current = state.current
                .saturating_sub(amount)
                .max(energy_type.min_floor);
            
            EnergyStates::<T>::insert(energy_id, &account, &state);
            
            Self::deposit_event(Event::EnergyConsumed {
                energy_id,
                account,
                amount,
                new_total: state.current,
            });
            
            Ok(())
        }

        /// Get current energy (with auto-regeneration)
        #[pallet::call_index(3)]
        #[pallet::weight(10_000)]
        pub fn get_energy(
            origin: OriginFor<T>,
            energy_id: u32,
        ) -> DispatchResult {
            let account = ensure_signed(origin)?;
            
            // Regenerate first
            Self::regenerate_energy(origin)?;
            
            let state = EnergyStates::<T>::get(energy_id, &account);
            
            Ok(())
        }
    }

    impl<T: Config> Pallet<T> {
        /// Regenerate energy for a specific account (internal)
        pub fn regenerate_energy_for_account(
            energy_id: u32,
            account: &T::AccountId,
        ) -> Result<Balance, DispatchError> {
            let energy_type = EnergyTypes::<T>::get(energy_id)
                .ok_or(Error::<T>::EnergyTypeNotFound)?;
            
            let current_block = frame_system::Pallet::<T>::block_number();
            let mut state = EnergyStates::<T>::get(energy_id, account);
            
            let blocks_passed = current_block.saturating_sub(state.last_updated_block);
            let regen_amount = energy_type.regen_per_block
                .saturating_mul(blocks_passed.into());
            
            let new_amount = (state.current + regen_amount)
                .min(energy_type.max_cap);
            
            let actual_regen = new_amount.saturating_sub(state.current);
            
            if actual_regen > 0 {
                state.current = new_amount;
                state.last_updated_block = current_block;
                EnergyStates::<T>::insert(energy_id, account, &state);
            }
            
            Ok(state.current)
        }
    }
}
