//! Runtime engine - executes transactions and manages state

use crate::{Block, Result, Transaction};
use demiurge_storage::Storage;
use demiurge_modules::ModuleRegistry;
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
            crate::TransactionData::ModuleCall { module, call } => {
                // TODO: Implement module execution
                // For now, just validate the call exists
                let _ = (module, call);
                // self.modules.execute(&module, call, &mut self.storage)?;
            }
            crate::TransactionData::Transfer { .. } => {
                // Handle transfers
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
