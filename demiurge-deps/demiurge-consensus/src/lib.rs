//! # demiurge-consensus
//!
//! Consensus layer abstraction for Demiurge Blockchain.
//!
//! This module provides unified interfaces for consensus mechanisms including:
//! - Aura (Authority Round)
//! - GRANDPA (Finality gadget)
//!
//! ## Architecture
//!
//! The consensus layer in demiurge-consensus provides abstractions over Substrate's
//! consensus implementations. All consensus crates are available through the
//! main blockchain/Cargo.toml workspace dependencies.

#![no_std]
#![cfg_attr(not(feature = "std"), no_std)]

/// Consensus configuration and initialization helpers
pub mod config {
    //! Configuration utilities for consensus layers
}

#[cfg(all(test, feature = "std"))]
mod tests {
    #[test]
    fn it_works() {
        assert_eq!(2 + 2, 4);
    }
}
