//! RPC methods implementation

use crate::RpcError;
use demiurge_core::{Block, Transaction};
use demiurge_storage::Storage;
use codec::Decode;
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
        // Read directly from storage using the same key format as balances module
        let key = Self::balance_key(account);
        
        match self.storage.get(&key) {
            Some(value) => {
                <u128 as Decode>::decode(&mut &value[..])
                    .map_err(|e| RpcError::StorageError(format!("Failed to decode balance: {}", e)))
            }
            None => Ok(0), // Account doesn't exist, balance is 0
        }
    }

    /// Generate storage key for account balance (matches balances module)
    fn balance_key(account: [u8; 32]) -> Vec<u8> {
        let mut key = b"Balances:Account:".to_vec();
        key.extend_from_slice(&account);
        key
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
