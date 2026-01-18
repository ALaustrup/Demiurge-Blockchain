//! Runtime engine - executes transactions and manages state

use crate::{Block, Result, Transaction, TransactionData};
use demiurge_storage::Storage;
use demiurge_modules::ModuleRegistry;
use demiurge_module_balances::{BalancesModule, BalanceCall};
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

        // Execute based on transaction type
        match tx.data {
            TransactionData::ModuleCall { module, call } => {
                // Execute module call
                match module.as_str() {
                    "Balances" => {
                        // Decode balance call
                        let balance_call: BalanceCall = codec::Decode::decode(&mut &call[..])
                            .map_err(|e| crate::Error::InvalidTransaction(format!("Failed to decode balance call: {}", e)))?;
                        
                        // Get mutable storage reference using Arc::get_mut
                        // This requires unique access - runtime should have exclusive access during execution
                        let storage_ref = Arc::get_mut(&mut self.storage)
                            .ok_or_else(|| crate::Error::InvalidTransaction("Storage is shared, cannot get mutable reference".to_string()))?;
                        
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
                    _ => {
                        // Try to execute via module registry
                        // For now, return error for unknown modules
                        return Err(crate::Error::ModuleError(format!("Unknown module: {}", module)));
                    }
                }
            }
            TransactionData::Transfer { to, amount } => {
                // Direct transfer - use balances module
                let storage_ref = Arc::get_mut(&mut self.storage)
                    .ok_or_else(|| crate::Error::InvalidTransaction("Storage is shared, cannot get mutable reference".to_string()))?;
                
                BalancesModule::transfer(storage_ref, tx.from, to, amount)
                    .map_err(|e| crate::Error::ModuleError(e.to_string()))?;
            }
        }

        Ok(())
    }

    /// Execute a block
    pub fn execute_block(&mut self, block: Block) -> Result<()> {
        // Validate block
        block.validate()?;

        // Execute all transactions
        for tx in block.transactions {
            self.execute_transaction(tx)?;
        }

        // Finalize block
        self.block_number += 1;
        // TODO: Storage commit needs mutable access - will need interior mutability or redesign
        // For now, skip commit
        // self.storage.commit()?;

        Ok(())
    }

    /// Get current block number
    pub fn block_number(&self) -> u64 {
        self.block_number
    }
}
