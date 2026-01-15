//! # DRC-369 Pallet: Programmable, Evolving Asset Standard
//!
//! **Core Philosophy**: "An Asset is not just a link to an image; it is a programmable, evolving operating system."
//!
//! DRC-369 is the definitive gaming NFT standard for the Demiurge blockchain, implementing
//! four revolutionary modules that transform static NFTs into living, programmable entities.
//!
//! ## Overview
//!
//! DRC-369 defines on-chain storage for items that:
//! - Have UE5 asset paths baked into chain data
//! - Support Cyber Glass visual styling
//! - Enforce soulbound rules
//! - Implement perpetual creator royalties
//! - Enable free-to-accept trades
//! - **Support true nesting** (NFTs owning NFTs)
//! - **Multi-resource polymorphism** (one NFT, many outputs)
//! - **Dynamic on-chain state** (XP, level, durability, evolution)
//! - **Native rental & delegation** (Owner vs User roles)
//!
//! ## The Four Core Modules
//!
//! ### Module 1: Multi-Resource Polymorphism (Context Module)
//! One NFT can have multiple resources for different contexts:
//! - **2D Icon** for marketplace/inventory
//! - **3D GLB Model** for in-game rendering
//! - **VR Model** for VR headsets
//! - **Sound Effects** for item usage
//! - **Priority Logic**: Automatically selects the right resource based on context
//!
//! ### Module 2: Native Nesting & Inventory (Matryoshka Module)
//! True on-chain ownership hierarchy:
//! - **Parent-Child Entanglement**: A "Knight" NFT can own a "Sword" NFT
//! - **Atomic Transfers**: Selling the Knight automatically transfers the Sword
//! - **Equippable Logic**: Define slots (Head, RightHand, Chest) with trait validation
//! - **Circular Prevention**: Blockchain-level validation prevents infinite loops
//!
//! ### Module 3: Native Rental & Time-Decay (Leasing Module)
//! Owner vs User roles for rentals:
//! - **Delegation**: Owner can delegate usage to another account
//! - **Time-Lock Expiry**: Delegation automatically expires at a specific block
//! - **Automatic Revocation**: No "claim back" transaction needed
//! - **Game Integration**: Games check User field, not Owner field
//!
//! ### Module 4: Dynamic & Evolving State (DNA Module)
//! Mutable on-chain storage:
//! - **Experience Points**: Track XP and auto-level
//! - **Durability**: Items degrade with use (0-100)
//! - **Kill Count**: Track weapon/item usage
//! - **Class Evolution**: Change class when conditions are met
//! - **Custom State**: Extensible key-value pairs for game-specific data
//! - **Logic Hooks**: Automatic state updates via Substrate hooks
//!
//! ## Key Features
//!
//! - **Phygital**: Assets exist both on-chain and in the 3D world
//! - **UE5 Native**: Asset paths stored on-chain for direct loading
//! - **Creator Royalties**: Perpetual commission on all transfers
//! - **Soulbound Support**: Items can be made non-transferable
//! - **Zero-Cost Receives**: Accepting trades is free for receivers
//! - **Zero-Integration for Games**: Query parent NFT to check all equipment
//! - **Liquidity Efficiency**: Sell full character builds, not loose items
//! - **Cross-Chain Ready**: XCM support for teleporting complex objects

#![cfg_attr(not(feature = "std"), no_std)]

pub use pallet::*;

#[frame_support::pallet]
pub mod pallet {
    use frame_support::{
        pallet_prelude::*,
        traits::{Currency, ExistenceRequirement, WithdrawReasons},
    };
    use frame_system::pallet_prelude::*;
    use sp_runtime::traits::CheckedMul;
    use sp_std::prelude::*;

    /// Maximum length for item names
    pub const MAX_NAME_LENGTH: u32 = 64;
    
    /// Maximum length for UE5 asset paths
    pub const MAX_ASSET_PATH_LENGTH: u32 = 256;
    
    /// Maximum length for material paths
    pub const MAX_MATERIAL_PATH_LENGTH: u32 = 256;
    
    /// Maximum length for VFX socket names
    pub const MAX_SOCKET_NAME_LENGTH: u32 = 64;
    
    /// Maximum length for Qor ID
    pub const MAX_QOR_ID_LENGTH: u32 = 10;
    
    /// Maximum number of items per account
    pub const MAX_ITEMS_PER_ACCOUNT: u32 = 1000;
    
    /// Maximum royalty percentage (10%)
    pub const MAX_ROYALTY_PERCENT: u8 = 100;
    
    /// Maximum number of nested children per NFT
    pub const MAX_NESTED_CHILDREN: u32 = 100;
    
    /// Maximum number of resources per NFT
    pub const MAX_RESOURCES_PER_NFT: u32 = 20;
    
    /// Maximum length for resource type names
    pub const MAX_RESOURCE_TYPE_LENGTH: u32 = 32;
    
    /// Maximum length for resource URIs
    pub const MAX_RESOURCE_URI_LENGTH: u32 = 512;
    
    /// Maximum number of equipment slots
    pub const MAX_EQUIPMENT_SLOTS: u32 = 20;
    
    /// Maximum length for slot names
    pub const MAX_SLOT_NAME_LENGTH: u32 = 32;

    /// Type alias for balance
    pub type BalanceOf<T> =
        <<T as Config>::Currency as Currency<<T as frame_system::Config>::AccountId>>::Balance;

    /// Multi-Resource: One NFT, Many Outputs (Context Module)
    #[derive(Clone, Encode, Decode, Eq, PartialEq, RuntimeDebug, TypeInfo, MaxEncodedLen)]
    pub struct Resource {
        /// Resource type (e.g., "Image", "3D_Model", "Sound", "VR_Model")
        pub resource_type: BoundedVec<u8, ConstU32<MAX_RESOURCE_TYPE_LENGTH>>,
        
        /// Resource URI (IPFS, HTTP, or on-chain reference)
        pub uri: BoundedVec<u8, ConstU32<MAX_RESOURCE_URI_LENGTH>>,
        
        /// Priority (higher = preferred for this context)
        pub priority: u8,
        
        /// Context tags (e.g., "marketplace", "vr", "mobile")
        pub context_tags: BoundedVec<BoundedVec<u8, ConstU32<16>>, ConstU32<10>>,
    }

    /// Equipment Slot Definition (Matryoshka Module)
    #[derive(Clone, Encode, Decode, Eq, PartialEq, RuntimeDebug, TypeInfo, MaxEncodedLen)]
    pub struct EquipmentSlot {
        /// Slot name (e.g., "RightHand", "Head", "Chest")
        pub slot_name: BoundedVec<u8, ConstU32<MAX_SLOT_NAME_LENGTH>>,
        
        /// Currently equipped child NFT UUID (if any)
        pub equipped_child: Option<[u8; 32]>,
        
        /// Required trait/class ID for items that can be equipped here
        pub required_trait: Option<u32>,
        
        /// Slot type (for validation)
        pub slot_type: SlotType,
    }

    /// Slot Type Enumeration
    #[derive(Clone, Encode, Decode, Eq, PartialEq, RuntimeDebug, TypeInfo, MaxEncodedLen)]
    pub enum SlotType {
        Weapon,
        Armor,
        Helmet,
        Accessory,
        Custom(BoundedVec<u8, ConstU32<MAX_SLOT_NAME_LENGTH>>),
    }

