//! # DRC-369 Off-Chain Workers: Real-World Game Data Integration
//!
//! This pallet uses Off-Chain Workers (OCW) to securely fetch real-world game data
//! and update DRC-369 NFT state on-chain without requiring expensive oracles.
//!
//! ## Use Cases
//!
//! 1. **Game Score Synchronization**: Fetch player scores from game servers
//! 2. **Battle Results**: Update NFT state after battles complete
//! 3. **Achievement Verification**: Verify achievements from external APIs
//! 4. **Leaderboard Updates**: Sync leaderboard data to on-chain state

#![cfg_attr(not(feature = "std"), no_std)]

pub use pallet::*;

#[frame_support::pallet]
pub mod pallet {
    use frame_support::{
        pallet_prelude::*,
        traits::Get,
        weights::Weight,
    };
    use frame_system::pallet_prelude::*;
    use sp_runtime::{
        offchain::http,
        traits::{Saturating, Zero},
    };
    use sp_std::prelude::*;

    /// Maximum length for API URLs
    pub const MAX_URL_LENGTH: u32 = 512;
    
    /// Maximum length for game IDs
    pub const MAX_GAME_ID_LENGTH: u32 = 64;

    /// Game data source configuration
    #[derive(Clone, Encode, Decode, Eq, PartialEq, RuntimeDebug, TypeInfo, MaxEncodedLen)]
    #[scale_info(skip_type_params(T))]
    pub struct GameDataSource<T: Config> where T: Config {
        /// Game identifier
        pub game_id: BoundedVec<u8, ConstU32<MAX_GAME_ID_LENGTH>>,
        
        /// API endpoint URL
        pub api_url: BoundedVec<u8, ConstU32<MAX_URL_LENGTH>>,
        
        /// API key (optional, for authenticated requests)
        pub api_key: Option<BoundedVec<u8, ConstU32<64>>>,
        
        /// Update interval in blocks
        pub update_interval: BlockNumberFor<T>,
        
        /// Last update block
        pub last_updated: BlockNumberFor<T>,
    }

    /// Game data result (fetched from external API)
    #[derive(Clone, Encode, Decode, Eq, PartialEq, RuntimeDebug, TypeInfo, MaxEncodedLen)]
    pub struct GameDataResult {
        /// NFT UUID this data applies to
        pub nft_uuid: [u8; 32],
        
        /// Player score/XP from game
        pub score: Option<u64>,
        
        /// Battle wins
        pub wins: Option<u32>,
        
        /// Battle losses
        pub losses: Option<u32>,
        
        /// Achievement flags
        pub achievements: BoundedVec<u32, ConstU32<20>>,
        
        /// Timestamp when data was fetched (Unix milliseconds)
        pub fetched_at: u64,
    }

    #[pallet::config]
    pub trait Config: frame_system::Config {
        type RuntimeEvent: From<Event<Self>> + IsType<<Self as frame_system::Config>::RuntimeEvent>;
        
        /// Maximum number of game data sources
        type MaxGameSources: Get<u32>;
    }

    #[pallet::pallet]
    #[pallet::without_storage_info]
    pub struct Pallet<T>(_);

    /// Storage: Game data sources by game ID
    #[pallet::storage]
    pub type GameDataSources<T: Config> = StorageMap<
        _,
        Blake2_128Concat,
        BoundedVec<u8, ConstU32<MAX_GAME_ID_LENGTH>>,
        GameDataSource<T>,
        OptionQuery,
    >;

    /// Storage: Pending game data updates (nft_uuid -> result)
    #[pallet::storage]
    pub type PendingUpdates<T: Config> = StorageMap<
        _,
        Blake2_128Concat,
        [u8; 32], // nft_uuid
        GameDataResult,
        OptionQuery,
    >;

    #[pallet::event]
    #[pallet::generate_deposit(pub(super) fn deposit_event)]
    pub enum Event<T: Config> {
        /// Game data source registered [game_id, api_url]
        GameDataSourceRegistered {
            game_id: Vec<u8>,
            api_url: Vec<u8>,
        },
        
        /// Game data fetched [nft_uuid, score, wins, losses]
        GameDataFetched {
            nft_uuid: [u8; 32],
            score: Option<u64>,
            wins: Option<u32>,
            losses: Option<u32>,
        },
        
        /// Game data update applied [nft_uuid]
        GameDataUpdateApplied {
            nft_uuid: [u8; 32],
        },
    }

    #[pallet::error]
    pub enum Error<T> {
        /// Game data source not found
        GameDataSourceNotFound,
        /// Invalid API URL
        InvalidApiUrl,
        /// Too many game sources
        TooManyGameSources,
        /// Failed to fetch game data
        FetchFailed,
        /// Invalid game data format
        InvalidGameData,
    }

