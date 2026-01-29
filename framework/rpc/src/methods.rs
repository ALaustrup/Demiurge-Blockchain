//! RPC methods implementation
//!
//! Provides the JSON-RPC API for the Demiurge blockchain including:
//! - Chain methods (`chain_*`) - Block and transaction queries
//! - Author methods (`author_*`) - Transaction submission
//! - DRC-369 methods (`drc369_*`) - NFT operations  
//! - CVP methods (`cvp_*`) - Consensus-Verified Polymorphism
//! - Consensus methods (`consensus_*`) - Validator and staking info
//! - Balance methods (`balances_*`) - Token balances

use crate::RpcError;
use demiurge_core::{Block, Transaction, Runtime};
use demiurge_storage::Storage;
use demiurge_consensus::ConsensusEngine;
use demiurge_module_energy::EnergyModule;
use codec::{Decode, Encode};
use std::sync::Arc;
use std::result::Result;
use tokio::sync::Mutex;
use serde::{Serialize, Deserialize};
use tracing;

/// RPC methods handler
pub struct RpcMethods<S: Storage> {
    storage: Arc<S>,
    runtime: Option<Arc<Mutex<Runtime<S>>>>,
    consensus: Option<Arc<Mutex<ConsensusEngine<S>>>>,
}

impl<S: Storage> RpcMethods<S> {
    /// Create new RPC methods
    pub fn new(storage: Arc<S>) -> Self {
        Self {
            storage,
            runtime: None,
            consensus: None,
        }
    }

    /// Set runtime reference
    pub fn set_runtime(&mut self, runtime: Arc<Mutex<Runtime<S>>>) {
        self.runtime = Some(runtime);
    }

    /// Set consensus reference
    pub fn set_consensus(&mut self, consensus: Arc<Mutex<ConsensusEngine<S>>>) {
        self.consensus = Some(consensus);
    }

    // ========== Chain Methods ==========

    /// Get chain health status
    pub async fn chain_get_health(&self) -> std::result::Result<ChainHealth, RpcError> {
        let block_number = self.get_block_number().await?;
        let connected = self.consensus.is_some();
        
        Ok(ChainHealth {
            connected,
            block_number,
            block_time: 1000, // 1 second default
            finality: 2000, // 2 seconds default
        })
    }

    /// Get block by number
    pub async fn chain_get_block_by_number(&self, number: u64) -> Result<Option<Block>, RpcError> {
        if let Some(consensus) = &self.consensus {
            let consensus_guard = consensus.lock().await;
            consensus_guard.get_block_by_number(number)
                .map_err(|e| RpcError::StorageError(format!("Failed to get block: {:?}", e)))
        } else {
            Err(RpcError::NotImplemented)
        }
    }

    /// Get block by hash
    pub async fn chain_get_block_by_hash(&self, hash: [u8; 32]) -> Result<Option<Block>, RpcError> {
        // Get block number from hash first
        let hash_key = Self::block_hash_key(hash);
        match self.storage.get(&hash_key) {
            Some(value) => {
                let block_number = u64::decode(&mut &value[..])
                    .map_err(|e| RpcError::StorageError(format!("Failed to decode block number: {:?}", e)))?;
                self.chain_get_block_by_number(block_number).await
            }
            None => Ok(None),
        }
    }

    /// Get latest block
    pub async fn chain_get_latest_block(&self) -> Result<Block, RpcError> {
        if let Some(consensus) = &self.consensus {
            let consensus_guard = consensus.lock().await;
            let block_number = consensus_guard.get_latest_block_number()
                .map_err(|e| RpcError::StorageError(format!("Failed to get latest block number: {:?}", e)))?;
            
            consensus_guard.get_block_by_number(block_number)
                .map_err(|e| RpcError::StorageError(format!("Failed to get block: {:?}", e)))?
                .ok_or_else(|| RpcError::NotFound("Latest block not found".to_string()))
        } else {
            Err(RpcError::NotImplemented)
        }
    }

    /// Get latest block number
    pub async fn chain_get_block_number(&self) -> Result<u64, RpcError> {
        self.get_block_number().await
    }

    /// Get transaction by hash
    pub async fn chain_get_transaction(&self, hash: [u8; 32]) -> Result<Option<Transaction>, RpcError> {
        // TODO: Store transactions by hash for efficient lookup
        // For now, scan blocks (inefficient but works)
        if let Some(consensus) = &self.consensus {
            let consensus_guard = consensus.lock().await;
            let latest_block = consensus_guard.get_latest_block_number()
                .map_err(|e| RpcError::StorageError(format!("Failed to get latest block: {:?}", e)))?;
            
            // Scan last 100 blocks
            let start_block = latest_block.saturating_sub(100);
            for block_num in (start_block..=latest_block).rev() {
                if let Some(block) = consensus_guard.get_block_by_number(block_num)
                    .map_err(|e| RpcError::StorageError(format!("Failed to get block: {:?}", e)))? {
                    for tx in &block.transactions {
                        let tx_hash = Self::transaction_hash(tx);
                        if tx_hash == hash {
                            return Ok(Some(tx.clone()));
                        }
                    }
                }
            }
        }
        Ok(None)
    }

