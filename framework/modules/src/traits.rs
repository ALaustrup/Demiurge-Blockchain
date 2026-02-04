//! Module trait definition
//!
//! All modules use interior mutability for storage operations.
//! The Storage trait provides thread-safe write operations via &self.

use demiurge_storage::Storage;
use thiserror::Error;

/// Base trait for all modules
/// 
/// Storage uses interior mutability - all storage operations work through &dyn Storage.
/// This allows modules to be used in concurrent contexts without explicit locking.
pub trait Module: Send + Sync {
    /// Module name
    fn name(&self) -> &'static str;

    /// Module version
    fn version(&self) -> u32;

    /// Execute a call
    /// 
    /// Storage uses interior mutability for writes.
    fn execute(
        &self,
        call: Vec<u8>,
        storage: &dyn Storage,
    ) -> Result<(), ModuleError>;

    /// Called at the start of each block
    /// 
    /// Use for initialization, cleanup of expired data, etc.
    fn on_initialize(&mut self, block_number: u64, storage: &dyn Storage) -> Result<(), ModuleError> {
        let _ = (block_number, storage);
        Ok(())
    }

    /// Called at the end of each block
    /// 
    /// Use for finalization, state updates that depend on all transactions.
    fn on_finalize(&mut self, block_number: u64, storage: &dyn Storage) -> Result<(), ModuleError> {
        let _ = (block_number, storage);
        Ok(())
    }
}

#[derive(Error, Debug)]
pub enum ModuleError {
    #[error("Invalid call: {0}")]
    InvalidCall(String),
    #[error("Execution failed: {0}")]
    ExecutionFailed(String),
}
