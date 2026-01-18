//! Storage layer - key-value store with Merkle tree support

pub mod backend;
pub mod merkle;

pub use backend::{Storage, StorageBackend};
pub use merkle::MerkleTree;
