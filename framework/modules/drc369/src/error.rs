//! DRC-369 module errors

use thiserror::Error;

/// Result type
pub type Result<T> = std::result::Result<T, Drc369Error>;

/// DRC-369 errors
#[derive(Error, Debug)]
pub enum Drc369Error {
    #[error("NFT not found")]
    NftNotFound,

    #[error("Not owner")]
    NotOwner,

    #[error("NFT is soulbound")]
    Soulbound,

    #[error("Invalid NFT ID")]
    InvalidNftId,

    #[error("Transfer failed: {0}")]
    TransferFailed(String),

    #[error("State update failed: {0}")]
    StateUpdateFailed(String),
}