    /// Owner vs User Delegation (Leasing Module)
    #[derive(Clone, Encode, Decode, Eq, PartialEq, RuntimeDebug, TypeInfo, MaxEncodedLen)]
    #[scale_info(skip_type_params(T))]
    pub struct DelegationInfo<T: Config> {
        /// Current user (who can use the NFT, may differ from owner)
        pub delegated_user: Option<T::AccountId>,
        
        /// Block when delegation expires (None = permanent delegation)
        pub expires_at_block: Option<BlockNumberFor<T>>,
        
        /// Block when delegation started
        pub delegated_at_block: BlockNumberFor<T>,
    }

    /// DRC-369 Item Metadata (Stateful NFT with All Modules)
    #[derive(Clone, Encode, Decode, Eq, PartialEq, RuntimeDebug, TypeInfo, MaxEncodedLen)]
    #[scale_info(skip_type_params(T))]
    pub struct Drc369Metadata<T: Config> {
        /// Unique item identifier (blake2_256 hash)
        pub uuid: [u8; 32],
        
        /// Item name (e.g., "Chronos Glaive")
        pub name: BoundedVec<u8, ConstU32<MAX_NAME_LENGTH>>,
        
        /// Creator's Qor Key (e.g., "Q7A1:9F2")
        pub creator_qor_id: BoundedVec<u8, ConstU32<MAX_QOR_ID_LENGTH>>,
        
        /// Creator's AccountId
        pub creator_account: T::AccountId,
        
        /// UE5 asset path for loading the mesh (legacy, kept for compatibility)
        pub ue5_asset_path: BoundedVec<u8, ConstU32<MAX_ASSET_PATH_LENGTH>>,
        
        /// Material instance path (Cyber Glass variant) (legacy)
        pub glass_material: BoundedVec<u8, ConstU32<MAX_MATERIAL_PATH_LENGTH>>,
        
        /// VFX socket name for particle effects (legacy)
        pub vfx_socket: BoundedVec<u8, ConstU32<MAX_SOCKET_NAME_LENGTH>>,
        
        /// Is this item soulbound (cannot be traded)?
        pub is_soulbound: bool,
        
        /// Royalty fee percentage (0-100, where 25 = 2.5%)
        pub royalty_fee_percent: u8,
        
        /// Block when item was minted
        pub minted_at: BlockNumberFor<T>,
        
        // ═══════════════════════════════════════════════════════════════════════════
        // MODULE 1: MULTI-RESOURCE POLYMORPHISM (Context Module)
        // ═══════════════════════════════════════════════════════════════════════════
        
        /// Multiple resources for different contexts (2D icon, 3D model, sound, etc.)
        pub resources: BoundedVec<Resource, ConstU32<MAX_RESOURCES_PER_NFT>>,
        
        // ═══════════════════════════════════════════════════════════════════════════
        // MODULE 2: NATIVE NESTING & INVENTORY (Matryoshka Module)
        // ═══════════════════════════════════════════════════════════════════════════
        
        /// Parent NFT UUID (if this NFT is nested inside another)
        pub parent_uuid: Option<[u8; 32]>,
        
        /// Equipment slots (for equipping child NFTs)
        pub equipment_slots: BoundedVec<EquipmentSlot, ConstU32<MAX_EQUIPMENT_SLOTS>>,
        
        /// Direct children UUIDs (NFTs owned by this NFT)
        pub children_uuids: BoundedVec<[u8; 32], ConstU32<MAX_NESTED_CHILDREN>>,
        
        // ═══════════════════════════════════════════════════════════════════════════
        // MODULE 3: NATIVE RENTAL & TIME-DECAY (Leasing Module)
        // ═══════════════════════════════════════════════════════════════════════════
        
        /// Owner vs User delegation (for rentals)
        pub delegation: Option<DelegationInfo<T>>,
        
        // ═══════════════════════════════════════════════════════════════════════════
        // MODULE 4: DYNAMIC & EVOLVING STATE (DNA Module)
        // ═══════════════════════════════════════════════════════════════════════════
        
        /// Experience points (for leveling)
        pub experience_points: u64,
        
        /// Current level (derived from XP)
        pub level: u32,
        
        /// Durability (0-100, decreases with use)
        pub durability: u8,
        
        /// Kill count (for weapons/items)
        pub kill_count: u32,
        
        /// Class ID (can evolve/change)
        pub class_id: u32,
        
        /// Last block when state was updated
        pub last_state_update: BlockNumberFor<T>,
        
        /// Custom state variables (key-value pairs for extensibility)
        pub custom_state: BoundedVec<(BoundedVec<u8, ConstU32<32>>, BoundedVec<u8, ConstU32<256>>), ConstU32<20>>,
    }

    /// Trade offer status
    #[derive(Clone, Encode, Decode, Eq, PartialEq, RuntimeDebug, TypeInfo, MaxEncodedLen)]
    pub enum TradeStatus {
        Pending,
        Accepted,
        Cancelled,
    }

    /// Trade offer structure
    #[derive(Clone, Encode, Decode, Eq, PartialEq, RuntimeDebug, TypeInfo, MaxEncodedLen)]
    #[scale_info(skip_type_params(T))]
    pub struct TradeOffer<T: Config> {
        /// Unique offer ID
        pub offer_id: [u8; 32],
        /// Item being offered
        pub item_uuid: [u8; 32],
        /// Account initiating the trade
        pub initiator: T::AccountId,
        /// Account receiving the offer
        pub receiver: T::AccountId,
        /// Current status
        pub status: TradeStatus,
        /// Block when offer was created
        pub created_at: BlockNumberFor<T>,
    }

    #[pallet::pallet]
    pub struct Pallet<T>(_);

    #[pallet::config]
    pub trait Config: frame_system::Config {
        /// Runtime event type
        type RuntimeEvent: From<Event<Self>> + IsType<<Self as frame_system::Config>::RuntimeEvent>;

        /// Currency for royalty payments
        type Currency: Currency<Self::AccountId>;
    }

    /// Storage: Items by UUID
    #[pallet::storage]
    #[pallet::getter(fn items)]
    pub type Items<T: Config> = StorageMap<
        _,
        Blake2_128Concat,
        [u8; 32],  // UUID
        Drc369Metadata<T>,
        OptionQuery,
    >;

    /// Storage: Owner of each item
    #[pallet::storage]
    #[pallet::getter(fn item_owners)]
    pub type ItemOwners<T: Config> = StorageMap<
        _,
        Blake2_128Concat,
        [u8; 32],  // UUID
        T::AccountId,
        OptionQuery,
    >;

    /// Storage: Items owned by each account
    #[pallet::storage]
    #[pallet::getter(fn owner_items)]
    pub type OwnerItems<T: Config> = StorageMap<
        _,
        Blake2_128Concat,
        T::AccountId,
        BoundedVec<[u8; 32], ConstU32<MAX_ITEMS_PER_ACCOUNT>>,
        ValueQuery,
    >;

    /// Storage: Active trade offers
    #[pallet::storage]
    #[pallet::getter(fn trade_offers)]
    pub type TradeOffers<T: Config> = StorageMap<
        _,
        Blake2_128Concat,
        [u8; 32],  // Offer ID
        TradeOffer<T>,
        OptionQuery,
    >;

    /// Storage: Total items minted
    #[pallet::storage]
    #[pallet::getter(fn total_items)]
    pub type TotalItems<T: Config> = StorageValue<_, u64, ValueQuery>;

