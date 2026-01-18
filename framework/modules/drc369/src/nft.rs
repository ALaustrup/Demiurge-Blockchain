//! DRC-369 NFT implementation

use crate::{Drc369Error, Result};
use demiurge_modules::traits::Module;
use demiurge_storage::Storage;
use codec::{Decode, Encode};
use scale_info::TypeInfo;

/// DRC-369 module
pub struct Drc369Module;

impl Module for Drc369Module {
    fn name(&self) -> &'static str {
        "DRC369"
    }

    fn version(&self) -> u32 {
        1
    }

    fn execute(
        &self,
        call: Vec<u8>,
        storage: &mut dyn Storage,
    ) -> std::result::Result<(), demiurge_modules::traits::ModuleError> {
        let call_data: NftCall = Decode::decode(&mut &call[..])
            .map_err(|e| demiurge_modules::traits::ModuleError::InvalidCall(e.to_string()))?;

        match call_data {
            NftCall::Mint { owner, metadata } => {
                // TODO: Implement mint logic
                Ok(())
            }
            NftCall::Transfer { from, to, nft_id } => {
                // TODO: Implement transfer logic
                Ok(())
            }
            NftCall::UpdateState { nft_id, state } => {
                // TODO: Implement state update
                Ok(())
            }
            NftCall::SetSoulbound { nft_id, soulbound } => {
                // TODO: Implement soulbound setting
                Ok(())
            }
            NftCall::AddResource { nft_id, resource } => {
                // TODO: Implement resource addition
                Ok(())
            }
        }
    }
}

/// NFT module calls
#[derive(Clone, Debug, Encode, Decode, TypeInfo)]
pub enum NftCall {
    /// Mint a new NFT
    Mint {
        owner: [u8; 32],
        metadata: Vec<u8>,
    },
    /// Transfer NFT
    Transfer {
        from: [u8; 32],
        to: [u8; 32],
        nft_id: [u8; 32],
    },
    /// Update NFT state (XP, level, stats)
    UpdateState {
        nft_id: [u8; 32],
        state: NftState,
    },
    /// Set soulbound status
    SetSoulbound {
        nft_id: [u8; 32],
        soulbound: bool,
    },
    /// Add resource (multi-resource support)
    AddResource {
        nft_id: [u8; 32],
        resource: Resource,
    },
}

/// NFT state (XP, level, stats)
#[derive(Clone, Debug, Encode, Decode, TypeInfo)]
pub struct NftState {
    pub xp: u64,
    pub level: u32,
    pub stats: Vec<u8>, // Custom stats data
}

/// Resource definition
#[derive(Clone, Debug, Encode, Decode, TypeInfo)]
pub struct Resource {
    pub resource_type: Vec<u8>, // e.g., "sprite", "glb", "audio"
    pub uri: Vec<u8>,
    pub metadata: Vec<u8>,
}
