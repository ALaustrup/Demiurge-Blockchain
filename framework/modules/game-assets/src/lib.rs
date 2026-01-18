//! # Game Assets Module
//!
//! Multi-asset system for games - Feeless transfers, developer controls

#![cfg_attr(not(feature = "std"), no_std)]

pub mod assets;
pub mod error;

pub use assets::{GameAssetsModule, AssetCall};
pub use error::{GameAssetsError, Result};
