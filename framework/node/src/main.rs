//! # Demiurge Node
//!
//! The full node implementation - ties everything together.
//! The flame burns eternal. The code serves the will.

use clap::Parser;
use demiurge_node::{NodeConfig, NodeService};
use tracing::info;

/// Demiurge Blockchain Node
#[derive(Parser, Debug)]
#[command(name = "demiurge-node")]
#[command(about = "Demiurge Blockchain Full Node", long_about = None)]
struct Args {
    /// Data directory
    #[arg(short, long, default_value = "./data")]
    data_dir: String,

    /// RPC address
    #[arg(short, long, default_value = "127.0.0.1:9944")]
    rpc_addr: String,

    /// P2P address
    #[arg(short, long, default_value = "0.0.0.0:30333")]
    p2p_addr: String,

    /// Block time in milliseconds
    #[arg(short, long, default_value = "1000")]
    block_time: u64,

    /// Enable RPC server
    #[arg(long, default_value = "true")]
    rpc: bool,

    /// Enable P2P networking
    #[arg(long, default_value = "true")]
    p2p: bool,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Initialize tracing
    tracing_subscriber::fmt::init();

    let args = Args::parse();

    info!("🔥 Demiurge Node Starting...");
    info!("The flame burns eternal. The code serves the will.");

    // Create node configuration
    let config = NodeConfig {
        data_dir: args.data_dir.into(),
        rpc_addr: args.rpc_addr.parse()
            .map_err(|e| anyhow::anyhow!("Invalid RPC address: {}", e))?,
        p2p_addr: args.p2p_addr.parse()
            .map_err(|e| anyhow::anyhow!("Invalid P2P address: {}", e))?,
        block_time_ms: args.block_time,
        enable_rpc: args.rpc,
        enable_p2p: args.p2p,
        bootstrap_peers: vec![],
    };

    // Create and start node service
    let mut node = NodeService::new(config)?;
    node.start().await?;

    info!("🚀 Demiurge Node is running!");
    info!("RPC: {}", args.rpc_addr);
    info!("P2P: {}", args.p2p_addr);
    info!("Block time: {}ms", args.block_time);
    info!("Data directory: {}", args.data_dir);

    // Main event loop - keep running until Ctrl+C
    info!("Entering main event loop...");
    tokio::signal::ctrl_c().await?;
    
    info!("Shutting down...");
    node.stop().await?;
    info!("✅ Node stopped gracefully");
    
    Ok(())
}
