//! # Demiurge Node
//!
//! The Substrate-based blockchain node for the Demiurge Ecosystem.
//!
//! ## Features
//!
//! - Aura consensus for block production
//! - GRANDPA consensus for finality
//! - CGT native token support
//! - Qor ID identity integration
//!
//! ## Usage
//!
//! ```bash
//! # Development mode (single node)
//! demiurge-node --dev
//!
//! # Production with custom chain spec
//! demiurge-node --chain demiurge-mainnet --validator
//! ```

mod chain_spec;
mod cli;
mod command;
mod rpc;
mod service;

fn main() -> Result<(), sc_cli::Error> {
    command::run()
}
