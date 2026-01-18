//! Transaction types and validation

use codec::{Decode, Encode};
use scale_info::TypeInfo;

/// A transaction on the blockchain
#[derive(Clone, Debug, Encode, Decode, TypeInfo)]
pub struct Transaction {
    pub nonce: u64,
    pub from: [u8; 32], // Account ID
    pub signature: [u8; 64], // Ed25519 signature
    pub data: TransactionData,
}

/// Transaction data payload
#[derive(Clone, Debug, Encode, Decode, TypeInfo)]
pub enum TransactionData {
    /// Call a module function
    ModuleCall {
        module: String,
        call: Vec<u8>,
    },
    /// Transfer tokens
    Transfer {
        to: [u8; 32],
        amount: u128,
    },
}

impl Transaction {
    /// Validate the transaction
    pub fn validate(&self) -> crate::Result<()> {
        // TODO: Verify signature
        // TODO: Check nonce
        // TODO: Validate data
        Ok(())
    }
}
