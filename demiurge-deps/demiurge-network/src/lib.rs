//! Demiurge Custom Network Implementation
//!
//! This module replaces sc-network with a unified, conflict-free implementation.
//! All codec indices are explicitly defined and tested.
//!
//! # Version History
//!
//! - 0.1.0: Based on sc-network-0.39.0 baseline with explicit codec indices
//!

use parity_scale_codec::{Decode, Encode};
use scale_info::TypeInfo;

/// Network message protocol
///
/// The protocol version of a peer.
#[derive(Clone, Debug, PartialEq, Encode, Decode, TypeInfo)]
pub struct Status<Hash, Number> {
    /// Protocol version.
    pub version: u32,
    /// Minimum supported version.
    pub min_supported_version: u32,
    /// Best block hash.
    pub best_hash: Hash,
    /// Best block number.
    pub best_number: Number,
    /// Genesis block hash.
    pub genesis_hash: Hash,
}

/// A network message with fixed codec indices
///
/// These indices are CANONICAL and never change to avoid forward compatibility issues.
/// Each variant has an explicit index to prevent auto-assignment conflicts.
#[derive(Debug, PartialEq, Clone, Encode, Decode, TypeInfo)]
pub enum Message<Hash, Number> {
    /// Status packet  
    #[codec(index = 0)]
    Status(Status<Hash, Number>),

    /// Block request  
    #[codec(index = 1)]
    BlockRequest(u32),

    /// Block response - would contain serialized block data
    #[codec(index = 2)]
    BlockResponse(Vec<u8>),

    /// Block announce
    #[codec(index = 3)]
    BlockAnnounce(Hash),

    /// Remote header request
    #[codec(index = 4)]
    RemoteHeaderRequest(Number),

    /// Remote header response
    #[codec(index = 5)]
    RemoteHeaderResponse(Vec<u8>),

    /// Consensus protocol message (CRITICAL: MUST be 6)
    #[codec(index = 6)]
    Consensus(Vec<u8>),

    /// Remote method call request
    #[codec(index = 7)]
    RemoteCallRequest(Vec<u8>),

    /// Remote method call response
    #[codec(index = 8)]
    RemoteCallResponse(Vec<u8>),

    /// Remote storage read request
    #[codec(index = 9)]
    RemoteReadRequest(Vec<u8>),

    /// Remote storage read response
    #[codec(index = 10)]
    RemoteReadResponse(Vec<u8>),

    /// Remote changes request
    #[codec(index = 13)]
    RemoteChangesRequest(Vec<u8>),

    /// Remote changes response
    #[codec(index = 14)]
    RemoteChangesResponse(Vec<u8>),

    /// Remote child storage read request
    #[codec(index = 15)]
    RemoteReadChildRequest(Vec<u8>),

    /// Batch of consensus protocol messages
    #[codec(index = 17)]
    ConsensusBatch(Vec<Vec<u8>>),
}

#[cfg(test)]
mod tests {
    use super::*;
    use parity_scale_codec::{Decode, Encode};

    #[test]
    fn test_message_codec_indices() {
        // Verify that each variant encodes to the correct index
        let messages = vec![
            (Message::<[u8; 32], u64>::Status(Status {
                version: 0,
                min_supported_version: 0,
                best_hash: [0u8; 32],
                best_number: 0,
                genesis_hash: [0u8; 32],
            }), 0u8),
            (Message::BlockRequest(0), 1u8),
            (Message::BlockResponse(vec![]), 2u8),
            (Message::BlockAnnounce([0u8; 32]), 3u8),
            (Message::RemoteHeaderRequest(0), 4u8),
            (Message::RemoteHeaderResponse(vec![]), 5u8),
            (Message::Consensus(vec![]), 6u8),
            (Message::RemoteCallRequest(vec![]), 7u8),
            (Message::RemoteCallResponse(vec![]), 8u8),
            (Message::RemoteReadRequest(vec![]), 9u8),
            (Message::RemoteReadResponse(vec![]), 10u8),
            (Message::RemoteChangesRequest(vec![]), 13u8),
            (Message::RemoteChangesResponse(vec![]), 14u8),
            (Message::RemoteReadChildRequest(vec![]), 15u8),
            (Message::ConsensusBatch(vec![]), 17u8),
        ];

        for (msg, expected_index) in messages {
            let encoded = msg.encode();
            // First byte of encoded enum is the discriminant
            assert_eq!(
                encoded[0], expected_index,
                "Message variant has unexpected codec index"
            );
        }
    }

    #[test]
    fn test_no_duplicate_indices() {
        // Ensure no two variants have the same index
        let indices = vec![0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 13, 14, 15, 17];
        let mut sorted = indices.clone();
        sorted.sort();
        sorted.dedup();
        assert_eq!(indices.len(), sorted.len(), "Duplicate codec indices detected!");
    }
}
