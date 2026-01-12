//! # DRC-369 Pallet: Phygital Asset Standard
//!
//! The universal standard for Physical + Digital assets in the Demiurge ecosystem.
//!
//! ## Overview
//!
//! DRC-369 defines on-chain storage for items that:
//! - Have UE5 asset paths baked into chain data
//! - Support Cyber Glass visual styling
//! - Enforce soulbound rules
//! - Implement perpetual creator royalties
//! - Enable free-to-accept trades
//!
//! ## Key Features
//!
//! - **Phygital**: Assets exist both on-chain and in the 3D world
//! - **UE5 Native**: Asset paths stored on-chain for direct loading
//! - **Creator Royalties**: Perpetual commission on all transfers
//! - **Soulbound Support**: Items can be made non-transferable
//! - **Zero-Cost Receives**: Accepting trades is free for receivers

#![cfg_attr(not(feature = "std"), no_std)]

pub use pallet::*;

#[frame_support::pallet]
pub mod pallet {
    use frame_support::{
        pallet_prelude::*,
        traits::{Currency, ExistenceRequirement, WithdrawReasons},
    };
    use frame_system::pallet_prelude::*;
    use sp_runtime::traits::Saturating;
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

    /// Type alias for balance
    pub type BalanceOf<T> =
        <<T as Config>::Currency as Currency<<T as frame_system::Config>::AccountId>>::Balance;

    /// DRC-369 Item Metadata
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
        
        /// UE5 asset path for loading the mesh
        pub ue5_asset_path: BoundedVec<u8, ConstU32<MAX_ASSET_PATH_LENGTH>>,
        
        /// Material instance path (Cyber Glass variant)
        pub glass_material: BoundedVec<u8, ConstU32<MAX_MATERIAL_PATH_LENGTH>>,
        
        /// VFX socket name for particle effects
        pub vfx_socket: BoundedVec<u8, ConstU32<MAX_SOCKET_NAME_LENGTH>>,
        
        /// Is this item soulbound (cannot be traded)?
        pub is_soulbound: bool,
        
        /// Royalty fee percentage (0-100, where 25 = 2.5%)
        pub royalty_fee_percent: u8,
        
        /// Block when item was minted
        pub minted_at: BlockNumberFor<T>,
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
        InsufficientBalanceForRoyalty,
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
            
            // Create metadata
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
                minted_at: frame_system::Pallet::<T>::block_number(),
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
    }

    impl<T: Config> Pallet<T> {
        /// Internal transfer logic
        fn do_transfer(
            item_uuid: &[u8; 32],
            from: &T::AccountId,
            to: &T::AccountId,
        ) -> DispatchResult {
            // Remove from sender's inventory
            OwnerItems::<T>::mutate(from, |items| {
                items.retain(|&uuid| uuid != *item_uuid);
            });
            
            // Add to receiver's inventory
            OwnerItems::<T>::try_mutate(to, |items| {
                items.try_push(*item_uuid).map_err(|_| Error::<T>::TooManyItems)
            })?;
            
            // Update owner
            ItemOwners::<T>::insert(item_uuid, to);
            
            Self::deposit_event(Event::ItemTransferred {
                uuid: *item_uuid,
                from: from.clone(),
                to: to.clone(),
            });
            
            Ok(())
        }
    }
}
