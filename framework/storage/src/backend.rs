//! Storage backend implementation

use thiserror::Error;
use std::collections::HashMap;

/// Storage trait
pub trait Storage {
    fn get(&self, key: &[u8]) -> Option<Vec<u8>>;
    fn put(&mut self, key: &[u8], value: &[u8]);
    fn delete(&mut self, key: &[u8]);
    fn commit(&mut self) -> Result<[u8; 32], StorageError>;
}

/// In-memory storage for testing
#[derive(Default)]
pub struct MemoryStorage {
    data: HashMap<Vec<u8>, Vec<u8>>,
}

impl MemoryStorage {
    pub fn new() -> Self {
        Self {
            data: HashMap::new(),
        }
    }
}

impl Storage for MemoryStorage {
    fn get(&self, key: &[u8]) -> Option<Vec<u8>> {
        self.data.get(key).cloned()
    }

    fn put(&mut self, key: &[u8], value: &[u8]) {
        self.data.insert(key.to_vec(), value.to_vec());
    }

    fn delete(&mut self, key: &[u8]) {
        self.data.remove(key);
    }

    fn commit(&mut self) -> Result<[u8; 32], StorageError> {
        // For memory storage, just return a hash of all data
        use blake2::{Blake2b512, Digest};
        let mut hasher = Blake2b512::new();
        for (key, value) in &self.data {
            hasher.update(key);
            hasher.update(value);
        }
        let hash = hasher.finalize();
        let mut result = [0u8; 32];
        result.copy_from_slice(&hash[..32]);
        Ok(result)
    }
}

/// Storage backend using RocksDB
pub struct StorageBackend {
    db: rocksdb::DB,
}

impl StorageBackend {
    pub fn new(path: &str) -> Result<Self, StorageError> {
        let db = rocksdb::DB::open_default(path)
            .map_err(|e| StorageError::DatabaseError(e.to_string()))?;
        Ok(Self { db })
    }
}

impl Storage for StorageBackend {
    fn get(&self, key: &[u8]) -> Option<Vec<u8>> {
        self.db.get(key).ok().flatten()
    }

    fn put(&mut self, key: &[u8], value: &[u8]) {
        let _ = self.db.put(key, value);
    }

    fn delete(&mut self, key: &[u8]) {
        let _ = self.db.delete(key);
    }

    fn commit(&mut self) -> Result<[u8; 32], StorageError> {
        // TODO: Calculate Merkle root
        Ok([0u8; 32])
    }
}

#[derive(Error, Debug)]
pub enum StorageError {
    #[error("Database error: {0}")]
    DatabaseError(String),
}