    /// Storage: Items delegated to each account (for efficient lookup)
    #[pallet::storage]
    pub type DelegatedItems<T: Config> = StorageMap<
        _,
        Blake2_128Concat,
        T::AccountId,
        BoundedVec<[u8; 32], ConstU32<MAX_ITEMS_PER_ACCOUNT>>,
        ValueQuery,
    >;

    /// Storage: Parent lookup (for efficient nested NFT queries)
    #[pallet::storage]
    pub type ParentLookup<T: Config> = StorageMap<
        _,
        Blake2_128Concat,
        [u8; 32],  // Child UUID
        [u8; 32],  // Parent UUID
        OptionQuery,
    >;

    #[pallet::event]
    #[pallet::generate_deposit(pub(super) fn deposit_event)]
    pub enum Event<T: Config> {
        /// Item minted [uuid, owner, creator]
        ItemMinted {
            uuid: [u8; 32],
            owner: T::AccountId,
            creator: T::AccountId,
        },
        
        /// Item transferred [uuid, from, to]
        ItemTransferred {
            uuid: [u8; 32],
            from: T::AccountId,
            to: T::AccountId,
        },
        
        /// Trade offer created [offer_id, initiator, receiver, item_uuid]
        TradeOfferCreated {
            offer_id: [u8; 32],
            initiator: T::AccountId,
            receiver: T::AccountId,
            item_uuid: [u8; 32],
        },
        
        /// Trade accepted [offer_id, item_uuid, from, to]
        TradeAccepted {
            offer_id: [u8; 32],
            item_uuid: [u8; 32],
            from: T::AccountId,
            to: T::AccountId,
        },
        
        /// Trade cancelled [offer_id]
        TradeCancelled {
            offer_id: [u8; 32],
        },
        
        /// Royalty paid [item_uuid, creator, amount]
        RoyaltyPaid {
            item_uuid: [u8; 32],
            creator: T::AccountId,
            amount: BalanceOf<T>,
        },
        
        // ═══════════════════════════════════════════════════════════════════════════
        // STATEFUL NFT EVENTS
        // ═══════════════════════════════════════════════════════════════════════════
        
        /// Experience points added [item_uuid, xp_added, new_total, new_level]
        ExperienceAdded {
            item_uuid: [u8; 32],
            xp_added: u64,
            new_total: u64,
            new_level: u32,
        },
        
        /// Item leveled up [item_uuid, old_level, new_level]
        ItemLeveledUp {
            item_uuid: [u8; 32],
            old_level: u32,
            new_level: u32,
        },
        
        /// Durability updated [item_uuid, new_durability]
        DurabilityUpdated {
            item_uuid: [u8; 32],
            new_durability: u8,
        },
        
        /// Kill count incremented [item_uuid, new_kill_count]
        KillCountIncremented {
            item_uuid: [u8; 32],
            new_kill_count: u32,
        },
        
        /// Class evolved [item_uuid, old_class, new_class]
        ClassEvolved {
            item_uuid: [u8; 32],
            old_class_id: u32,
            new_class_id: u32,
        },
        
        // ═══════════════════════════════════════════════════════════════════════════
        // MODULE 3: DELEGATION EVENTS
        // ═══════════════════════════════════════════════════════════════════════════
        
        /// NFT delegated [item_uuid, owner, delegated_user, expires_at_block]
        NftDelegated {
            item_uuid: [u8; 32],
            owner: T::AccountId,
            delegated_user: T::AccountId,
            expires_at_block: Option<BlockNumberFor<T>>,
        },
        
        /// Delegation revoked [item_uuid, owner, delegated_user]
        DelegationRevoked {
            item_uuid: [u8; 32],
            owner: T::AccountId,
            delegated_user: T::AccountId,
        },
        
        /// Delegation expired [item_uuid, owner, delegated_user]
        DelegationExpired {
            item_uuid: [u8; 32],
            owner: T::AccountId,
            delegated_user: T::AccountId,
        },
        
        // ═══════════════════════════════════════════════════════════════════════════
        // MODULE 2: NESTING EVENTS
        // ═══════════════════════════════════════════════════════════════════════════
        
        /// NFT nested [parent_uuid, child_uuid]
        NftNested {
            parent_uuid: [u8; 32],
            child_uuid: [u8; 32],
        },
        
        /// NFT unnested [parent_uuid, child_uuid]
        NftUnnested {
            parent_uuid: [u8; 32],
            child_uuid: [u8; 32],
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
        
        /// Equipment slot added [item_uuid, slot_name]
        EquipmentSlotAdded {
            item_uuid: [u8; 32],
            slot_name: Vec<u8>,
        },
        
        // ═══════════════════════════════════════════════════════════════════════════
        // MODULE 1: MULTI-RESOURCE EVENTS
        // ═══════════════════════════════════════════════════════════════════════════
        
        /// Resource added [item_uuid, resource_type]
        ResourceAdded {
            item_uuid: [u8; 32],
            resource_type: Vec<u8>,
        },
        
        /// Resource removed [item_uuid, resource_type]
        ResourceRemoved {
            item_uuid: [u8; 32],
            resource_type: Vec<u8>,
        },
    }

    #[pallet::error]
    pub enum Error<T> {
        /// Item already exists
        ItemAlreadyExists,
        /// Item not found
        ItemNotFound,
        /// Not the item owner
        NotItemOwner,
        /// Item is soulbound (cannot be transferred)
        ItemIsSoulbound,
        /// Invalid UE5 asset path (empty or too long)
        InvalidAssetPath,
        /// Royalty fee too high (max 10%)
        RoyaltyFeeTooHigh,
        /// Trade offer not found
        TradeOfferNotFound,
        /// Not authorized to accept this trade
        NotAuthorizedToAcceptTrade,
        /// Trade offer already processed
        TradeOfferAlreadyProcessed,
        /// Cannot trade with yourself
        CannotTradeWithSelf,
        /// Too many items in inventory
        TooManyItems,
        /// Insufficient balance for royalty payment
        /// Durability too low (item broken)
        DurabilityTooLow,
        /// Cannot evolve (requirements not met)
        CannotEvolve,
        InsufficientBalanceForRoyalty,
        
        // ═══════════════════════════════════════════════════════════════════════════
        // MODULE 1: MULTI-RESOURCE ERRORS
        // ═══════════════════════════════════════════════════════════════════════════
        
        /// Too many resources
        TooManyResources,
        /// Resource not found
        ResourceNotFound,
        
        // ═══════════════════════════════════════════════════════════════════════════
        // MODULE 2: NESTING ERRORS
        // ═══════════════════════════════════════════════════════════════════════════
        
        /// Circular nesting detected (cannot nest parent into child)
        CircularNesting,
        /// Too many nested children
        TooManyChildren,
        /// Slot not found
        SlotNotFound,
        /// Slot already occupied
        SlotOccupied,
        /// Invalid trait for slot (equipment validation failed)
        InvalidTraitForSlot,
        /// Cannot nest (item is already nested)
        AlreadyNested,
        /// Cannot nest (item has children)
        HasChildren,
        
        // ═══════════════════════════════════════════════════════════════════════════
        // MODULE 3: DELEGATION ERRORS
        // ═══════════════════════════════════════════════════════════════════════════
        
        /// Not the delegated user
        NotDelegatedUser,
        /// Delegation expired
        DelegationExpired,
        /// Already delegated
        AlreadyDelegated,
    }