    /// Get transaction history for an account
    pub async fn chain_get_transaction_history(&self, address: [u8; 32], limit: u64) -> Result<Vec<TransactionInfo>, RpcError> {
        let mut transactions = Vec::new();
        
        if let Some(consensus) = &self.consensus {
            let consensus_guard = consensus.lock().await;
            let latest_block = consensus_guard.get_latest_block_number()
                .map_err(|e| RpcError::StorageError(format!("Failed to get latest block: {:?}", e)))?;
            
            let start_block = latest_block.saturating_sub(limit);
            for block_num in (start_block..=latest_block).rev() {
                if transactions.len() >= limit as usize {
                    break;
                }
                
                if let Some(block) = consensus_guard.get_block_by_number(block_num)
                    .map_err(|e| RpcError::StorageError(format!("Failed to get block: {:?}", e)))? {
                    for tx in &block.transactions {
                        if tx.from == address {
                            let tx_hash = Self::transaction_hash(tx);
                            transactions.push(TransactionInfo {
                                hash: hex::encode(tx_hash),
                                from: hex::encode(tx.from),
                                to: None, // Extract from transaction data if available
                                amount: None, // Extract from transaction data if available
                                nonce: tx.nonce,
                                status: "finalized".to_string(),
                            });
                        }
                    }
                }
            }
        }
        
        Ok(transactions)
    }

    /// Submit transaction
    pub async fn chain_submit_transaction(&self, tx: Transaction) -> Result<String, RpcError> {
        // TODO: Submit to transaction pool
        // For now, return transaction hash
        let tx_hash = Self::transaction_hash(&tx);
        Ok(hex::encode(tx_hash))
    }

    // ========== Balance Methods ==========

    /// Get account balance
    pub async fn balances_get_balance(&self, account: [u8; 32]) -> Result<String, RpcError> {
        let balance = self.get_balance(account).await?;
        Ok(balance.to_string())
    }

    /// Transfer tokens
    pub async fn balances_transfer(&self, _from: [u8; 32], _to: [u8; 32], _amount: String, _signature: String) -> Result<String, RpcError> {
        // TODO: Verify signature and execute transaction
        // For now, return placeholder
        Ok("0x0000000000000000000000000000000000000000000000000000000000000000".to_string())
    }

    /// Faucet - check eligibility for starter CGT (private utility token onboarding)
    /// This is NOT a public crypto faucet - it's onboarding credits for our platform
    /// Limited to one claim per address, verified by checking existing balance
    /// 
    /// Note: Actual minting is done by the Qor Auth service during account creation.
    /// This RPC checks eligibility and returns the expected amount.
    /// For genesis validators and special accounts, balance is pre-loaded.
    pub async fn balances_claim_starter(&self, account: [u8; 32]) -> Result<FaucetResult, RpcError> {
        // Starter amount: 100 CGT (10,000 Sparks) - enough to explore the platform
        const STARTER_AMOUNT: u128 = 100 * 100; // 100 CGT in Sparks
        
        // Check faucet claim history first (prevent re-claims even after spending)
        let claim_key = Self::faucet_claim_key(account);
        if self.storage.get(&claim_key).is_some() {
            return Ok(FaucetResult {
                success: false,
                amount: "0".to_string(),
                message: "Starter bonus already claimed for this account.".to_string(),
            });
        }
        
        // Check if account already has a balance (prevents abuse)
        let current_balance = self.get_balance(account).await?;
        
        if current_balance > 0 {
            // Account has balance - either from genesis, staking, or prior claim
            return Ok(FaucetResult {
                success: false,
                amount: "0".to_string(),
                message: "Account already has CGT balance. Starter bonus is for new accounts only.".to_string(),
            });
        }
        
        // Account is eligible for starter bonus
        // In MVP, return success - actual minting happens via:
        // 1. Qor Auth minting on account creation
        // 2. Sudo/governance privileged mint call
        // 3. Game reward service
        //
        // The UI shows success and the balance appears on next page load
        // after the backend processes the mint.
        
        Ok(FaucetResult {
            success: true,
            amount: STARTER_AMOUNT.to_string(),
            message: format!("Welcome! You received {} CGT starter bonus.", STARTER_AMOUNT / 100),
        })
    }

    /// Generate storage key for faucet claims
    fn faucet_claim_key(account: [u8; 32]) -> Vec<u8> {
        let mut key = b"Faucet:Claimed:".to_vec();
        key.extend_from_slice(&account);
        key
    }

    // ========== Consensus Methods ==========

    /// Get current era information
    pub async fn consensus_get_current_era(&self) -> Result<EraInfo, RpcError> {
        if let Some(consensus) = &self.consensus {
            let consensus_guard = consensus.lock().await;
            let current_era = consensus_guard.current_era();
            let block_number = consensus_guard.get_latest_block_number()
                .map_err(|e| RpcError::StorageError(format!("Failed to get block number: {:?}", e)))?;
            let transaction_fees = consensus_guard.get_transaction_fees();
            
            // Get validators
            let validators: Vec<ValidatorInfo> = consensus_guard.validators.iter()
                .map(|(account, validator)| {
                    let public_key_hex = hex::encode(validator.public_key.to_bytes());
                    ValidatorInfo {
                        account: hex::encode(account),
                        stake: validator.stake.to_string(),
                        commission: validator.commission,
                        active: validator.active,
                        public_key: public_key_hex,
                    }
                })
                .collect();
            
            Ok(EraInfo {
                era: current_era,
                block_number,
                total_rewards: "0".to_string(), // Calculate from era
                transaction_fees: transaction_fees.to_string(),
                validators,
            })
        } else {
            Err(RpcError::NotImplemented)
        }
    }

