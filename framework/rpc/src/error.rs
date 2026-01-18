//! RPC errors

use thiserror::Error;
use jsonrpsee::core::Error as JsonRpcError;

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

    #[error("Not found: {0}")]
    NotFound(String),
}

impl From<RpcError> for JsonRpcError {
    fn from(err: RpcError) -> Self {
        match err {
            RpcError::MethodNotFound => JsonRpcError::method_not_found(),
            RpcError::InvalidParams => JsonRpcError::invalid_params("Invalid parameters"),
            RpcError::NotImplemented => JsonRpcError::method_not_found(),
            RpcError::NotFound(msg) => JsonRpcError::invalid_params(&msg),
            RpcError::ServerError(msg) | RpcError::InternalError(msg) | RpcError::StorageError(msg) | RpcError::SubscriptionError(msg) => {
                JsonRpcError::internal_error(&msg)
            }
        }
    }
}