    #[pallet::call]
    impl<T: Config> Pallet<T> {
        /// Mint a new DRC-369 item
        ///
        /// # Arguments
        /// * `name` - Item name (e.g., "Chronos Glaive")
        /// * `creator_qor_id` - Creator's Qor Key (e.g., "Q7A1:9F2")
        /// * `ue5_asset_path` - UE5 asset path (REQUIRED)
        /// * `glass_material` - Material instance path
        /// * `vfx_socket` - VFX socket name
        /// * `is_soulbound` - Whether item can be traded
        /// * `royalty_fee_percent` - Royalty % (0-100, where 25 = 2.5%)
        #[pallet::call_index(0)]
        #[pallet::weight(50_000)]
        pub fn mint_item(
            origin: OriginFor<T>,
            name: Vec<u8>,
            creator_qor_id: Vec<u8>,
            ue5_asset_path: Vec<u8>,
            glass_material: Vec<u8>,
            vfx_socket: Vec<u8>,
            is_soulbound: bool,
            royalty_fee_percent: u8,
        ) -> DispatchResult {
            let creator = ensure_signed(origin)?;
            
            // Validate inputs
            ensure!(!ue5_asset_path.is_empty(), Error::<T>::InvalidAssetPath);
            ensure!(
                royalty_fee_percent <= MAX_ROYALTY_PERCENT,
                Error::<T>::RoyaltyFeeTooHigh
            );
            
            // Convert to bounded vecs
            let name_bounded: BoundedVec<u8, ConstU32<MAX_NAME_LENGTH>> = name
                .try_into()
                .map_err(|_| Error::<T>::InvalidAssetPath)?;
            let creator_qor_id_bounded: BoundedVec<u8, ConstU32<MAX_QOR_ID_LENGTH>> = creator_qor_id
                .try_into()
                .map_err(|_| Error::<T>::InvalidAssetPath)?;
            let ue5_asset_path_bounded: BoundedVec<u8, ConstU32<MAX_ASSET_PATH_LENGTH>> = ue5_asset_path
                .clone()
                .try_into()
                .map_err(|_| Error::<T>::InvalidAssetPath)?;
            let glass_material_bounded: BoundedVec<u8, ConstU32<MAX_MATERIAL_PATH_LENGTH>> = glass_material
                .try_into()
                .map_err(|_| Error::<T>::InvalidAssetPath)?;
            let vfx_socket_bounded: BoundedVec<u8, ConstU32<MAX_SOCKET_NAME_LENGTH>> = vfx_socket
                .try_into()
                .map_err(|_| Error::<T>::InvalidAssetPath)?;
            
            // Generate UUID from creator + asset path + block number
            let mut data = creator.encode();
            data.extend_from_slice(&ue5_asset_path);
            data.extend_from_slice(&frame_system::Pallet::<T>::block_number().encode());
            let uuid = sp_io::hashing::blake2_256(&data);
            
            // Ensure UUID doesn't exist
            ensure!(!Items::<T>::contains_key(&uuid), Error::<T>::ItemAlreadyExists);
            
            // Create metadata with all DRC-369 modules initialized
            let current_block = frame_system::Pallet::<T>::block_number();
            let metadata = Drc369Metadata {
                uuid,
                name: name_bounded,
                creator_qor_id: creator_qor_id_bounded,
                creator_account: creator.clone(),
                ue5_asset_path: ue5_asset_path_bounded,
                glass_material: glass_material_bounded,
                vfx_socket: vfx_socket_bounded,
                is_soulbound,
                royalty_fee_percent,
                minted_at: current_block,
                // Module 1: Multi-Resource (empty initially, can be added later)
                resources: BoundedVec::new(),
                // Module 2: Nesting (no parent, no children initially)
                parent_uuid: None,
                equipment_slots: BoundedVec::new(),
                children_uuids: BoundedVec::new(),
                // Module 3: Delegation (no delegation initially)
                delegation: None,
                // Module 4: Stateful NFT fields (initialized)
                experience_points: 0,
                level: 1,
                durability: 100,
                kill_count: 0,
                class_id: 1, // Starting class
                last_state_update: current_block,
                custom_state: BoundedVec::new(),
            };
            
            // Store item
            Items::<T>::insert(&uuid, &metadata);
            ItemOwners::<T>::insert(&uuid, &creator);
            
            // Add to creator's inventory
            OwnerItems::<T>::try_mutate(&creator, |items| {
                items.try_push(uuid).map_err(|_| Error::<T>::TooManyItems)
            })?;
            
            // Increment total
            TotalItems::<T>::mutate(|total| *total = total.saturating_add(1));
            
            Self::deposit_event(Event::ItemMinted {
                uuid,
                owner: creator.clone(),
                creator,
            });
            
            Ok(())
        }
        
        /// Initiate a trade offer (free for receiver to accept)
        ///
        /// # Arguments
        /// * `item_uuid` - UUID of item to trade
        /// * `receiver` - Account to receive the offer
        #[pallet::call_index(1)]
        #[pallet::weight(30_000)]
        pub fn initiate_trade(
            origin: OriginFor<T>,
            item_uuid: [u8; 32],
            receiver: T::AccountId,
        ) -> DispatchResult {
            let initiator = ensure_signed(origin)?;
            
            // Cannot trade with yourself
            ensure!(initiator != receiver, Error::<T>::CannotTradeWithSelf);
            
            // Verify ownership
            let owner = ItemOwners::<T>::get(&item_uuid)
                .ok_or(Error::<T>::ItemNotFound)?;
            ensure!(owner == initiator, Error::<T>::NotItemOwner);
            
            // Check soulbound
            let item = Items::<T>::get(&item_uuid)
                .ok_or(Error::<T>::ItemNotFound)?;
            ensure!(!item.is_soulbound, Error::<T>::ItemIsSoulbound);
            
            // Generate offer ID
            let mut data = item_uuid.to_vec();
            data.extend_from_slice(&initiator.encode());
            data.extend_from_slice(&receiver.encode());
            data.extend_from_slice(&frame_system::Pallet::<T>::block_number().encode());
            let offer_id = sp_io::hashing::blake2_256(&data);
            
            // Create trade offer
            let offer = TradeOffer {
                offer_id,
                item_uuid,
                initiator: initiator.clone(),
                receiver: receiver.clone(),
                status: TradeStatus::Pending,
                created_at: frame_system::Pallet::<T>::block_number(),
            };
            
            // Store offer
            TradeOffers::<T>::insert(&offer_id, &offer);
            
            Self::deposit_event(Event::TradeOfferCreated {
                offer_id,
                initiator,
                receiver,
                item_uuid,
            });
            
            Ok(())
        }
        