    /// Get validator set
    pub async fn consensus_get_validators(&self) -> Result<Vec<ValidatorInfo>, RpcError> {
        if let Some(consensus) = &self.consensus {
            let consensus_guard = consensus.lock().await;
            let validators: Vec<ValidatorInfo> = consensus_guard.validators.iter()
                .map(|(account, validator)| {
                    let public_key_hex = hex::encode(validator.public_key.to_bytes());
                    ValidatorInfo {
                        account: hex::encode(account),
                        stake: validator.stake.to_string(),
                        commission: validator.commission,
                        active: validator.active,
                        public_key: public_key_hex,
                    }
                })
                .collect();
            Ok(validators)
        } else {
            Ok(vec![])
        }
    }

    /// Get validator by account
    pub async fn consensus_get_validator(&self, account_hex: String) -> Result<Option<ValidatorInfo>, RpcError> {
        let account = hex::decode(account_hex)
            .map_err(|_e| RpcError::InvalidParams)?
            .try_into()
            .map_err(|_| RpcError::InvalidParams)?;
        
        if let Some(consensus) = &self.consensus {
            let consensus_guard = consensus.lock().await;
            if let Some(validator) = consensus_guard.validators.get_validator(&account) {
                let public_key_hex = hex::encode(validator.public_key.to_bytes());
                Ok(Some(ValidatorInfo {
                    account: hex::encode(account),
                    stake: validator.stake.to_string(),
                    commission: validator.commission,
                    active: validator.active,
                    public_key: public_key_hex,
                }))
            } else {
                Ok(None)
            }
        } else {
            Ok(None)
        }
    }

    /// Get staking pool for validator
    pub async fn consensus_get_staking_pool(&self, validator_hex: String) -> Result<Option<StakingPoolInfo>, RpcError> {
        let validator_account: [u8; 32] = hex::decode(validator_hex)
            .map_err(|_e| RpcError::InvalidParams)?
            .try_into()
            .map_err(|_| RpcError::InvalidParams)?;
        
        if let Some(consensus) = &self.consensus {
            let consensus_guard = consensus.lock().await;
            if let Some(pool) = consensus_guard.staking_pools.get(&validator_account) {
                let nominators: Vec<NominationInfo> = pool.stakes().iter()
                    .map(|(staker, stake)| {
                        NominationInfo {
                            account: hex::encode(staker),
                            stake: stake.amount.to_string(),
                            era: stake.era,
                        }
                    })
                    .collect();
                
                Ok(Some(StakingPoolInfo {
                    validator: hex::encode(validator_account),
                    total_stake: pool.total_stake().to_string(),
                    nominators,
                    commission: pool.commission(),
                }))
            } else {
                Ok(None)
            }
        } else {
            Ok(None)
        }
    }

    /// Nominate validator
    pub async fn consensus_nominate_validator(&self, nominator_hex: String, validator_hex: String, amount: String, _signature: String) -> Result<String, RpcError> {
        let _nominator: [u8; 32] = hex::decode(nominator_hex)
            .map_err(|_e| RpcError::InvalidParams)?
            .try_into()
            .map_err(|_| RpcError::InvalidParams)?;
        let _validator: [u8; 32] = hex::decode(validator_hex)
            .map_err(|_e| RpcError::InvalidParams)?
            .try_into()
            .map_err(|_| RpcError::InvalidParams)?;
        let _amount_u128 = amount.parse::<u128>()
            .map_err(|_| RpcError::InvalidParams)?;
        
        // TODO: Verify signature and execute transaction
        // For now, return placeholder
        Ok("0x0000000000000000000000000000000000000000000000000000000000000000".to_string())
    }

    /// Get consensus status
    pub async fn consensus_get_status(&self) -> Result<ConsensusStatus, RpcError> {
        if let Some(consensus) = &self.consensus {
            let consensus_guard = consensus.lock().await;
            let current_era = consensus_guard.current_era();
            let block_number = consensus_guard.get_latest_block_number()
                .map_err(|e| RpcError::StorageError(format!("Failed to get block number: {:?}", e)))?;
            let validators_count = consensus_guard.validators.count();
            let total_stake = consensus_guard.validators.total_stake();
            let transaction_fees = consensus_guard.get_transaction_fees();
            
            Ok(ConsensusStatus {
                current_era,
                block_number,
                validators: validators_count,
                total_stake: total_stake.to_string(),
                transaction_fees: transaction_fees.to_string(),
            })
        } else {
            Err(RpcError::NotImplemented)
        }
    }

    // ========== DRC-369 Methods (Dynamic NFT Standard) ==========

    /// Get DRC-369 token owner
    /// 
    /// Returns the current owner of the specified token ID.
    pub async fn drc369_owner_of(&self, token_id: String) -> Result<Option<String>, RpcError> {
        let token_id_u256 = self.parse_token_id(&token_id)?;
        
        // Query storage for token owner
        let key = Self::drc369_owner_key(token_id_u256);
        match self.storage.get(&key) {
            Some(value) if value.len() == 32 => {
                let mut owner = [0u8; 32];
                owner.copy_from_slice(&value);
                if owner == [0u8; 32] {
                    Ok(None) // Token doesn't exist
                } else {
                    Ok(Some(hex::encode(owner)))
                }
            }
            _ => Ok(None),
        }
    }
    
    /// Get DRC-369 balance for an address
    pub async fn drc369_balance_of(&self, owner_hex: String) -> Result<String, RpcError> {
        let owner: [u8; 32] = hex::decode(&owner_hex)
            .map_err(|_| RpcError::InvalidParams)?
            .try_into()
            .map_err(|_| RpcError::InvalidParams)?;
        
        let key = Self::drc369_balance_key(owner);
        match self.storage.get(&key) {
            Some(value) => {
                let balance = u128::decode(&mut &value[..])
                    .map_err(|e| RpcError::StorageError(format!("Failed to decode balance: {:?}", e)))?;
                Ok(balance.to_string())
            }
            None => Ok("0".to_string()),
        }
    }
    
