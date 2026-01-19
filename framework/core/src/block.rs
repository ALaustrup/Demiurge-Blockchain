//! Block structure and validation

use codec::{Decode, Encode};
use scale_info::TypeInfo;
use serde::{Serialize, Deserialize};
use serde_bytes;
use crate::Transaction;

/// A block in the blockchain
#[derive(Clone, Debug, Encode, Decode, TypeInfo, Serialize, Deserialize)]
pub struct Block {
    pub header: BlockHeader,
    pub transactions: Vec<Transaction>,
}

/// Block header
#[derive(Clone, Debug, Encode, Decode, TypeInfo, Serialize, Deserialize)]
pub struct BlockHeader {
    #[serde(with = "serde_bytes")]
    pub parent_hash: [u8; 32],
    pub block_number: u64,
    #[serde(with = "serde_bytes")]
    pub state_root: [u8; 32],
    #[serde(with = "serde_bytes")]
    pub extrinsics_root: [u8; 32],
    pub timestamp: u64,
}

impl Block {
    /// Validate the block
    pub fn validate(&self) -> crate::Result<()> {
        // TODO: Verify parent hash
        // TODO: Verify state root
        // TODO: Verify extrinsics root
        // TODO: Check timestamp
        Ok(())
    }

    /// Calculate block hash
    pub fn hash(&self) -> [u8; 32] {
        use blake2::{Blake2b512, Digest};
        let encoded = self.header.encode();
        let hash = Blake2b512::digest(&encoded);
        let mut result = [0u8; 32];
        result.copy_from_slice(&hash[..32]);
        result
    }
}