        /// Accept a trade offer (FREE - no cost to receiver)
        ///
        /// # Arguments
        /// * `offer_id` - ID of the trade offer to accept
        #[pallet::call_index(2)]
        #[pallet::weight(30_000)]
        pub fn accept_trade(
            origin: OriginFor<T>,
            offer_id: [u8; 32],
        ) -> DispatchResult {
            let receiver = ensure_signed(origin)?;
            
            // Get trade offer
            let offer = TradeOffers::<T>::get(&offer_id)
                .ok_or(Error::<T>::TradeOfferNotFound)?;
            
            // Verify receiver
            ensure!(offer.receiver == receiver, Error::<T>::NotAuthorizedToAcceptTrade);
            
            // Verify status
            ensure!(offer.status == TradeStatus::Pending, Error::<T>::TradeOfferAlreadyProcessed);
            
            // Get item metadata
            let item = Items::<T>::get(&offer.item_uuid)
                .ok_or(Error::<T>::ItemNotFound)?;
            
            // Transfer ownership atomically
            Self::do_transfer(&offer.item_uuid, &offer.initiator, &receiver)?;
            
            // Pay royalty to creator if applicable and receiver has balance
            if item.royalty_fee_percent > 0 && item.creator_account != receiver {
                // Calculate royalty (simplified: 1 CGT base * royalty%)
                // In production, this would be based on sale price
                let royalty_amount: BalanceOf<T> = 100_000_000u128.try_into().ok()
                    .and_then(|base: BalanceOf<T>| {
                        base.checked_mul(&(item.royalty_fee_percent as u32).into())
                    })
                    .ok_or(Error::<T>::InsufficientBalanceForRoyalty)?;
                
                // Attempt to transfer royalty
                if T::Currency::free_balance(&receiver) >= royalty_amount {
                    let _ = T::Currency::transfer(
                        &receiver,
                        &item.creator_account,
                        royalty_amount,
                        ExistenceRequirement::KeepAlive,
                    );
                    
                    Self::deposit_event(Event::RoyaltyPaid {
                        item_uuid: offer.item_uuid,
                        creator: item.creator_account,
                        amount: royalty_amount,
                    });
                }
            }
            
            // Update offer status
            TradeOffers::<T>::mutate(&offer_id, |maybe_offer| {
                if let Some(ref mut o) = maybe_offer {
                    o.status = TradeStatus::Accepted;
                }
            });
            
            Self::deposit_event(Event::TradeAccepted {
                offer_id,
                item_uuid: offer.item_uuid,
                from: offer.initiator,
                to: receiver,
            });
            
            Ok(())
        }
        
        /// Cancel a pending trade offer
        ///
        /// # Arguments
        /// * `offer_id` - ID of the trade offer to cancel
        #[pallet::call_index(3)]
        #[pallet::weight(20_000)]
        pub fn cancel_trade(
            origin: OriginFor<T>,
            offer_id: [u8; 32],
        ) -> DispatchResult {
            let who = ensure_signed(origin)?;
            
            // Get trade offer
            let offer = TradeOffers::<T>::get(&offer_id)
                .ok_or(Error::<T>::TradeOfferNotFound)?;
            
            // Only initiator can cancel
            ensure!(offer.initiator == who, Error::<T>::NotItemOwner);
            
            // Verify status
            ensure!(offer.status == TradeStatus::Pending, Error::<T>::TradeOfferAlreadyProcessed);
            
            // Update offer status
            TradeOffers::<T>::mutate(&offer_id, |maybe_offer| {
                if let Some(ref mut o) = maybe_offer {
                    o.status = TradeStatus::Cancelled;
                }
            });
            
            Self::deposit_event(Event::TradeCancelled { offer_id });
            
            Ok(())
        }
        
        // ═══════════════════════════════════════════════════════════════════════════
        // STATEFUL NFT FUNCTIONS
        // ═══════════════════════════════════════════════════════════════════════════
        
        /// Add experience points to an item (e.g., after killing a boss)
        #[pallet::call_index(4)]
        #[pallet::weight(20_000)]
        pub fn add_experience(
            origin: OriginFor<T>,
            item_uuid: [u8; 32],
            xp_amount: u64,
        ) -> DispatchResult {
            let who = ensure_signed(origin)?;
            
            // Verify ownership
            let owner = ItemOwners::<T>::get(&item_uuid)
                .ok_or(Error::<T>::ItemNotFound)?;
            ensure!(owner == who, Error::<T>::NotItemOwner);
            
            // Get and update item
            Items::<T>::mutate(&item_uuid, |maybe_item| {
                let item = maybe_item.as_mut().ok_or(Error::<T>::ItemNotFound)?;
                
                // Add XP
                let old_xp = item.experience_points;
                let new_xp = old_xp.saturating_add(xp_amount);
                item.experience_points = new_xp;
                
                // Calculate new level (simple formula: level = sqrt(XP / 100))
                let old_level = item.level;
                let new_level = ((new_xp as f64 / 100.0).sqrt() as u32).max(1);
                item.level = new_level;
                item.last_state_update = frame_system::Pallet::<T>::block_number();
                
                // Emit events
                Self::deposit_event(Event::ExperienceAdded {
                    item_uuid,
                    xp_added: xp_amount,
                    new_total: new_xp,
                    new_level,
                });
                
                if new_level > old_level {
                    Self::deposit_event(Event::ItemLeveledUp {
                        item_uuid,
                        old_level,
                        new_level,
                    });
                }
                
                Ok::<(), Error<T>>(())
            })?;
            
            Ok(())
        }
        
        /// Update item durability (decreases with use)
        #[pallet::call_index(5)]
        #[pallet::weight(20_000)]
        pub fn update_durability(
            origin: OriginFor<T>,
            item_uuid: [u8; 32],
            durability_change: i8, // Can be negative (damage) or positive (repair)
        ) -> DispatchResult {
            let who = ensure_signed(origin)?;
            
            // Verify ownership or delegation
            Self::ensure_can_modify(&item_uuid, &who)?;
            
            // Get and update item
            Items::<T>::mutate(&item_uuid, |maybe_item| {
                let item = maybe_item.as_mut().ok_or(Error::<T>::ItemNotFound)?;
                
                // Update durability (clamped to 0-100)
                let current = item.durability as i16;
                let new_durability = (current + durability_change as i16)
                    .max(0)
                    .min(100) as u8;
                
                item.durability = new_durability;
                item.last_state_update = frame_system::Pallet::<T>::block_number();
                
                Self::deposit_event(Event::DurabilityUpdated {
                    item_uuid,
                    new_durability,
                });
                
                Ok::<(), Error<T>>(())
            })?;
            
            Ok(())
        }
        
        /// Increment kill count (for weapons/items)
        #[pallet::call_index(6)]
        #[pallet::weight(20_000)]
        pub fn increment_kill_count(
            origin: OriginFor<T>,
            item_uuid: [u8; 32],
        ) -> DispatchResult {
            let who = ensure_signed(origin)?;
            
            // Verify ownership
            let owner = ItemOwners::<T>::get(&item_uuid)
                .ok_or(Error::<T>::ItemNotFound)?;
            ensure!(owner == who, Error::<T>::NotItemOwner);
            
            // Get and update item
            Items::<T>::mutate(&item_uuid, |maybe_item| {
                let item = maybe_item.as_mut().ok_or(Error::<T>::ItemNotFound)?;
                
                item.kill_count = item.kill_count.saturating_add(1);
                item.last_state_update = frame_system::Pallet::<T>::block_number();
                
                Self::deposit_event(Event::KillCountIncremented {
                    item_uuid,
                    new_kill_count: item.kill_count,
                });
                
                Ok::<(), Error<T>>(())
            })?;
            
            Ok(())
        }
        
        /// Evolve item class (e.g., when reaching level 50)
        #[pallet::call_index(7)]
        #[pallet::weight(30_000)]
        pub fn evolve_class(
            origin: OriginFor<T>,
            item_uuid: [u8; 32],
            new_class_id: u32,
        ) -> DispatchResult {
            let who = ensure_signed(origin)?;
            
            // Verify ownership (delegated users cannot evolve)
            let owner = ItemOwners::<T>::get(&item_uuid)
                .ok_or(Error::<T>::ItemNotFound)?;
            ensure!(owner == who, Error::<T>::NotItemOwner);
            
            // Get and update item
            Items::<T>::mutate(&item_uuid, |maybe_item| {
                let item = maybe_item.as_mut().ok_or(Error::<T>::ItemNotFound)?;
                
                // Check evolution requirements (e.g., level >= 50)
                ensure!(item.level >= 50, Error::<T>::CannotEvolve);
                
                let old_class = item.class_id;
                item.class_id = new_class_id;
                item.last_state_update = frame_system::Pallet::<T>::block_number();
                
                Self::deposit_event(Event::ClassEvolved {
                    item_uuid,
                    old_class_id: old_class,
                    new_class_id,
                });
                
                Ok::<(), Error<T>>(())
            })?;
            
            Ok(())
        }
        
