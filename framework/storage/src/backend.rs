//! Storage backend implementation
//!
//! Provides efficient key-value storage with prefix iteration support
//! for hierarchical state queries (critical for DRC-369 state trees).

use thiserror::Error;
use std::collections::HashMap;

/// Storage trait with prefix iteration support
pub trait Storage {
    /// Get a value by key
    fn get(&self, key: &[u8]) -> Option<Vec<u8>>;
    
    /// Put a key-value pair
    fn put(&mut self, key: &[u8], value: &[u8]);
    
    /// Delete a key
    fn delete(&mut self, key: &[u8]);
    
    /// Commit changes and return root hash
    fn commit(&mut self) -> Result<[u8; 32], StorageError>;
    
    /// Iterate over all keys with a given prefix
    /// Returns (key, value) pairs in lexicographic order
    fn prefix_iter(&self, prefix: &[u8]) -> Box<dyn Iterator<Item = (Vec<u8>, Vec<u8>)> + '_>;
    
    /// Count keys with a given prefix (more efficient than iterating)
    fn prefix_count(&self, prefix: &[u8]) -> usize {
        self.prefix_iter(prefix).count()
    }
    
    /// Check if any key exists with the given prefix
    fn prefix_exists(&self, prefix: &[u8]) -> bool {
        self.prefix_iter(prefix).next().is_some()
    }
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
        
        // Sort keys for deterministic hashing
        let mut keys: Vec<_> = self.data.keys().collect();
        keys.sort();
        
        for key in keys {
            if let Some(value) = self.data.get(key) {
                hasher.update(key);
                hasher.update(value);
            }
        }
        let hash = hasher.finalize();
        let mut result = [0u8; 32];
        result.copy_from_slice(&hash[..32]);
        Ok(result)
    }
    
    fn prefix_iter(&self, prefix: &[u8]) -> Box<dyn Iterator<Item = (Vec<u8>, Vec<u8>)> + '_> {
        let prefix = prefix.to_vec();
        
        // Collect matching entries and sort by key
        let mut entries: Vec<_> = self.data
            .iter()
            .filter(move |(k, _)| k.starts_with(&prefix))
            .map(|(k, v)| (k.clone(), v.clone()))
            .collect();
        
        entries.sort_by(|a, b| a.0.cmp(&b.0));
        
        Box::new(entries.into_iter())
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
        // Flush to disk
        self.db.flush().map_err(|e| StorageError::DatabaseError(e.to_string()))?;
        
        // TODO: Calculate Merkle root from state trie
        // For now, return a hash of the current timestamp as placeholder
        use blake2::{Blake2b512, Digest};
        let mut hasher = Blake2b512::new();
        hasher.update(b"COMMIT_");
        hasher.update(&std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_nanos()
            .to_le_bytes());
        let hash = hasher.finalize();
        let mut result = [0u8; 32];
        result.copy_from_slice(&hash[..32]);
        Ok(result)
    }
    
    fn prefix_iter(&self, prefix: &[u8]) -> Box<dyn Iterator<Item = (Vec<u8>, Vec<u8>)> + '_> {
        use rocksdb::IteratorMode;
        
        let prefix = prefix.to_vec();
        let iter = self.db.iterator(IteratorMode::From(&prefix, rocksdb::Direction::Forward));
        
        Box::new(
            iter.take_while(move |result| {
                match result {
                    Ok((k, _)) => k.starts_with(&prefix),
                    Err(_) => false,
                }
            })
            .filter_map(|result| {
                result.ok().map(|(k, v)| (k.to_vec(), v.to_vec()))
            })
        )
    }
}

#[derive(Error, Debug)]
pub enum StorageError {
    #[error("Database error: {0}")]
    DatabaseError(String),
}