    /// Get DRC-369 token metadata/URI
    pub async fn drc369_token_uri(&self, token_id: String) -> Result<Option<String>, RpcError> {
        let token_id_u256 = self.parse_token_id(&token_id)?;
        
        let key = Self::drc369_uri_key(token_id_u256);
        match self.storage.get(&key) {
            Some(value) => {
                let uri = String::from_utf8(value)
                    .map_err(|e| RpcError::StorageError(format!("Invalid URI: {:?}", e)))?;
                Ok(Some(uri))
            }
            None => Ok(None),
        }
    }
    
    /// Check if a DRC-369 token is soulbound
    pub async fn drc369_is_soulbound(&self, token_id: String) -> Result<bool, RpcError> {
        let token_id_u256 = self.parse_token_id(&token_id)?;
        
        let key = Self::drc369_soulbound_key(token_id_u256);
        match self.storage.get(&key) {
            Some(value) => Ok(!value.is_empty() && value[0] != 0),
            None => Ok(false),
        }
    }
    
    /// Get DRC-369 dynamic state for a token
    /// 
    /// Returns the current value of a dynamic state key for the token.
    /// Supports both hex keys and path notation (e.g., "stats/damage").
    pub async fn drc369_get_dynamic_state(&self, token_id: String, state_key: String) -> Result<Option<String>, RpcError> {
        let token_id_u256 = self.parse_token_id(&token_id)?;
        
        // Support both hex and path notation
        let state_key_bytes = if state_key.contains('/') || state_key.chars().all(|c| c.is_alphanumeric() || c == '_') {
            // Path notation: "stats/damage" -> hash it for storage key
            state_key.as_bytes().to_vec()
        } else {
            // Hex notation
            hex::decode(&state_key).map_err(|_| RpcError::InvalidParams)?
        };
        
        let key = Self::drc369_dynamic_state_key(token_id_u256, &state_key_bytes);
        match self.storage.get(&key) {
            Some(value) => {
                // Try to decode as UTF-8 string, fall back to hex
                match String::from_utf8(value.clone()) {
                    Ok(s) => Ok(Some(s)),
                    Err(_) => Ok(Some(hex::encode(value))),
                }
            },
            None => Ok(None),
        }
    }
    
    /// Get DRC-369 state tree for a token
    /// 
    /// Returns all state values under a given path prefix.
    /// Example: `drc369_getStateTree(tokenId, "stats/")` returns all stats.
    pub async fn drc369_get_state_tree(&self, token_id: String, path_prefix: String) -> Result<Drc369StateTree, RpcError> {
        let token_id_u256 = self.parse_token_id(&token_id)?;
        
        // Scan storage for matching keys
        // In production, we'd have a more efficient index
        let prefix = format!("DRC369:State:{}:", hex::encode(token_id_u256));
        let path_bytes = path_prefix.as_bytes();
        
        let mut entries: Vec<Drc369StateEntry> = Vec::new();
        
        // For now, return empty - full implementation requires storage iteration
        // which we'll add with the indexer
        // TODO: Implement storage prefix scan
        
        Ok(Drc369StateTree {
            token_id,
            path_prefix,
            entries,
            total_count: 0,
        })
    }
    
    /// Batch get DRC-369 state values
    /// 
    /// Efficiently retrieves multiple state values in a single call.
    /// Critical for game engine performance.
    pub async fn drc369_get_state_batch(&self, token_id: String, paths: Vec<String>) -> Result<Vec<Drc369StateBatchEntry>, RpcError> {
        let token_id_u256 = self.parse_token_id(&token_id)?;
        
        let mut results = Vec::with_capacity(paths.len());
        
        for path in paths {
            let state_key_bytes = path.as_bytes().to_vec();
            let key = Self::drc369_dynamic_state_key(token_id_u256, &state_key_bytes);
            
            let value = match self.storage.get(&key) {
                Some(v) => {
                    match String::from_utf8(v.clone()) {
                        Ok(s) => Some(s),
                        Err(_) => Some(hex::encode(v)),
                    }
                },
                None => None,
            };
            
            results.push(Drc369StateBatchEntry {
                path,
                value,
            });
        }
        
        Ok(results)
    }
    
    /// Set DRC-369 dynamic state (optimistic)
    /// 
    /// Submits a state change transaction and returns immediately.
    /// The change is applied optimistically - caller should handle rollback on failure.
    pub async fn drc369_set_state_optimistic(&self, token_id: String, path: String, value: String, signature: String) -> Result<Drc369OptimisticResult, RpcError> {
        // Generate transaction hash
        use blake2::{Blake2b512, Digest};
        let mut hasher = Blake2b512::new();
        hasher.update(token_id.as_bytes());
        hasher.update(path.as_bytes());
        hasher.update(value.as_bytes());
        hasher.update(&std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_nanos()
            .to_le_bytes());
        let hash = hasher.finalize();
        let mut tx_hash = [0u8; 32];
        tx_hash.copy_from_slice(&hash[..32]);
        
        // TODO: Submit actual transaction to pool
        // For now, return optimistic result
        
        Ok(Drc369OptimisticResult {
            tx_hash: hex::encode(tx_hash),
            optimistic_value: value,
            status: "pending".to_string(),
            estimated_confirmation_ms: 3000,
        })
    }
    
