//! RPC errors

use thiserror::Error;

/// Result type
pub type Result<T> = std::result::Result<T, RpcError>;

/// RPC errors
#[derive(Error, Debug)]
pub enum RpcError {
    #[error("Server error: {0}")]
    ServerError(String),

    #[error("Method not found")]
    MethodNotFound,

    #[error("Invalid parameters")]
    InvalidParams,

    #[error("Internal error: {0}")]
    InternalError(String),

    #[error("Not implemented")]
    NotImplemented,

    #[error("Subscription error: {0}")]
    SubscriptionError(String),

    #[error("Storage error: {0}")]
    StorageError(String),
}
