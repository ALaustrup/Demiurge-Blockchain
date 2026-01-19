//! Transaction types and validation

use std::string::String;
use std::vec::Vec;
use codec::{Decode, Encode};
use scale_info::TypeInfo;
use serde::{Serialize, Deserialize};
use crate::serde_helpers::{serialize_bytes, deserialize_bytes, serialize_bytes64, deserialize_bytes64};

/// A transaction on the blockchain
#[derive(Clone, Debug, Encode, Decode, TypeInfo, Serialize, Deserialize)]
pub struct Transaction {
    pub nonce: u64,
    #[serde(serialize_with = "serialize_bytes", deserialize_with = "deserialize_bytes")]
    pub from: [u8; 32], // Account ID
    #[serde(serialize_with = "serialize_bytes64", deserialize_with = "deserialize_bytes64")]
    pub signature: [u8; 64], // Ed25519 signature
    pub data: TransactionData,
}

/// Transaction data payload
#[derive(Clone, Debug, Encode, Decode, TypeInfo, Serialize, Deserialize)]
pub enum TransactionData {
    /// Call a module function
    ModuleCall {
        module: String,
        call: Vec<u8>,
    },
    /// Transfer tokens
    Transfer {
        #[serde(serialize_with = "serialize_bytes", deserialize_with = "deserialize_bytes")]
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
