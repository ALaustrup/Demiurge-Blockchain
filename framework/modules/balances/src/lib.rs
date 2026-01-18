//! # Balances Module
//!
//! CGT token management - The Creator God Token.
//! 100 Sparks = 1 CGT

#![cfg_attr(not(feature = "std"), no_std)]

pub mod balances;
pub mod error;

pub use balances::{BalancesModule, BalanceCall, constants};
pub use error::{BalancesError, Result};
