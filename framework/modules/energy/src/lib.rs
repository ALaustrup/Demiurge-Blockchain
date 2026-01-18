//! # Energy Module
//!
//! Regenerating transaction costs - Feeless UX for users


pub mod energy;
pub mod error;

pub use energy::{EnergyModule, EnergyCall};
pub use error::{EnergyError, Result};