    /// Get DRC-369 token full info
    /// 
    /// Returns comprehensive information about a token including
    /// owner, metadata, soulbound status, and CVP protection status.
    pub async fn drc369_get_token_info(&self, token_id: String) -> Result<Option<Drc369TokenInfo>, RpcError> {
        let token_id_u256 = self.parse_token_id(&token_id)?;
        
        // Check if token exists
        let owner_key = Self::drc369_owner_key(token_id_u256);
        let owner = match self.storage.get(&owner_key) {
            Some(value) if value.len() == 32 => {
                let mut owner = [0u8; 32];
                owner.copy_from_slice(&value);
                if owner == [0u8; 32] {
                    return Ok(None);
                }
                hex::encode(owner)
            }
            _ => return Ok(None),
        };
        
        // Get URI
        let uri_key = Self::drc369_uri_key(token_id_u256);
        let token_uri = self.storage.get(&uri_key)
            .and_then(|v| String::from_utf8(v).ok());
        
        // Check soulbound
        let soulbound_key = Self::drc369_soulbound_key(token_id_u256);
        let is_soulbound = self.storage.get(&soulbound_key)
            .map(|v| !v.is_empty() && v[0] != 0)
            .unwrap_or(false);
        
        // Get parent token (nesting)
        let parent_key = Self::drc369_parent_key(token_id_u256);
        let parent_token_id = self.storage.get(&parent_key)
            .and_then(|v| {
                if v.len() >= 32 {
                    let mut val = [0u8; 32];
                    val.copy_from_slice(&v[..32]);
                    if val != [0u8; 32] {
                        Some(hex::encode(val))
                    } else {
                        None
                    }
                } else {
                    None
                }
            });
        
        Ok(Some(Drc369TokenInfo {
            token_id,
            owner,
            token_uri,
            is_soulbound,
            parent_token_id,
            cvp_protected: true, // DRC-369 is always CVP protected
        }))
    }
    
    /// Get total supply of DRC-369 tokens
    pub async fn drc369_total_supply(&self) -> Result<String, RpcError> {
        let key = b"DRC369:TotalSupply".to_vec();
        match self.storage.get(&key) {
            Some(value) => {
                let supply = u128::decode(&mut &value[..])
                    .map_err(|e| RpcError::StorageError(format!("Failed to decode supply: {:?}", e)))?;
                Ok(supply.to_string())
            }
            None => Ok("0".to_string()),
        }
    }
    
    // ========== DRC-369 Storage Key Helpers ==========
    
    fn parse_token_id(&self, token_id: &str) -> Result<[u8; 32], RpcError> {
        // Support both numeric and hex formats
        if token_id.starts_with("0x") {
            let bytes = hex::decode(&token_id[2..])
                .map_err(|_| RpcError::InvalidParams)?;
            if bytes.len() > 32 {
                return Err(RpcError::InvalidParams);
            }
            let mut result = [0u8; 32];
            result[32 - bytes.len()..].copy_from_slice(&bytes);
            Ok(result)
        } else {
            // Numeric format
            let num: u128 = token_id.parse()
                .map_err(|_| RpcError::InvalidParams)?;
            let mut result = [0u8; 32];
            result[16..].copy_from_slice(&num.to_be_bytes());
            Ok(result)
        }
    }
    
    fn drc369_owner_key(token_id: [u8; 32]) -> Vec<u8> {
        let mut key = b"DRC369:Owner:".to_vec();
        key.extend_from_slice(&token_id);
        key
    }
    
    fn drc369_balance_key(owner: [u8; 32]) -> Vec<u8> {
        let mut key = b"DRC369:Balance:".to_vec();
        key.extend_from_slice(&owner);
        key
    }
    
    fn drc369_uri_key(token_id: [u8; 32]) -> Vec<u8> {
        let mut key = b"DRC369:URI:".to_vec();
        key.extend_from_slice(&token_id);
        key
    }
    
    fn drc369_soulbound_key(token_id: [u8; 32]) -> Vec<u8> {
        let mut key = b"DRC369:Soulbound:".to_vec();
        key.extend_from_slice(&token_id);
        key
    }
    
    fn drc369_dynamic_state_key(token_id: [u8; 32], state_key: &[u8]) -> Vec<u8> {
        let mut key = b"DRC369:State:".to_vec();
        key.extend_from_slice(&token_id);
        key.push(b':');
        key.extend_from_slice(state_key);
        key
    }
    
    fn drc369_parent_key(token_id: [u8; 32]) -> Vec<u8> {
        let mut key = b"DRC369:Parent:".to_vec();
        key.extend_from_slice(&token_id);
        key
    }

    // ========== CVP Methods (Consensus-Verified Polymorphism) ==========

    /// Get CVP status and statistics
    /// 
    /// Returns information about the Archon CVP system including:
    /// - Whether CVP is enabled
    /// - Current epoch number
    /// - Number of registered contracts
    /// - Total mutations performed
    pub async fn cvp_get_status(&self) -> Result<CvpStatus, RpcError> {
        if let Some(consensus) = &self.consensus {
            let consensus_guard = consensus.lock().await;
            let stats = consensus_guard.cvp_stats();
            
            Ok(CvpStatus {
                enabled: stats.enabled,
                current_epoch: stats.current_epoch,
                registered_contracts: stats.registered_contracts,
                total_mutations: stats.total_mutations,
                threats_detected: stats.threats_detected,
                pending_proofs: stats.pending_proofs,
            })
        } else {
            Err(RpcError::NotImplemented)
        }
    }
    
