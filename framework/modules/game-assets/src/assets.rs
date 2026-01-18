//! Game assets implementation

use crate::{GameAssetsError, Result};
use demiurge_modules::traits::Module;
use demiurge_storage::Storage;
use codec::{Decode, Encode};
use scale_info::TypeInfo;

/// Game Assets module
pub struct GameAssetsModule;

impl Module for GameAssetsModule {
    fn name() -> &'static str {
        "GameAssets"
    }

    fn version() -> u32 {
        1
    }

    fn execute(
        &self,
        call: Vec<u8>,
        storage: &mut dyn Storage,
    ) -> std::result::Result<(), demiurge_modules::traits::ModuleError> {
        let call_data: AssetCall = Decode::decode(&mut &call[..])
            .map_err(|e| demiurge_modules::traits::ModuleError::InvalidCall(e.to_string()))?;

        match call_data {
            AssetCall::CreateAsset { game_id, asset_type } => {
                // TODO: Create asset type
                Ok(())
            }
            AssetCall::Mint { game_id, asset_type, to, amount } => {
                // TODO: Mint assets
                Ok(())
            }
            AssetCall::Transfer { game_id, asset_type, from, to, amount } => {
                // TODO: Transfer assets (feeless)
                Ok(())
            }
            AssetCall::Burn { game_id, asset_type, from, amount } => {
                // TODO: Burn assets
                Ok(())
            }
        }
    }
}

/// Asset module calls
#[derive(Clone, Debug, Encode, Decode, TypeInfo)]
pub enum AssetCall {
    /// Create a new asset type
    CreateAsset {
        game_id: u32,
        asset_type: u32,
    },
    /// Mint assets
    Mint {
        game_id: u32,
        asset_type: u32,
        to: [u8; 32],
        amount: u128,
    },
    /// Transfer assets (feeless)
    Transfer {
        game_id: u32,
        asset_type: u32,
        from: [u8; 32],
        to: [u8; 32],
        amount: u128,
    },
    /// Burn assets
    Burn {
        game_id: u32,
        asset_type: u32,
        from: [u8; 32],
        amount: u128,
    },
}
