//! RPC methods implementation

use crate::RpcError;
use demiurge_core::{Block, Transaction};
use demiurge_storage::Storage;
use std::sync::Arc;
use std::result::Result;

/// RPC methods handler
pub struct RpcMethods<S: Storage> {
    storage: Arc<S>,
    // Add runtime reference when ready
}

impl<S: Storage> RpcMethods<S> {
    /// Create new RPC methods
    pub fn new(storage: Arc<S>) -> Self {
        Self { storage }
    }

    /// Get block by number
    pub async fn get_block_by_number(&self, number: u64) -> Result<Option<Block>, RpcError> {
        // TODO: Get block from storage
        Ok(None)
    }

    /// Get block by hash
    pub async fn get_block_by_hash(&self, hash: [u8; 32]) -> Result<Option<Block>, RpcError> {
        // TODO: Get block from storage
        Ok(None)
    }

    /// Get latest block
    pub async fn get_latest_block(&self) -> Result<Block, RpcError> {
        // TODO: Get latest block
        Err(RpcError::NotImplemented)
    }

    /// Submit transaction
    pub async fn submit_transaction(&self, tx: Transaction) -> Result<[u8; 32], RpcError> {
        // TODO: Submit to transaction pool
        Err(RpcError::NotImplemented)
    }

    /// Get account balance
    pub async fn get_balance(&self, account: [u8; 32]) -> Result<u128, RpcError> {
        // TODO: Get balance from storage
        Err(RpcError::NotImplemented)
    }

    /// Get transaction by hash
    pub async fn get_transaction(&self, hash: [u8; 32]) -> Result<Option<Transaction>, RpcError> {
        // TODO: Get transaction from storage
        Ok(None)
    }

    /// Get chain info
    pub async fn get_chain_info(&self) -> Result<ChainInfo, RpcError> {
        Ok(ChainInfo {
            chain_name: "Demiurge".to_string(),
            chain_version: "0.1.0".to_string(),
            block_number: 0,
            block_hash: [0u8; 32],
        })
    }
}

/// Chain information
#[derive(Clone, Debug, serde::Serialize, serde::Deserialize)]
pub struct ChainInfo {
    pub chain_name: String,
    pub chain_version: String,
    pub block_number: u64,
    pub block_hash: [u8; 32],
}