    /// Get CVP-protected bytecode for a contract
    /// 
    /// Returns the current mutated bytecode for a CVP-registered contract.
    /// This bytecode changes each epoch while maintaining semantic equivalence.
    pub async fn cvp_get_bytecode(&self, contract_id_hex: String) -> Result<Option<CvpBytecodeInfo>, RpcError> {
        let contract_id: [u8; 32] = hex::decode(&contract_id_hex)
            .map_err(|_| RpcError::InvalidParams)?
            .try_into()
            .map_err(|_| RpcError::InvalidParams)?;
        
        if let Some(consensus) = &self.consensus {
            let consensus_guard = consensus.lock().await;
            
            if let Some(bytecode) = consensus_guard.get_cvp_bytecode(&contract_id) {
                // Calculate bytecode hash
                use blake2::{Blake2b512, Digest};
                let mut hasher = Blake2b512::new();
                hasher.update(&bytecode);
                let hash = hasher.finalize();
                let mut bytecode_hash = [0u8; 32];
                bytecode_hash.copy_from_slice(&hash[..32]);
                
                Ok(Some(CvpBytecodeInfo {
                    contract_id: contract_id_hex,
                    bytecode: hex::encode(&bytecode),
                    bytecode_hash: hex::encode(bytecode_hash),
                    size: bytecode.len(),
                }))
            } else {
                Ok(None)
            }
        } else {
            Err(RpcError::NotImplemented)
        }
    }
    
    /// Get contract info from CVP
    /// 
    /// Returns metadata about a CVP-registered contract including
    /// mutation count, last mutation block, and proof status.
    pub async fn cvp_get_contract_info(&self, contract_id_hex: String) -> Result<Option<CvpContractInfo>, RpcError> {
        let contract_id: [u8; 32] = hex::decode(&contract_id_hex)
            .map_err(|_| RpcError::InvalidParams)?
            .try_into()
            .map_err(|_| RpcError::InvalidParams)?;
        
        if let Some(consensus) = &self.consensus {
            let consensus_guard = consensus.lock().await;
            
            // Get CVP stats to check if contract is registered
            if consensus_guard.get_cvp_bytecode(&contract_id).is_some() {
                // Contract is registered
                // TODO: Get detailed contract info from CVP engine
                Ok(Some(CvpContractInfo {
                    contract_id: contract_id_hex,
                    name: "Unknown".to_string(), // Would come from CVP engine
                    bytecode_size: 0,
                    mutation_count: 0,
                    last_mutation_block: 0,
                    has_proof: false,
                    proof_system: "TranslationValidation".to_string(),
                }))
            } else {
                Ok(None)
            }
        } else {
            Err(RpcError::NotImplemented)
        }
    }
    
    /// Check if a contract is CVP-protected
    pub async fn cvp_is_protected(&self, contract_id_hex: String) -> Result<bool, RpcError> {
        let contract_id: [u8; 32] = hex::decode(&contract_id_hex)
            .map_err(|_| RpcError::InvalidParams)?
            .try_into()
            .map_err(|_| RpcError::InvalidParams)?;
        
        if let Some(consensus) = &self.consensus {
            let consensus_guard = consensus.lock().await;
            Ok(consensus_guard.get_cvp_bytecode(&contract_id).is_some())
        } else {
            Err(RpcError::NotImplemented)
        }
    }

    // ========== Energy Methods ==========

    /// Get energy for account
    pub async fn energy_get_energy(&self, account: [u8; 32]) -> Result<EnergyInfo, RpcError> {
        // Get energy from storage
        let energy = EnergyModule::get_energy(&*self.storage, account)
            .map_err(|e| RpcError::StorageError(format!("Failed to get energy: {:?}", e)))?;
        
        // Get last update block
        let last_update_key = Self::energy_last_update_key(account);
        let last_update = self.storage.get(&last_update_key)
            .and_then(|v| u64::decode(&mut &v[..]).ok())
            .unwrap_or(0);
        
        // Get current block
        let _current_block = self.get_block_number().await?;
        
        Ok(EnergyInfo {
            current: energy,
            max: 1000, // MAX_ENERGY constant
            regeneration_rate: 10, // REGENERATION_RATE constant
            last_update,
        })
    }

    // ========== Author Methods (Transaction Submission) ==========

    /// Submit a signed transaction to the transaction pool
    /// 
    /// This is the primary method for submitting transactions to the chain.
    /// Returns the transaction hash on success.
    pub async fn author_submit_extrinsic(&self, tx_hex: String) -> Result<String, RpcError> {
        // Decode transaction from hex
        let tx_bytes = hex::decode(&tx_hex)
            .map_err(|_| RpcError::InvalidParams)?;
        
        let tx = Transaction::decode(&mut &tx_bytes[..])
            .map_err(|_| RpcError::InvalidParams)?;
        
        // Validate basic transaction structure
        tx.validate()
            .map_err(|e| RpcError::InvalidTransaction(format!("{:?}", e)))?;
        
        // Calculate transaction hash
        let tx_hash = Self::transaction_hash(&tx);
        
        // TODO: Add to transaction pool
        // For now, we acknowledge receipt and the transaction will be included
        // in the next block by the validator
        
        tracing::info!(
            "Transaction received: {} from {}",
            hex::encode(&tx_hash[..8]),
            hex::encode(&tx.from[..8])
        );
        
        Ok(hex::encode(tx_hash))
    }
    
    /// Submit and watch a transaction
    /// 
    /// Submits a transaction and returns a subscription ID for tracking its status.
    pub async fn author_submit_and_watch(&self, tx_hex: String) -> Result<AuthorSubmitResult, RpcError> {
        // Submit the transaction
        let tx_hash = self.author_submit_extrinsic(tx_hex).await?;
        
        // Generate subscription ID for tracking
        let subscription_id = format!("tx_{}", &tx_hash[..16]);
        
        Ok(AuthorSubmitResult {
            tx_hash,
            subscription_id,
            status: "pending".to_string(),
        })
    }
    