        // ═══════════════════════════════════════════════════════════════════════════
        // MODULE 1: MULTI-RESOURCE POLYMORPHISM FUNCTIONS
        // ═══════════════════════════════════════════════════════════════════════════
        
        /// Add a resource to an NFT (e.g., 2D icon, 3D model, sound)
        #[pallet::call_index(8)]
        #[pallet::weight(30_000)]
        pub fn add_resource(
            origin: OriginFor<T>,
            item_uuid: [u8; 32],
            resource_type: Vec<u8>,
            uri: Vec<u8>,
            priority: u8,
            context_tags: Vec<Vec<u8>>,
        ) -> DispatchResult {
            let who = ensure_signed(origin)?;
            
            // Verify ownership or delegation
            Self::ensure_can_modify(&item_uuid, &who)?;
            
            let resource_type_bounded: BoundedVec<u8, ConstU32<MAX_RESOURCE_TYPE_LENGTH>> = resource_type
                .clone()
                .try_into()
                .map_err(|_| Error::<T>::ResourceNotFound)?;
            let uri_bounded: BoundedVec<u8, ConstU32<MAX_RESOURCE_URI_LENGTH>> = uri
                .try_into()
                .map_err(|_| Error::<T>::ResourceNotFound)?;
            
            let context_tags_vec: Vec<BoundedVec<u8, ConstU32<16>>> = context_tags
                .into_iter()
                .take(10)
                .map(|tag| tag.try_into().map_err(|_| Error::<T>::ResourceNotFound))
                .collect::<Result<Vec<_>, _>>()?;
            let context_tags_bounded: BoundedVec<BoundedVec<u8, ConstU32<16>>, ConstU32<10>> = context_tags_vec
                .try_into()
                .map_err(|_| Error::<T>::ResourceNotFound)?;
            
            Items::<T>::mutate(&item_uuid, |maybe_item| {
                let item = maybe_item.as_mut().ok_or(Error::<T>::ItemNotFound)?;
                
                let resource = Resource {
                    resource_type: resource_type_bounded.clone(),
                    uri: uri_bounded,
                    priority,
                    context_tags: context_tags_bounded,
                };
                
                item.resources.try_push(resource)
                    .map_err(|_| Error::<T>::TooManyResources)?;
                
                Ok::<(), Error<T>>(())
            })?;
            
            Self::deposit_event(Event::ResourceAdded {
                item_uuid,
                resource_type: resource_type_bounded.to_vec(),
            });
            
            Ok(())
        }
        
        /// Remove a resource from an NFT
        #[pallet::call_index(9)]
        #[pallet::weight(20_000)]
        pub fn remove_resource(
            origin: OriginFor<T>,
            item_uuid: [u8; 32],
            resource_type: Vec<u8>,
        ) -> DispatchResult {
            let who = ensure_signed(origin)?;
            
            Self::ensure_can_modify(&item_uuid, &who)?;
            
            let resource_type_bounded: BoundedVec<u8, ConstU32<MAX_RESOURCE_TYPE_LENGTH>> = resource_type
                .clone()
                .try_into()
                .map_err(|_| Error::<T>::ResourceNotFound)?;
            
            Items::<T>::mutate(&item_uuid, |maybe_item| {
                let item = maybe_item.as_mut().ok_or(Error::<T>::ItemNotFound)?;
                
                let index = item.resources.iter()
                    .position(|r| r.resource_type == resource_type_bounded)
                    .ok_or(Error::<T>::ResourceNotFound)?;
                
                item.resources.remove(index);
                
                Ok::<(), Error<T>>(())
            })?;
            
            Self::deposit_event(Event::ResourceRemoved {
                item_uuid,
                resource_type: resource_type_bounded.to_vec(),
            });
            
            Ok(())
        }
        
        // ═══════════════════════════════════════════════════════════════════════════
        // MODULE 2: NESTING & EQUIPPABLE FUNCTIONS
        // ═══════════════════════════════════════════════════════════════════════════
        
        /// Nest a child NFT inside a parent NFT (atomic ownership transfer)
        #[pallet::call_index(10)]
        #[pallet::weight(40_000)]
        pub fn nest_nft(
            origin: OriginFor<T>,
            parent_uuid: [u8; 32],
            child_uuid: [u8; 32],
        ) -> DispatchResult {
            let who = ensure_signed(origin)?;
            
            // Verify ownership of both NFTs
            let parent_owner = ItemOwners::<T>::get(&parent_uuid)
                .ok_or(Error::<T>::ItemNotFound)?;
            let child_owner = ItemOwners::<T>::get(&child_uuid)
                .ok_or(Error::<T>::ItemNotFound)?;
            
            ensure!(parent_owner == who, Error::<T>::NotItemOwner);
            ensure!(child_owner == who, Error::<T>::NotItemOwner);
            
            // Prevent circular nesting
            Self::ensure_no_circular_nesting(&parent_uuid, &child_uuid)?;
            
            // Get items
            let mut parent = Items::<T>::get(&parent_uuid)
                .ok_or(Error::<T>::ItemNotFound)?;
            let mut child = Items::<T>::get(&child_uuid)
                .ok_or(Error::<T>::ItemNotFound)?;
            
            // Check limits
            ensure!(
                parent.children_uuids.len() < MAX_NESTED_CHILDREN as usize,
                Error::<T>::TooManyChildren
            );
            ensure!(child.parent_uuid.is_none(), Error::<T>::AlreadyNested);
            
            // Update parent
            parent.children_uuids.try_push(child_uuid)
                .map_err(|_| Error::<T>::TooManyChildren)?;
            
            // Update child
            child.parent_uuid = Some(parent_uuid);
            
            // Update storage
            Items::<T>::insert(&parent_uuid, &parent);
            Items::<T>::insert(&child_uuid, &child);
            ParentLookup::<T>::insert(&child_uuid, &parent_uuid);
            
            // Remove child from owner's direct inventory (now owned by parent)
            OwnerItems::<T>::mutate(&who, |items| {
                items.retain(|&uuid| uuid != child_uuid);
            });
            
            Self::deposit_event(Event::NftNested {
                parent_uuid,
                child_uuid,
            });
            
            Ok(())
        }
        
