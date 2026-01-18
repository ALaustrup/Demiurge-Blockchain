//! Balances module errors

use thiserror::Error;

/// Result type
pub type Result<T> = std::result::Result<T, BalancesError>;

/// Balances errors
#[derive(Error, Debug)]
pub enum BalancesError {
    #[error("Insufficient balance")]
    InsufficientBalance,

    #[error("Account not found")]
    AccountNotFound,

    #[error("Invalid amount")]
    InvalidAmount,

    #[error("Transfer failed: {0}")]
    TransferFailed(String),

    #[error("Mint failed: {0}")]
    MintFailed(String),

    #[error("Burn failed: {0}")]
    BurnFailed(String),
}
