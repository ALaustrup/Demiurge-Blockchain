//! Command-line interface definition.

use clap::Parser;
use sc_cli::{KeySubcommand, SignCmd, VanityCmd, VerifyCmd};

/// Demiurge Node CLI
#[derive(Debug, Parser)]
#[command(
    name = "demiurge-node",
    about = "Demiurge Blockchain Node - The Pleroma Network",
    version,
    author
)]
pub struct Cli {
    #[command(subcommand)]
    pub subcommand: Option<Subcommand>,

    #[command(flatten)]
    pub run: sc_cli::RunCmd,
}

/// Available subcommands
#[derive(Debug, clap::Subcommand)]
pub enum Subcommand {
    /// Build a chain specification
    BuildSpec(sc_cli::BuildSpecCmd),

    /// Validate blocks
    CheckBlock(sc_cli::CheckBlockCmd),

    /// Export blocks
    ExportBlocks(sc_cli::ExportBlocksCmd),

    /// Export the state of a given block
    ExportState(sc_cli::ExportStateCmd),

    /// Import blocks
    ImportBlocks(sc_cli::ImportBlocksCmd),

    /// Remove the whole chain
    PurgeChain(sc_cli::PurgeChainCmd),

    /// Revert the chain to a previous state
    Revert(sc_cli::RevertCmd),

    /// Key management commands
    #[command(subcommand)]
    Key(KeySubcommand),

    /// Sign a message
    Sign(SignCmd),

    /// Verify a signature
    Verify(VerifyCmd),

    /// Generate a vanity address
    Vanity(VanityCmd),

    /// Try some command against runtime state
    #[cfg(feature = "try-runtime")]
    TryRuntime(try_runtime_cli::TryRuntimeCmd),

    /// Run benchmarks
    #[cfg(feature = "runtime-benchmarks")]
    Benchmark(frame_benchmarking_cli::BenchmarkCmd),

    /// Inspect the state of a chain
    ChainInfo(sc_cli::ChainInfoCmd),
}