        /// Unnest a child NFT from its parent
        #[pallet::call_index(11)]
        #[pallet::weight(40_000)]
        pub fn unnest_nft(
            origin: OriginFor<T>,
            parent_uuid: [u8; 32],
            child_uuid: [u8; 32],
        ) -> DispatchResult {
            let who = ensure_signed(origin)?;
            
            let parent_owner = ItemOwners::<T>::get(&parent_uuid)
                .ok_or(Error::<T>::ItemNotFound)?;
            ensure!(parent_owner == who, Error::<T>::NotItemOwner);
            
            let mut parent = Items::<T>::get(&parent_uuid)
                .ok_or(Error::<T>::ItemNotFound)?;
            let mut child = Items::<T>::get(&child_uuid)
                .ok_or(Error::<T>::ItemNotFound)?;
            
            // Verify child is nested in parent
            ensure!(child.parent_uuid == Some(parent_uuid), Error::<T>::ItemNotFound);
            
            // Remove from parent's children
            parent.children_uuids.retain(|&uuid| uuid != child_uuid);
            
            // Remove parent from child
            child.parent_uuid = None;
            
            // Update storage
            Items::<T>::insert(&parent_uuid, &parent);
            Items::<T>::insert(&child_uuid, &child);
            ParentLookup::<T>::remove(&child_uuid);
            
            // Add child back to owner's inventory
            OwnerItems::<T>::try_mutate(&who, |items| {
                items.try_push(child_uuid).map_err(|_| Error::<T>::TooManyItems)
            })?;
            
            Self::deposit_event(Event::NftUnnested {
                parent_uuid,
                child_uuid,
            });
            
            Ok(())
        }
        
        /// Equip a child NFT to a specific slot
        #[pallet::call_index(12)]
        #[pallet::weight(30_000)]
        pub fn equip_nft(
            origin: OriginFor<T>,
            parent_uuid: [u8; 32],
            child_uuid: [u8; 32],
            slot_name: Vec<u8>,
        ) -> DispatchResult {
            let who = ensure_signed(origin)?;
            
            Self::ensure_can_modify(&parent_uuid, &who)?;
            
            // Verify child is nested in parent
            let child = Items::<T>::get(&child_uuid)
                .ok_or(Error::<T>::ItemNotFound)?;
            ensure!(child.parent_uuid == Some(parent_uuid), Error::<T>::ItemNotFound);
            
            let slot_name_bounded: BoundedVec<u8, ConstU32<MAX_SLOT_NAME_LENGTH>> = slot_name
                .clone()
                .try_into()
                .map_err(|_| Error::<T>::SlotNotFound)?;
            
            Items::<T>::mutate(&parent_uuid, |maybe_parent| {
                let parent = maybe_parent.as_mut().ok_or(Error::<T>::ItemNotFound)?;
                
                // Find slot
                let slot = parent.equipment_slots.iter_mut()
                    .find(|s| s.slot_name == slot_name_bounded)
                    .ok_or(Error::<T>::SlotNotFound)?;
                
                // Check if slot is occupied
                ensure!(slot.equipped_child.is_none(), Error::<T>::SlotOccupied);
                
                // Validate trait if required
                if let Some(required_trait) = slot.required_trait {
                    ensure!(child.class_id == required_trait, Error::<T>::InvalidTraitForSlot);
                }
                
                // Equip
                slot.equipped_child = Some(child_uuid);
                
                Ok::<(), Error<T>>(())
            })?;
            
            Self::deposit_event(Event::NftEquipped {
                parent_uuid,
                child_uuid,
                slot_name,
            });
            
            Ok(())
        }
        
        /// Unequip a child NFT from a slot
        #[pallet::call_index(13)]
        #[pallet::weight(20_000)]
        pub fn unequip_nft(
            origin: OriginFor<T>,
            parent_uuid: [u8; 32],
            slot_name: Vec<u8>,
        ) -> DispatchResult {
            let who = ensure_signed(origin)?;
            
            Self::ensure_can_modify(&parent_uuid, &who)?;
            
            let slot_name_bounded: BoundedVec<u8, ConstU32<MAX_SLOT_NAME_LENGTH>> = slot_name
                .clone()
                .try_into()
                .map_err(|_| Error::<T>::SlotNotFound)?;
            
            Items::<T>::mutate(&parent_uuid, |maybe_parent| {
                let parent = maybe_parent.as_mut().ok_or(Error::<T>::ItemNotFound)?;
                
                let slot = parent.equipment_slots.iter_mut()
                    .find(|s| s.slot_name == slot_name_bounded)
                    .ok_or(Error::<T>::SlotNotFound)?;
                
                if let Some(child_uuid) = slot.equipped_child {
                    slot.equipped_child = None;
                    
                    Ok::<[u8; 32], Error<T>>(child_uuid)
                } else {
                    Err(Error::<T>::SlotNotFound)
                }
            })
            .and_then(|child_uuid| {
                Self::deposit_event(Event::NftUnequipped {
                    parent_uuid,
                    child_uuid,
                    slot_name,
                });
                Ok(())
            })?;
            
            Ok(())
        }
        
        /// Add an equipment slot to an NFT
        #[pallet::call_index(14)]
        #[pallet::weight(25_000)]
        pub fn add_equipment_slot(
            origin: OriginFor<T>,
            item_uuid: [u8; 32],
            slot_name: Vec<u8>,
            slot_type: SlotType,
            required_trait: Option<u32>,
        ) -> DispatchResult {
            let who = ensure_signed(origin)?;
            
            Self::ensure_can_modify(&item_uuid, &who)?;
            
            let slot_name_bounded: BoundedVec<u8, ConstU32<MAX_SLOT_NAME_LENGTH>> = slot_name
                .clone()
                .try_into()
                .map_err(|_| Error::<T>::SlotNotFound)?;
            
            Items::<T>::mutate(&item_uuid, |maybe_item| {
                let item = maybe_item.as_mut().ok_or(Error::<T>::ItemNotFound)?;
                
                // Check if slot already exists
                ensure!(
                    !item.equipment_slots.iter().any(|s| s.slot_name == slot_name_bounded),
                    Error::<T>::SlotOccupied
                );
                
                let slot = EquipmentSlot {
                    slot_name: slot_name_bounded.clone(),
                    equipped_child: None,
                    required_trait,
                    slot_type,
                };
                
                item.equipment_slots.try_push(slot)
                    .map_err(|_| Error::<T>::TooManyChildren)?;
                
                Ok::<(), Error<T>>(())
            })?;
            
            Self::deposit_event(Event::EquipmentSlotAdded {
                item_uuid,
                slot_name: slot_name_bounded.to_vec(),
            });
            
            Ok(())
        }
        
        // ═══════════════════════════════════════════════════════════════════════════
        // MODULE 3: DELEGATION & RENTAL FUNCTIONS
        // ═══════════════════════════════════════════════════════════════════════════
        
        /// Delegate NFT usage to another account (with optional expiry)
        #[pallet::call_index(15)]
        #[pallet::weight(30_000)]
        pub fn delegate_nft(
            origin: OriginFor<T>,
            item_uuid: [u8; 32],
            user: T::AccountId,
            expires_at_block: Option<BlockNumberFor<T>>,
        ) -> DispatchResult {
            let owner = ensure_signed(origin)?;
            
            let current_owner = ItemOwners::<T>::get(&item_uuid)
                .ok_or(Error::<T>::ItemNotFound)?;
            ensure!(current_owner == owner, Error::<T>::NotItemOwner);
            
            let current_block = frame_system::Pallet::<T>::block_number();
            
            // Validate expiry
            if let Some(expires_at) = expires_at_block {
                ensure!(expires_at > current_block, Error::<T>::DelegationExpired);
            }
            
            Items::<T>::mutate(&item_uuid, |maybe_item| {
                let item = maybe_item.as_mut().ok_or(Error::<T>::ItemNotFound)?;
                
                // Create delegation info
                item.delegation = Some(DelegationInfo {
                    delegated_user: Some(user.clone()),
                    expires_at_block,
                    delegated_at_block: current_block,
                });
                
                Ok::<(), Error<T>>(())
            })?;
            
            // Update delegated items lookup
            DelegatedItems::<T>::mutate(&user, |items| {
                if !items.iter().any(|&uuid| uuid == item_uuid) {
                    items.try_push(item_uuid).ok();
                }
            });
            
            Self::deposit_event(Event::NftDelegated {
                item_uuid,
                owner,
                delegated_user: user.clone(),
                expires_at_block,
            });
            
            Ok(())
        }
        
