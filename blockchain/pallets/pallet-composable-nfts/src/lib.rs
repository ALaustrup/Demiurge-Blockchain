//! # Composable NFTs Pallet: RMRK-style Equippable System
//!
//! This pallet implements composable and nested NFTs where NFTs can own other NFTs.
//! Perfect for gaming: Character NFTs with equipment slots (Sword, Armor, etc.)
//!
//! ## Key Features
//!
//! 1. **Equippable Logic**: NFTs can be equipped to other NFTs
//! 2. **Avatar System**: Character NFT with multiple equipment slots
//! 3. **Multi-Resource NFTs**: One NFT can have multiple outputs (2D map, 3D GLB)
//! 4. **Slot Management**: Define equipment slots and what can be equipped

#![cfg_attr(not(feature = "std"), no_std)]

pub use pallet::*;

#[frame_support::pallet]
pub mod pallet {
    use frame_support::{
        pallet_prelude::*,
    };
    use frame_system::pallet_prelude::*;
    use sp_runtime::traits::Saturating;
    use sp_std::prelude::*;

    /// Maximum length for slot names
    pub const MAX_SLOT_NAME_LENGTH: u32 = 32;
    
    /// Maximum number of slots per NFT
    pub const MAX_SLOTS_PER_NFT: u32 = 20;
    
    /// Maximum number of nested NFTs
    pub const MAX_NESTED_NFTS: u32 = 100;

    /// Equipment slot definition
    #[derive(Clone, Encode, Decode, Eq, PartialEq, RuntimeDebug, TypeInfo, MaxEncodedLen)]
    pub struct EquipmentSlot {
        /// Slot name (e.g., "weapon", "armor", "helmet")
        pub name: BoundedVec<u8, ConstU32<MAX_SLOT_NAME_LENGTH>>,
        
        /// Currently equipped NFT UUID (if any)
        pub equipped_nft: Option<[u8; 32]>,
        
        /// Slot type (for validation)
        pub slot_type: SlotType,
    }
    
    impl Default for EquipmentSlot {
        fn default() -> Self {
            Self {
                name: BoundedVec::new(),
                equipped_nft: None,
                slot_type: SlotType::Custom(BoundedVec::new()),
            }
        }
    }

    /// Slot type for validation
    #[derive(Clone, Encode, Decode, Eq, PartialEq, RuntimeDebug, TypeInfo, MaxEncodedLen)]
    pub enum SlotType {
        Weapon,
        Armor,
        Helmet,
        Accessory,
        Custom(BoundedVec<u8, ConstU32<MAX_SLOT_NAME_LENGTH>>),
    }

    /// Composable NFT metadata
    #[derive(Clone, Encode, Decode, Eq, PartialEq, RuntimeDebug, TypeInfo, MaxEncodedLen)]
    #[scale_info(skip_type_params(T))]
    pub struct ComposableNft<T: Config> {
        /// Base NFT UUID (from DRC-369)
        pub base_uuid: [u8; 32],
        
        /// Owner account
        pub owner: T::AccountId,
        
        /// Equipment slots
        pub slots: BoundedVec<EquipmentSlot, ConstU32<MAX_SLOTS_PER_NFT>>,
        
        /// Nested NFTs (NFTs owned by this NFT)
        pub nested_nfts: BoundedVec<[u8; 32], ConstU32<MAX_NESTED_NFTS>>,
        
        /// Multi-resource outputs (2D map, 3D GLB, etc.)
        pub resources: BoundedVec<Resource, ConstU32<10>>,
    }

    /// Multi-resource output
    #[derive(Clone, Encode, Decode, Eq, PartialEq, RuntimeDebug, TypeInfo, MaxEncodedLen)]
    pub struct Resource {
        /// Resource type (e.g., "2d_map", "3d_glb", "vr_model")
        pub resource_type: BoundedVec<u8, ConstU32<32>>,
        
        /// Resource URI/path
        pub uri: BoundedVec<u8, ConstU32<256>>,
        
        /// Priority (for rendering order)
        pub priority: u8,
    }

    #[pallet::config]
    pub trait Config: frame_system::Config {
        type RuntimeEvent: From<Event<Self>> + IsType<<Self as frame_system::Config>::RuntimeEvent>;
    }

