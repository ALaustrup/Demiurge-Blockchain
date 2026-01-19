//! RPC methods implementation

use crate::RpcError;
use demiurge_core::{Block, Transaction, Runtime};
use demiurge_storage::Storage;
use demiurge_consensus::{ConsensusEngine, ValidatorSet, Validator};
use demiurge_module_energy::EnergyModule;
use demiurge_module_session_keys::SessionKeysModule;
use codec::{Decode, Encode};
use std::sync::Arc;
use std::result::Result;
use tokio::sync::Mutex;
use serde::{Serialize, Deserialize};

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
    pub async fn chain_get_health(&self) -> Result<ChainHealth, RpcError> {
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
    pub async fn balances_transfer(&self, from: [u8; 32], to: [u8; 32], amount: String, _signature: String) -> Result<String, RpcError> {
        // TODO: Verify signature and execute transaction
        // For now, return placeholder
        Ok("0x0000000000000000000000000000000000000000000000000000000000000000".to_string())
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
            .map_err(|e| RpcError::InvalidParams)?
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
            .map_err(|e| RpcError::InvalidParams)?
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
        let nominator: [u8; 32] = hex::decode(nominator_hex)
            .map_err(|e| RpcError::InvalidParams)?
            .try_into()
            .map_err(|_| RpcError::InvalidParams)?;
        let validator: [u8; 32] = hex::decode(validator_hex)
            .map_err(|e| RpcError::InvalidParams)?
            .try_into()
            .map_err(|_| RpcError::InvalidParams)?;
        let amount_u128 = amount.parse::<u128>()
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
        let current_block = self.get_block_number().await?;
        
        Ok(EnergyInfo {
            current: energy,
            max: 1000, // MAX_ENERGY constant
            regeneration_rate: 10, // REGENERATION_RATE constant
            last_update,
        })
    }

    // ========== Session Keys Methods ==========

    /// Get active session keys for account
    pub async fn session_keys_get_active_keys(&self, account_hex: String) -> Result<Vec<SessionKeyInfo>, RpcError> {
        let account: [u8; 32] = hex::decode(account_hex)
            .map_err(|e| RpcError::InvalidParams)?
            .try_into()
            .map_err(|_| RpcError::InvalidParams)?;
        
        // Get current block
        let current_block = self.get_block_number().await?;
        
        // Query session keys from storage
        // TODO: Implement proper session keys query
        // For now, return empty list
        Ok(vec![])
    }

    /// Authorize session key
    pub async fn session_keys_authorize(&self, primary_account_hex: String, session_key_hex: String, duration: u32, _signature: String) -> Result<String, RpcError> {
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

#[derive(Serialize, Deserialize)]
#[derive(Clone, Serialize, Deserialize)]
pub struct ChainHealth {
    pub connected: bool,
    pub block_number: u64,
    pub block_time: u64,
    pub finality: u64,
}

#[derive(Serialize, Deserialize)]
pub struct TransactionInfo {
    pub hash: String,
    pub from: String,
    pub to: Option<String>,
    pub amount: Option<String>,
    pub nonce: u64,
    pub status: String,
}

#[derive(Serialize, Deserialize)]
pub struct EraInfo {
    pub era: u64,
    pub block_number: u64,
    pub total_rewards: String,
    pub transaction_fees: String,
    pub validators: Vec<ValidatorInfo>,
}

#[derive(Serialize, Deserialize)]
pub struct ValidatorInfo {
    pub account: String,
    pub stake: String,
    pub commission: u8,
    pub active: bool,
    pub public_key: String,
}

#[derive(Serialize, Deserialize)]
pub struct StakingPoolInfo {
    pub validator: String,
    pub total_stake: String,
    pub nominators: Vec<NominationInfo>,
    pub commission: u8,
}

#[derive(Serialize, Deserialize)]
pub struct NominationInfo {
    pub account: String,
    pub stake: String,
    pub era: u64,
}

#[derive(Serialize, Deserialize)]
pub struct ConsensusStatus {
    pub current_era: u64,
    pub block_number: u64,
    pub validators: usize,
    pub total_stake: String,
    pub transaction_fees: String,
}

#[derive(Serialize, Deserialize)]
pub struct EnergyInfo {
    pub current: u64,
    pub max: u64,
    pub regeneration_rate: u64,
    pub last_update: u64,
}

#[derive(Serialize, Deserialize)]
pub struct SessionKeyInfo {
    pub session_key: String,
    pub expiry_block: u32,
}

/// Chain information
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ChainInfo {
    pub chain_name: String,
    pub chain_version: String,
    pub block_number: u64,
    pub block_hash: [u8; 32],
}
