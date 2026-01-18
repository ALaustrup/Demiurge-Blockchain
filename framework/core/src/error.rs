//! Error types

use std::string::String;
use thiserror::Error;

/// Result type
pub type Result<T> = std::result::Result<T, Error>;

/// Runtime errors
#[derive(Error, Debug)]
pub enum Error {
    #[error("Invalid transaction: {0}")]
    InvalidTransaction(String),

    #[error("Invalid block: {0}")]
    InvalidBlock(String),

    #[error("Module error: {0}")]
    ModuleError(String),

    #[error("Storage error: {0}")]
    StorageError(String),

    #[error("Insufficient balance")]
    InsufficientBalance,

    #[error("Invalid signature")]
    InvalidSignature,

    #[error("Invalid nonce")]
    InvalidNonce,
}
