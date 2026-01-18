//! Module trait definition

use demiurge_storage::Storage;
use thiserror::Error;

/// Base trait for all modules
pub trait Module: Send + Sync {
    /// Module name
    fn name(&self) -> &'static str;

    /// Module version
    fn version(&self) -> u32;

    /// Execute a call
    fn execute(
        &self,
        call: Vec<u8>,
        storage: &mut dyn Storage,
    ) -> Result<(), ModuleError>;

    /// Called at the start of each block
    fn on_initialize(&mut self, block_number: u64, storage: &mut dyn Storage) -> Result<(), ModuleError> {
        let _ = (block_number, storage);
        Ok(())
    }

    /// Called at the end of each block
    fn on_finalize(&mut self, block_number: u64, storage: &mut dyn Storage) -> Result<(), ModuleError> {
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
