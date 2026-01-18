//! # Energy Module
//!
//! Regenerating transaction costs - Feeless UX for users

#![cfg_attr(not(feature = "std"), no_std)]

pub mod energy;
pub mod error;

pub use energy::{EnergyModule, EnergyCall};
pub use error::{EnergyError, Result};
