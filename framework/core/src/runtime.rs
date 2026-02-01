//! Runtime engine - executes transactions and manages state

use crate::{Block, Result, Transaction, TransactionData};
use demiurge_storage::Storage;
use demiurge_modules::{ModuleRegistry, traits::Module};
use demiurge_module_balances::{BalancesModule, BalanceCall};
use demiurge_module_energy::{EnergyModule, EnergyCall};
use demiurge_module_energy::energy::constants as EnergyConstants;
use demiurge_module_session_keys::{SessionKeysModule, SessionCall};
use codec::Encode;
use std::sync::Arc;

/// The core runtime engine
pub struct Runtime<S: Storage> {
    pub storage: Arc<S>,
    pub modules: ModuleRegistry,
    pub block_number: u64,
}

impl<S: Storage> Runtime<S> {
    /// Create a new runtime
    pub fn new(storage: S) -> Self {
        Self {
            storage: Arc::new(storage),
            modules: ModuleRegistry::new(),
            block_number: 0,
        }
    }

    /// Create runtime with shared storage
    pub fn with_storage(storage: Arc<S>) -> Self {
        Self {
            storage,
            modules: ModuleRegistry::new(),
            block_number: 0,
        }
    }

    /// Execute a transaction
    pub fn execute_transaction(&mut self, tx: Transaction) -> Result<()> {
        // Validate transaction
        tx.validate()?;

        // Get mutable storage reference
        let storage_ref = Arc::get_mut(&mut self.storage)
            .ok_or_else(|| crate::Error::InvalidTransaction("Storage is shared, cannot get mutable reference".to_string()))?;

        // Check session key authorization (if using session key)
        // For now, we'll check if the transaction is from a session key
        // TODO: Add session key field to Transaction struct
        // For now, we'll skip session key validation and add it later

        // Consume energy for transaction (unless it's an energy module call itself)
        let should_consume_energy = match &tx.data {
            TransactionData::ModuleCall { module, .. } => module != "Energy",
            TransactionData::Transfer { .. } => true,
        };

        if should_consume_energy {
            // Consume energy from sender
            EnergyModule::consume_energy(storage_ref, tx.from, EnergyConstants::BASE_TX_COST)
                .map_err(|e| crate::Error::ModuleError(format!("Energy error: {}", e)))?;
        }

        // Execute based on transaction type
        match tx.data {
            TransactionData::ModuleCall { module, call } => {
                // Execute module call
                match module.as_str() {
                    "Balances" => {
                        // Decode balance call
                        let balance_call: BalanceCall = codec::Decode::decode(&mut &call[..])
                            .map_err(|e| crate::Error::InvalidTransaction(format!("Failed to decode balance call: {}", e)))?;
                        
                        match balance_call {
                            BalanceCall::Transfer { from, to, amount } => {
                                BalancesModule::transfer(storage_ref, from, to, amount)
                                    .map_err(|e| crate::Error::ModuleError(e.to_string()))?;
                            }
                            BalanceCall::Mint { to, amount } => {
                                BalancesModule::mint(storage_ref, to, amount)
                                    .map_err(|e| crate::Error::ModuleError(e.to_string()))?;
                            }
                            BalanceCall::Burn { from, amount } => {
                                BalancesModule::burn(storage_ref, from, amount)
                                    .map_err(|e| crate::Error::ModuleError(e.to_string()))?;
                            }
                        }
                    }
                    "Energy" => {
                        // Decode energy call
                        let energy_call: EnergyCall = codec::Decode::decode(&mut &call[..])
                            .map_err(|e| crate::Error::InvalidTransaction(format!("Failed to decode energy call: {}", e)))?;
                        
                        match energy_call {
                            EnergyCall::Consume { account, amount } => {
                                EnergyModule::consume_energy(storage_ref, account, amount)
                                    .map_err(|e| crate::Error::ModuleError(e.to_string()))?;
                            }
                            EnergyCall::Regenerate { account } => {
                                EnergyModule::regenerate_energy(storage_ref, account)
                                    .map_err(|e| crate::Error::ModuleError(e.to_string()))?;
                            }
                            EnergyCall::Sponsor { developer, user } => {
                                EnergyModule::sponsor_transaction(storage_ref, developer, user)
                                    .map_err(|e| crate::Error::ModuleError(e.to_string()))?;
                            }
                        }
                    }
                    "SessionKeys" => {
                        // Decode session keys call
                        let session_call: SessionCall = codec::Decode::decode(&mut &call[..])
                            .map_err(|e| crate::Error::InvalidTransaction(format!("Failed to decode session keys call: {}", e)))?;
                        
                        match session_call {
                            SessionCall::Authorize { primary_account, session_key, duration } => {
                                SessionKeysModule::authorize_session_key(storage_ref, primary_account, session_key, duration)
                                    .map_err(|e| crate::Error::ModuleError(e.to_string()))?;
                            }
                            SessionCall::Revoke { primary_account, session_key } => {
                                SessionKeysModule::revoke_session_key(storage_ref, primary_account, session_key)
                                    .map_err(|e| crate::Error::ModuleError(e.to_string()))?;
                            }
                        }
                    }
                    _ => {
                        // Try to execute via module registry
                        // For now, return error for unknown modules
                        return Err(crate::Error::ModuleError(format!("Unknown module: {}", module)));
                    }
                }
            }
            TransactionData::Transfer { to, amount } => {
                // Direct transfer - use balances module
                BalancesModule::transfer(storage_ref, tx.from, to, amount)
                    .map_err(|e| crate::Error::ModuleError(e.to_string()))?;
            }
        }

        Ok(())
    }