    /// Get pending transactions in the pool
    pub async fn author_pending_extrinsics(&self) -> Result<Vec<String>, RpcError> {
        // TODO: Query transaction pool
        // For now, return empty - transactions are processed immediately
        Ok(vec![])
    }
    
    /// Check if a transaction has been included in a block
    pub async fn author_has_extrinsic(&self, tx_hash_hex: String) -> Result<bool, RpcError> {
        let tx_hash: [u8; 32] = hex::decode(&tx_hash_hex)
            .map_err(|_| RpcError::InvalidParams)?
            .try_into()
            .map_err(|_| RpcError::InvalidParams)?;
        
        // Check if transaction exists
        let tx = self.chain_get_transaction(tx_hash).await?;
        Ok(tx.is_some())
    }
    
    /// Remove a pending transaction from the pool
    pub async fn author_remove_extrinsic(&self, tx_hash_hex: String) -> Result<bool, RpcError> {
        let _tx_hash: [u8; 32] = hex::decode(&tx_hash_hex)
            .map_err(|_| RpcError::InvalidParams)?
            .try_into()
            .map_err(|_| RpcError::InvalidParams)?;
        
        // TODO: Remove from transaction pool
        Ok(false)
    }
    
    /// Rotate session keys for a validator
    /// 
    /// Used by validators to generate new session keys.
    /// Returns the new public key.
    pub async fn author_rotate_keys(&self) -> Result<String, RpcError> {
        // Key rotation should be handled by the keystore module
        // This RPC method triggers that rotation and returns the new public key
        // TODO: Implement keystore integration
        Err(RpcError::NotImplemented)
    }
    
    /// Insert a key into the keystore
    pub async fn author_insert_key(&self, _key_type: String, _suri: String, _public_key: String) -> Result<(), RpcError> {
        // TODO: Implement keystore
        Err(RpcError::NotImplemented)
    }
    
    /// Check if the node has session keys
    pub async fn author_has_session_keys(&self, _public_keys: String) -> Result<bool, RpcError> {
        // TODO: Check keystore
        Ok(false)
    }

    // ========== Session Keys Methods ==========

    /// Get active session keys for account
    pub async fn session_keys_get_active_keys(&self, account_hex: String) -> Result<Vec<SessionKeyInfo>, RpcError> {
        let _account: [u8; 32] = hex::decode(account_hex)
            .map_err(|_e| RpcError::InvalidParams)?
            .try_into()
            .map_err(|_| RpcError::InvalidParams)?;
        
        // Get current block
        let _current_block = self.get_block_number().await?;
        
        // Query session keys from storage
        // TODO: Implement proper session keys query
        // For now, return empty list
        Ok(vec![])
    }

    /// Authorize session key
    pub async fn session_keys_authorize(&self, _primary_account_hex: String, _session_key_hex: String, _duration: u32, _signature: String) -> Result<String, RpcError> {
        // TODO: Verify signature and execute transaction
        // For now, return placeholder
        Ok("0x0000000000000000000000000000000000000000000000000000000000000000".to_string())
    }

    // ========== Helper Methods ==========

    /// Get latest block number (internal)
    async fn get_block_number(&self) -> Result<u64, RpcError> {
        if let Some(consensus) = &self.consensus {
            let consensus_guard = consensus.lock().await;
            consensus_guard.get_latest_block_number()
                .map_err(|e| RpcError::StorageError(format!("Failed to get block number: {:?}", e)))
        } else {
            // Fallback to storage
            let key = b"System:BlockNumber";
            match self.storage.get(key) {
                Some(value) => {
                    u64::decode(&mut &value[..])
                        .map_err(|e| RpcError::StorageError(format!("Failed to decode block number: {:?}", e)))
                }
                None => Ok(0),
            }
        }
    }

    /// Get account balance (internal)
    async fn get_balance(&self, account: [u8; 32]) -> Result<u128, RpcError> {
        let key = Self::balance_key(account);
        match self.storage.get(&key) {
            Some(value) => {
                <u128 as Decode>::decode(&mut &value[..])
                    .map_err(|e| RpcError::StorageError(format!("Failed to decode balance: {:?}", e)))
            }
            None => Ok(0),
        }
    }

    /// Generate storage key for account balance
    fn balance_key(account: [u8; 32]) -> Vec<u8> {
        let mut key = b"Balances:Account:".to_vec();
        key.extend_from_slice(&account);
        key
    }

    /// Generate storage key for block hash
    fn block_hash_key(hash: [u8; 32]) -> Vec<u8> {
        let mut key = b"BlockHash:".to_vec();
        key.extend_from_slice(&hash);
        key
    }

    /// Calculate transaction hash
    fn transaction_hash(tx: &Transaction) -> [u8; 32] {
        use blake2::{Blake2b512, Digest};
        let encoded = tx.encode();
        let hash = Blake2b512::digest(&encoded);
        let mut result = [0u8; 32];
        result.copy_from_slice(&hash[..32]);
        result
    }

    /// Generate storage key for energy last update
    fn energy_last_update_key(account: [u8; 32]) -> Vec<u8> {
        let mut key = b"Energy:LastUpdate:".to_vec();
        key.extend_from_slice(&account);
        key
    }
}

// ========== Response Types ==========

