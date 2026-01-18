//! Storage backend implementation

use thiserror::Error;
use std::sync::Arc;

/// Storage trait
pub trait Storage {
    fn get(&self, key: &[u8]) -> Option<Vec<u8>>;
    fn put(&mut self, key: &[u8], value: &[u8]);
    fn delete(&mut self, key: &[u8]);
    fn commit(&mut self) -> Result<[u8; 32], StorageError>;
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