    /// Execute a block
    /// Returns the calculated state root
    pub fn execute_block(&mut self, block: Block) -> Result<[u8; 32]> {
        // Validate block (standalone - parent validation done at import)
        block.validate(None)?;

        // Update block number storage for modules that need it
        {
            let storage_ref = Arc::get_mut(&mut self.storage)
                .ok_or_else(|| crate::Error::InvalidTransaction("Storage is shared, cannot get mutable reference".to_string()))?;
            
            // Store current block number for modules
            let block_key = b"System:BlockNumber";
            storage_ref.put(block_key, &self.block_number.encode());
        }

        // Execute all transactions
        for tx in block.transactions {
            self.execute_transaction(tx)?;
        }

        // Call on_initialize for modules (cleanup expired session keys, etc.)
        // Note: This is a simplified approach - in production we'd iterate through registered modules
        {
            let storage_ref = Arc::get_mut(&mut self.storage)
                .ok_or_else(|| crate::Error::InvalidTransaction("Storage is shared, cannot get mutable reference".to_string()))?;
            
            let mut session_keys_module = SessionKeysModule;
            session_keys_module.on_initialize(self.block_number, storage_ref)
                .map_err(|e| crate::Error::ModuleError(format!("SessionKeys on_initialize error: {}", e)))?;
        }

        // Calculate state root after execution
        let state_root = self.calculate_state_root()?;
        
        // Finalize block
        self.block_number += 1;
        
        // Update block number storage
        {
            let storage_ref = Arc::get_mut(&mut self.storage)
                .ok_or_else(|| crate::Error::InvalidTransaction("Storage is shared, cannot get mutable reference".to_string()))?;
            
            let block_key = b"System:BlockNumber";
            storage_ref.put(block_key, &self.block_number.encode());
            
            // Store state root
            let state_root_key = b"System:StateRoot";
            storage_ref.put(state_root_key, &state_root);
        }

        // TODO: Storage commit needs mutable access - will need interior mutability or redesign
        // For now, skip commit
        // self.storage.commit()?;

        Ok(state_root)
    }

    /// Calculate state root from current storage state
    fn calculate_state_root(&self) -> Result<[u8; 32]> {
        use blake2::{Blake2b512, Digest};
        
        // Simplified state root calculation
        // In production, this would iterate through all storage keys and create a Merkle tree
        // For now, we'll calculate a hash of key storage values
        
        let mut hasher = Blake2b512::new();
        
        // Hash important system values
        if let Some(block_number) = self.storage.get(b"System:BlockNumber") {
            hasher.update(b"block_number");
            hasher.update(&block_number);
        }
        
        // Hash balances (simplified - in production, hash all balances)
        // For now, just hash a placeholder
        hasher.update(b"state");
        
        let hash = hasher.finalize();
        let mut result = [0u8; 32];
        result.copy_from_slice(&hash[..32]);
        Ok(result)
    }

    /// Get current block number
    pub fn block_number(&self) -> u64 {
        self.block_number
    }
}