    #[pallet::hooks]
    impl<T: Config> Hooks<BlockNumberFor<T>> for Pallet<T> {
        /// Off-chain worker: Fetch game data from external APIs
        fn offchain_worker(block_number: BlockNumberFor<T>) {
            // Only run on every Nth block to avoid excessive API calls
            if block_number % 10u32.into() != Zero::zero() {
                return;
            }

            // Iterate through registered game data sources
            // In production, this would be more efficient (e.g., only check sources due for update)
            // For now, iterate through all sources in storage
            for (_game_id, source) in GameDataSources::<T>::iter() {
                // Check if it's time to update
                let blocks_since_update = block_number.saturating_sub(source.last_updated);
                if blocks_since_update < source.update_interval {
                    continue;
                }

                // Fetch game data (simplified - in production, would fetch for specific NFTs)
                let _ = Self::fetch_game_data(&source, block_number);
            }
        }
    }

    #[pallet::call]
    impl<T: Config> Pallet<T> {
        /// Register a game data source
        #[pallet::call_index(0)]
        #[pallet::weight(Weight::from_parts(50_000, 0))]
        pub fn register_game_source(
            origin: OriginFor<T>,
            game_id: Vec<u8>,
            api_url: Vec<u8>,
            api_key: Option<Vec<u8>>,
            update_interval: BlockNumberFor<T>,
        ) -> DispatchResult {
            ensure_root(origin)?;
            
            let game_id_bounded: BoundedVec<u8, ConstU32<MAX_GAME_ID_LENGTH>> = game_id
                .clone()
                .try_into()
                .map_err(|_| Error::<T>::InvalidApiUrl)?;
            let api_url_bounded: BoundedVec<u8, ConstU32<MAX_URL_LENGTH>> = api_url
                .clone()
                .try_into()
                .map_err(|_| Error::<T>::InvalidApiUrl)?;
            
            // Check source limit
            let current_count = GameDataSources::<T>::iter().count() as u32;
            ensure!(
                current_count < T::MaxGameSources::get(),
                Error::<T>::TooManyGameSources
            );
            
            let api_key_bounded = api_key.and_then(|key| {
                key.try_into().ok().map(|k: BoundedVec<u8, ConstU32<64>>| k)
            });
            
            let source = GameDataSource {
                game_id: game_id_bounded.clone(),
                api_url: api_url_bounded.clone(),
                api_key: api_key_bounded,
                update_interval,
                last_updated: frame_system::Pallet::<T>::block_number(),
            };
            
            GameDataSources::<T>::insert(&game_id_bounded, &source);
            
            Self::deposit_event(Event::GameDataSourceRegistered {
                game_id: game_id_bounded.to_vec(),
                api_url: api_url_bounded.to_vec(),
            });
            
            Ok(())
        }

        /// Apply pending game data update to DRC-369 NFT
        #[pallet::call_index(1)]
        #[pallet::weight(40_000)]
        pub fn apply_game_data_update(
            origin: OriginFor<T>,
            nft_uuid: [u8; 32],
        ) -> DispatchResult {
            let _who = ensure_signed(origin)?;
            
            // Get pending update
            let _update = PendingUpdates::<T>::get(&nft_uuid)
                .ok_or(Error::<T>::GameDataSourceNotFound)?;
            
            // TODO: Verify who has permission to apply this update
            // In production, would check NFT ownership or game server signature
            
            // Apply update to DRC-369 pallet
            // This would call into pallet-drc369 to update XP, kill count, etc.
            // For now, we just emit an event
            
            PendingUpdates::<T>::remove(&nft_uuid);
            
            Self::deposit_event(Event::GameDataUpdateApplied {
                nft_uuid,
            });
            
            Ok(())
        }
    }

    impl<T: Config> Pallet<T> {
        /// Fetch game data from external API (off-chain worker)
        fn fetch_game_data(
            source: &GameDataSource<T>,
            block_number: BlockNumberFor<T>,
        ) -> Result<(), Error<T>> {
            // Parse API URL
            let url_str = sp_std::str::from_utf8(&source.api_url)
                .map_err(|_| Error::<T>::InvalidApiUrl)?;
            
            // Create HTTP request with deadline (2 second timeout)
            // Note: In production, would use proper timestamp handling
            // For now, use a simple approach: set deadline to 2 seconds from epoch start
            let deadline = sp_runtime::offchain::Timestamp::from_unix_millis(2000);
            
            let request = http::Request::get(url_str);
            let pending_request = request
                .deadline(deadline)
                .send()
                .map_err(|_| Error::<T>::FetchFailed)?;
            
            // Wait for response (with timeout)
            let response = pending_request
                .try_wait(deadline)
                .map_err(|_| Error::<T>::FetchFailed)?
                .map_err(|_| Error::<T>::FetchFailed)?;
            
            // Check response status
            if response.code != 200 {
                return Err(Error::<T>::FetchFailed);
            }
            
            // Parse JSON response (simplified - in production would parse actual game data)
            let body = response.body().collect::<Vec<u8>>();
            
            // In production, would parse JSON and extract:
            // - Player scores
            // - Battle results
            // - Achievement data
            // Then create GameDataResult and store in PendingUpdates
            
            // For now, just mark as successful
            // log::info!("Fetched game data from {:?}", url_str);
            
            // Update last_updated
            GameDataSources::<T>::mutate(&source.game_id, |maybe_source| {
                if let Some(ref mut s) = maybe_source {
                    s.last_updated = block_number;
                }
            });
            
            Ok(())
        }
    }
}
