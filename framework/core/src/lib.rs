//! # Demiurge Core Runtime Engine
//!
//! The heart of our blockchain. No Substrate bullshit. Just clean, fast execution.

#![cfg_attr(not(feature = "std"), no_std)]

pub mod runtime;
pub mod transaction;
pub mod block;
pub mod error;

pub use runtime::Runtime;
pub use transaction::{Transaction, TransactionData};
pub use block::{Block, BlockHeader};
pub use error::{Error, Result};