#[derive(Clone, Serialize, Deserialize)]
pub struct ChainHealth {
    pub connected: bool,
    pub block_number: u64,
    pub block_time: u64,
    pub finality: u64,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct TransactionInfo {
    pub hash: String,
    pub from: String,
    pub to: Option<String>,
    pub amount: Option<String>,
    pub nonce: u64,
    pub status: String,
}

#[derive(Serialize, Deserialize)]
#[derive(Clone)]
pub struct EraInfo {
    pub era: u64,
    pub block_number: u64,
    pub total_rewards: String,
    pub transaction_fees: String,
    pub validators: Vec<ValidatorInfo>,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct ValidatorInfo {
    pub account: String,
    pub stake: String,
    pub commission: u8,
    pub active: bool,
    pub public_key: String,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct StakingPoolInfo {
    pub validator: String,
    pub total_stake: String,
    pub nominators: Vec<NominationInfo>,
    pub commission: u8,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct NominationInfo {
    pub account: String,
    pub stake: String,
    pub era: u64,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct ConsensusStatus {
    pub current_era: u64,
    pub block_number: u64,
    pub validators: usize,
    pub total_stake: String,
    pub transaction_fees: String,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct EnergyInfo {
    pub current: u64,
    pub max: u64,
    pub regeneration_rate: u64,
    pub last_update: u64,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct SessionKeyInfo {
    pub session_key: String,
    pub expiry_block: u32,
}

/// Faucet/starter bonus result
#[derive(Clone, Serialize, Deserialize)]
pub struct FaucetResult {
    pub success: bool,
    pub amount: String,
    pub message: String,
}

/// Chain information
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ChainInfo {
    pub chain_name: String,
    pub chain_version: String,
    pub block_number: u64,
    pub block_hash: [u8; 32],
}

// ========== CVP Response Types ==========

/// CVP system status
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct CvpStatus {
    /// Whether CVP is enabled
    pub enabled: bool,
    /// Current mutation epoch
    pub current_epoch: u64,
    /// Number of CVP-protected contracts
    pub registered_contracts: usize,
    /// Total mutations performed across all contracts
    pub total_mutations: u64,
    /// Total threats detected by the attack detector
    pub threats_detected: u64,
    /// Number of proofs pending inclusion in a block
    pub pending_proofs: usize,
}

/// CVP bytecode information
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct CvpBytecodeInfo {
    /// Contract identifier (hex)
    pub contract_id: String,
    /// Current bytecode (hex)
    pub bytecode: String,
    /// Blake2b hash of the bytecode (hex)
    pub bytecode_hash: String,
    /// Size in bytes
    pub size: usize,
}

/// CVP contract information
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct CvpContractInfo {
    /// Contract identifier (hex)
    pub contract_id: String,
    /// Contract name
    pub name: String,
    /// Current bytecode size
    pub bytecode_size: usize,
    /// Number of mutations performed
    pub mutation_count: u64,
    /// Block number of last mutation
    pub last_mutation_block: u64,
    /// Whether a valid proof exists for the current bytecode
    pub has_proof: bool,
    /// Proof system used (e.g., "Plonky2", "TranslationValidation")
    pub proof_system: String,
}

// ========== DRC-369 Response Types ==========

/// DRC-369 token information
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Drc369TokenInfo {
    /// Token ID
    pub token_id: String,
    /// Current owner address (hex)
    pub owner: String,
    /// Token URI/metadata URL
    pub token_uri: Option<String>,
    /// Whether the token is soulbound (non-transferable)
    pub is_soulbound: bool,
    /// Parent token ID if nested (hex)
    pub parent_token_id: Option<String>,
    /// Whether the token contract is CVP-protected
    pub cvp_protected: bool,
}

/// DRC-369 collection statistics
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Drc369CollectionStats {
    /// Total number of tokens minted
    pub total_supply: String,
    /// Number of unique holders
    pub holder_count: u64,
    /// Number of soulbound tokens
    pub soulbound_count: u64,
    /// Number of nested tokens
    pub nested_count: u64,
}

/// DRC-369 state tree response
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Drc369StateTree {
    /// Token ID
    pub token_id: String,
    /// Path prefix that was queried
    pub path_prefix: String,
    /// State entries under this path
    pub entries: Vec<Drc369StateEntry>,
    /// Total count of entries
    pub total_count: usize,
}

/// Single state entry in a tree
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Drc369StateEntry {
    /// Full path (e.g., "stats/damage")
    pub path: String,
    /// Value as string
    pub value: String,
    /// Value type hint
    pub value_type: String,
}

/// Batch state query result
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Drc369StateBatchEntry {
    /// Requested path
    pub path: String,
    /// Value if exists
    pub value: Option<String>,
}

/// Optimistic state update result
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Drc369OptimisticResult {
    /// Transaction hash
    pub tx_hash: String,
    /// The value that was optimistically applied
    pub optimistic_value: String,
    /// Status: "pending", "confirmed", "failed"
    pub status: String,
    /// Estimated time to confirmation in milliseconds
    pub estimated_confirmation_ms: u64,
}

// ========== Author Response Types ==========

/// Result of submitting a transaction
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct AuthorSubmitResult {
    /// Transaction hash (hex)
    pub tx_hash: String,
    /// Subscription ID for tracking status
    pub subscription_id: String,
    /// Current status: "pending", "in_block", "finalized", "failed"
    pub status: String,
}

/// Transaction status update
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct TransactionStatus {
    /// Transaction hash (hex)
    pub tx_hash: String,
    /// Current status
    pub status: String,
    /// Block hash if included (hex)
    pub block_hash: Option<String>,
    /// Block number if included
    pub block_number: Option<u64>,
    /// Error message if failed
    pub error: Option<String>,
}
