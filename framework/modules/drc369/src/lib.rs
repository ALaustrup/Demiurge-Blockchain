//! # DRC-369 Module
//!
//! Stateful NFT Standard - NFTs that evolve, gain XP, and level up.
//! Multi-resource support, soulbound capability, composable.


pub mod nft;
pub mod error;

pub use nft::{Drc369Module, NftCall, NftState};
pub use error::{Drc369Error, Result};