        /// Revoke delegation (owner reclaims usage)
        #[pallet::call_index(16)]
        #[pallet::weight(20_000)]
        pub fn revoke_delegation(
            origin: OriginFor<T>,
            item_uuid: [u8; 32],
        ) -> DispatchResult {
            let owner = ensure_signed(origin)?;
            
            let current_owner = ItemOwners::<T>::get(&item_uuid)
                .ok_or(Error::<T>::ItemNotFound)?;
            ensure!(current_owner == owner, Error::<T>::NotItemOwner);
            
            Items::<T>::mutate(&item_uuid, |maybe_item| {
                let item = maybe_item.as_mut().ok_or(Error::<T>::ItemNotFound)?;
                
                if let Some(delegation) = &item.delegation {
                    if let Some(user) = &delegation.delegated_user {
                        // Remove from delegated items lookup
                        DelegatedItems::<T>::mutate(user, |items| {
                            items.retain(|&uuid| uuid != item_uuid);
                        });
                        
                        Self::deposit_event(Event::DelegationRevoked {
                            item_uuid,
                            owner: owner.clone(),
                            delegated_user: user.clone(),
                        });
                    }
                }
                
                item.delegation = None;
                
                Ok::<(), Error<T>>(())
            })?;
            
            Ok(())
        }
    }

    #[pallet::hooks]
    impl<T: Config> Hooks<BlockNumberFor<T>> for Pallet<T> {
        /// Check for expired delegations and automatically revoke them
        fn on_initialize(_n: BlockNumberFor<T>) -> Weight {
            // In production, efficiently iterate through delegated items
            // For now, this is handled on-demand in queries
            // Full implementation would use efficient iteration or OCW
            Weight::from_parts(1_000, 0)
        }
    }

    impl<T: Config> Pallet<T> {
        /// Internal transfer logic (handles nested children atomically)
        fn do_transfer(
            item_uuid: &[u8; 32],
            from: &T::AccountId,
            to: &T::AccountId,
        ) -> DispatchResult {
            // Get item
            let item = Items::<T>::get(item_uuid)
                .ok_or(Error::<T>::ItemNotFound)?;
            
            // Update owner for this NFT and all nested children (atomic)
            // Children are already nested, so we just update their owner reference
            // but they stay nested in the parent
            ItemOwners::<T>::insert(item_uuid, to);
            
            // Update owner for all nested children (they transfer with parent)
            for &child_uuid in item.children_uuids.iter() {
                ItemOwners::<T>::insert(&child_uuid, to);
                
                // Revoke delegation on children too
                Items::<T>::mutate(&child_uuid, |maybe_child| {
                    if let Some(child) = maybe_child {
                        if let Some(delegation) = &child.delegation {
                            if let Some(user) = &delegation.delegated_user {
                                DelegatedItems::<T>::mutate(user, |items| {
                                    items.retain(|&uuid| uuid != child_uuid);
                                });
                            }
                        }
                        child.delegation = None;
                    }
                });
            }
            
            // Remove from sender's inventory (only if not nested)
            if item.parent_uuid.is_none() {
                OwnerItems::<T>::mutate(from, |items| {
                    items.retain(|&uuid| uuid != *item_uuid);
                });
                
                // Add to receiver's inventory
                OwnerItems::<T>::try_mutate(to, |items| {
                    items.try_push(*item_uuid).map_err(|_| Error::<T>::TooManyItems)
                })?;
            }
            
            // Revoke any active delegation on this NFT
            Items::<T>::mutate(item_uuid, |maybe_item| {
                if let Some(item) = maybe_item {
                    if let Some(delegation) = &item.delegation {
                        if let Some(user) = &delegation.delegated_user {
                            DelegatedItems::<T>::mutate(user, |items| {
                                items.retain(|&uuid| uuid != *item_uuid);
                            });
                        }
                    }
                    item.delegation = None;
                }
            });
            
            Self::deposit_event(Event::ItemTransferred {
                uuid: *item_uuid,
                from: from.clone(),
                to: to.clone(),
            });
            
            Ok(())
        }
        
        /// Ensure no circular nesting (prevent parent -> child -> parent loops)
        fn ensure_no_circular_nesting(
            parent_uuid: &[u8; 32],
            child_uuid: &[u8; 32],
        ) -> DispatchResult {
            // Check if child is an ancestor of parent
            let mut current = Some(*parent_uuid);
            let mut depth = 0;
            let max_depth = 100; // Prevent infinite loops
            
            while let Some(uuid) = current {
                if uuid == *child_uuid {
                    return Err(Error::<T>::CircularNesting.into());
                }
                
                if let Some(item) = Items::<T>::get(&uuid) {
                    current = item.parent_uuid;
                } else {
                    break;
                }
                
                depth += 1;
                if depth > max_depth {
                    break; // Safety: prevent infinite loops
                }
            }
            
            Ok(())
        }
        
        /// Ensure account can modify NFT (owner or delegated user)
        fn ensure_can_modify(
            item_uuid: &[u8; 32],
            who: &T::AccountId,
        ) -> DispatchResult {
            let owner = ItemOwners::<T>::get(item_uuid)
                .ok_or(Error::<T>::ItemNotFound)?;
            
            // Check if owner
            if owner == *who {
                return Ok(());
            }
            
            // Check if delegated user
            let item = Items::<T>::get(item_uuid)
                .ok_or(Error::<T>::ItemNotFound)?;
            
            if let Some(delegation) = &item.delegation {
                if let Some(delegated_user) = &delegation.delegated_user {
                    if delegated_user == who {
                        // Check if delegation expired
                        let current_block = frame_system::Pallet::<T>::block_number();
                        if let Some(expires_at) = delegation.expires_at_block {
                            if current_block >= expires_at {
                                return Err(Error::<T>::DelegationExpired.into());
                            }
                        }
                        return Ok(());
                    }
                }
            }
            
            Err(Error::<T>::NotItemOwner.into())
        }
        
        /// Check and expire delegations (called on-demand or via hooks)
        pub fn check_expired_delegations(item_uuid: &[u8; 32]) -> DispatchResult {
            let current_block = frame_system::Pallet::<T>::block_number();
            
            Items::<T>::mutate(item_uuid, |maybe_item| {
                if let Some(item) = maybe_item {
                    if let Some(delegation) = &item.delegation {
                        if let Some(expires_at) = delegation.expires_at_block {
                            if current_block >= expires_at {
                                if let Some(user) = &delegation.delegated_user {
                                    let owner = ItemOwners::<T>::get(item_uuid)
                                        .ok_or(Error::<T>::ItemNotFound)?;
                                    
                                    DelegatedItems::<T>::mutate(user, |items| {
                                        items.retain(|uuid| uuid != item_uuid);
                                    });
                                    
                                    Self::deposit_event(Event::DelegationExpired {
                                        item_uuid: *item_uuid,
                                        owner: owner.clone(),
                                        delegated_user: user.clone(),
                                    });
                                }
                                
                                item.delegation = None;
                            }
                        }
                    }
                }
                Ok::<(), Error<T>>(())
            })?;
            
            Ok(())
        }
    }
}
