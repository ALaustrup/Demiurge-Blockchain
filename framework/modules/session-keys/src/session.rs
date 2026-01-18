//! Session keys implementation

use crate::{SessionKeysError, Result};
use demiurge_modules::traits::Module;
use demiurge_storage::Storage;
use codec::{Decode, Encode};
use scale_info::TypeInfo;

/// Session Keys module
pub struct SessionKeysModule;

impl Module for SessionKeysModule {
    fn name(&self) -> &'static str {
        "SessionKeys"
    }

    fn version(&self) -> u32 {
        1
    }

    fn execute(
        &self,
        call: Vec<u8>,
        storage: &mut dyn Storage,
    ) -> std::result::Result<(), demiurge_modules::traits::ModuleError> {
        let call_data: SessionCall = Decode::decode(&mut &call[..])
            .map_err(|e| demiurge_modules::traits::ModuleError::InvalidCall(e.to_string()))?;

        match call_data {
            SessionCall::Authorize { primary_account, session_key, duration } => {
                // TODO: Authorize session key
                Ok(())
            }
            SessionCall::Revoke { primary_account, session_key } => {
                // TODO: Revoke session key
                Ok(())
            }
        }
    }

    fn on_initialize(
        &mut self,
        block_number: u64,
        storage: &mut dyn Storage,
    ) -> std::result::Result<(), demiurge_modules::traits::ModuleError> {
        // Auto-expire expired session keys
        // TODO: Implement expiration logic
        Ok(())
    }
}

/// Session keys module calls
#[derive(Clone, Debug, Encode, Decode, TypeInfo)]
pub enum SessionCall {
    /// Authorize a session key
    Authorize {
        primary_account: [u8; 32],
        session_key: [u8; 32],
        duration: u64, // Duration in blocks
    },
    /// Revoke a session key
    Revoke {
        primary_account: [u8; 32],
        session_key: [u8; 32],
    },
}