    #[pallet::pallet]
    #[pallet::without_storage_info]
    pub struct Pallet<T>(_);

    /// Storage: Composable NFTs by base UUID
    #[pallet::storage]
    pub type ComposableNfts<T: Config> = StorageMap<
        _,
        Blake2_128Concat,
        [u8; 32], // base_uuid
        ComposableNft<T>,
        OptionQuery,
    >;

    /// Storage: Parent NFT for nested NFTs
    #[pallet::storage]
    pub type ParentNft<T: Config> = StorageMap<
        _,
        Blake2_128Concat,
        [u8; 32], // nested_nft_uuid
        [u8; 32], // parent_nft_uuid
        OptionQuery,
    >;

    #[pallet::event]
    #[pallet::generate_deposit(pub(super) fn deposit_event)]
    pub enum Event<T: Config> {
        /// Composable NFT created [base_uuid, owner]
        ComposableNftCreated {
            base_uuid: [u8; 32],
            owner: T::AccountId,
        },
        
        /// NFT equipped [parent_uuid, child_uuid, slot_name]
        NftEquipped {
            parent_uuid: [u8; 32],
            child_uuid: [u8; 32],
            slot_name: Vec<u8>,
        },
        
        /// NFT unequipped [parent_uuid, child_uuid, slot_name]
        NftUnequipped {
            parent_uuid: [u8; 32],
            child_uuid: [u8; 32],
            slot_name: Vec<u8>,
        },
        
        /// NFT nested [parent_uuid, child_uuid]
        NftNested {
            parent_uuid: [u8; 32],
            child_uuid: [u8; 32],
        },
        
        /// Resource added [nft_uuid, resource_type]
        ResourceAdded {
            nft_uuid: [u8; 32],
            resource_type: Vec<u8>,
        },
    }

    #[pallet::error]
    pub enum Error<T> {
        /// Composable NFT not found
        ComposableNftNotFound,
        /// Slot not found
        SlotNotFound,
        /// Slot already occupied
        SlotOccupied,
        /// Invalid slot type
        InvalidSlotType,
        /// Not the NFT owner
        NotOwner,
        /// Too many nested NFTs
        TooManyNested,
    }

    #[pallet::call]
    impl<T: Config> Pallet<T> {
        /// Create a composable NFT from a base DRC-369 NFT
        #[pallet::call_index(0)]
        #[pallet::weight(50_000)]
        pub fn create_composable_nft(
            origin: OriginFor<T>,
            base_uuid: [u8; 32],
            slot_names: Vec<Vec<u8>>,
        ) -> DispatchResult {
            let owner = ensure_signed(origin)?;
            
            // TODO: Verify base_uuid exists in DRC-369 pallet and owner matches
            
            ensure!(
                slot_names.len() <= MAX_SLOTS_PER_NFT as usize,
                Error::<T>::TooManyNested
            );
            
            // Create slots
            let mut slots = BoundedVec::new();
            for slot_name in slot_names {
                let slot_name_bounded: BoundedVec<u8, ConstU32<MAX_SLOT_NAME_LENGTH>> = slot_name
                    .try_into()
                    .map_err(|_| Error::<T>::SlotNotFound)?;
                
                slots.try_push(EquipmentSlot {
                    name: slot_name_bounded,
                    equipped_nft: None,
                    slot_type: SlotType::Custom(BoundedVec::new()),
                }).map_err(|_| Error::<T>::TooManyNested)?;
            }
            
            let composable_nft = ComposableNft {
                base_uuid,
                owner: owner.clone(),
                slots,
                nested_nfts: BoundedVec::new(),
                resources: BoundedVec::new(),
            };
            
            ComposableNfts::<T>::insert(base_uuid, &composable_nft);
            
            Self::deposit_event(Event::ComposableNftCreated {
                base_uuid,
                owner,
            });
            
            Ok(())
        }

        /// Equip an NFT to a slot
        #[pallet::call_index(1)]
        #[pallet::weight(30_000)]
        pub fn equip_nft(
            origin: OriginFor<T>,
            parent_uuid: [u8; 32],
            child_uuid: [u8; 32],
            slot_name: Vec<u8>,
        ) -> DispatchResult {
            let who = ensure_signed(origin)?;
            
            let mut composable = ComposableNfts::<T>::get(&parent_uuid)
                .ok_or(Error::<T>::ComposableNftNotFound)?;
            
            ensure!(composable.owner == who, Error::<T>::NotOwner);
            
            // Find slot
            let slot_name_bounded: BoundedVec<u8, ConstU32<MAX_SLOT_NAME_LENGTH>> = slot_name
                .clone()
                .try_into()
                .map_err(|_| Error::<T>::SlotNotFound)?;
            
            let slot_index = composable.slots.iter()
                .position(|s| s.name == slot_name_bounded)
                .ok_or(Error::<T>::SlotNotFound)?;
            
            // Check if slot is occupied and equip NFT
            let slot = composable.slots.get_mut(slot_index)
                .ok_or(Error::<T>::SlotNotFound)?;
            
            ensure!(slot.equipped_nft.is_none(), Error::<T>::SlotOccupied);
            slot.equipped_nft = Some(child_uuid);
            
            // Set parent relationship
            ParentNft::<T>::insert(child_uuid, parent_uuid);
            
            ComposableNfts::<T>::insert(parent_uuid, &composable);
            
            Self::deposit_event(Event::NftEquipped {
                parent_uuid,
                child_uuid,
                slot_name,
            });
            
            Ok(())
        }

        /// Unequip an NFT from a slot
        #[pallet::call_index(2)]
        #[pallet::weight(30_000)]
        pub fn unequip_nft(
            origin: OriginFor<T>,
            parent_uuid: [u8; 32],
            slot_name: Vec<u8>,
        ) -> DispatchResult {
            let who = ensure_signed(origin)?;
            
            let mut composable = ComposableNfts::<T>::get(&parent_uuid)
                .ok_or(Error::<T>::ComposableNftNotFound)?;
            
            ensure!(composable.owner == who, Error::<T>::NotOwner);
            
            // Find slot
            let slot_name_bounded: BoundedVec<u8, ConstU32<MAX_SLOT_NAME_LENGTH>> = slot_name
                .clone()
                .try_into()
                .map_err(|_| Error::<T>::SlotNotFound)?;
            
            let slot_index = composable.slots.iter()
                .position(|s| s.name == slot_name_bounded)
                .ok_or(Error::<T>::SlotNotFound)?;
            
            let slot = composable.slots.get_mut(slot_index)
                .ok_or(Error::<T>::SlotNotFound)?;
            
            if let Some(child_uuid) = slot.equipped_nft {
                // Unequip
                slot.equipped_nft = None;
                ParentNft::<T>::remove(child_uuid);
                
                ComposableNfts::<T>::insert(parent_uuid, &composable);
                
                Self::deposit_event(Event::NftUnequipped {
                    parent_uuid,
                    child_uuid,
                    slot_name,
                });
            }
            
            Ok(())
        }

        /// Add a resource to an NFT (multi-resource support)
        #[pallet::call_index(3)]
        #[pallet::weight(30_000)]
        pub fn add_resource(
            origin: OriginFor<T>,
            nft_uuid: [u8; 32],
            resource_type: Vec<u8>,
            uri: Vec<u8>,
            priority: u8,
        ) -> DispatchResult {
            let who = ensure_signed(origin)?;
            
            let mut composable = ComposableNfts::<T>::get(&nft_uuid)
                .ok_or(Error::<T>::ComposableNftNotFound)?;
            
            ensure!(composable.owner == who, Error::<T>::NotOwner);
            
            let resource_type_bounded: BoundedVec<u8, ConstU32<32>> = resource_type
                .clone()
                .try_into()
                .map_err(|_| Error::<T>::SlotNotFound)?;
            let uri_bounded: BoundedVec<u8, ConstU32<256>> = uri
                .try_into()
                .map_err(|_| Error::<T>::SlotNotFound)?;
            
            let resource = Resource {
                resource_type: resource_type_bounded.clone(),
                uri: uri_bounded,
                priority,
            };
            
            composable.resources.try_push(resource)
                .map_err(|_| Error::<T>::TooManyNested)?;
            
            ComposableNfts::<T>::insert(nft_uuid, &composable);
            
            Self::deposit_event(Event::ResourceAdded {
                nft_uuid,
                resource_type: resource_type_bounded.to_vec(),
            });
            
            Ok(())
        }
    }
}
