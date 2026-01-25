//! # Demiurge Node
//!
//! The full node implementation - ties everything together.
//! The flame burns eternal. The code serves the will.

use clap::{Parser, Subcommand};
use demiurge_node::{NodeConfig, NodeService};
use ed25519_dalek::{SigningKey, VerifyingKey};
use tracing::info;

/// Demiurge Blockchain Node
#[derive(Parser, Debug)]
#[command(name = "demiurge-node")]
#[command(about = "Demiurge Blockchain Full Node", long_about = None)]
struct Args {
    #[command(subcommand)]
    command: Option<Commands>,

    /// Data directory
    #[arg(short, long, default_value = "./data")]
    data_dir: String,

    /// RPC address (use 0.0.0.0:9944 for external access)
    #[arg(short, long, default_value = "0.0.0.0:9944")]
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

#[derive(Subcommand, Debug)]
enum Commands {
    /// Generate a new validator key pair
    GenerateKey {
        /// Output file for the private key (default: stdout as JSON)
        #[arg(short, long)]
        output: Option<String>,
    },
    /// Show key info from a key file
    ShowKey {
        /// Key file path
        #[arg(short, long)]
        file: String,
    },
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let args = Args::parse();

    // Handle subcommands
    if let Some(command) = args.command {
        return match command {
            Commands::GenerateKey { output } => generate_key(output),
            Commands::ShowKey { file } => show_key(&file),
        };
    }

    // Initialize tracing for node mode
    tracing_subscriber::fmt::init();

    info!("🔥 Demiurge Node Starting...");
    info!("The flame burns eternal. The code serves the will.");

    // Create node configuration
    let data_dir = args.data_dir.clone();
    let config = NodeConfig {
        data_dir: data_dir.clone().into(),
        rpc_addr: args.rpc_addr.parse()
            .map_err(|e| anyhow::anyhow!("Invalid RPC address: {}", e))?,
        p2p_addr: args.p2p_addr.parse()
            .map_err(|e| anyhow::anyhow!("Invalid P2P address: {}", e))?,
        block_time_ms: args.block_time,
        enable_rpc: args.rpc,
        enable_p2p: args.p2p,
        bootstrap_peers: vec![],
        genesis_file: None,
        validator_key_file: None,
    };

    // Create and start node service
    let mut node = NodeService::new(config)?;
    node.start().await?;

    info!("🚀 Demiurge Node is running!");
    info!("RPC: {}", args.rpc_addr);
    info!("P2P: {}", args.p2p_addr);
    info!("Block time: {}ms", args.block_time);
    info!("Data directory: {}", data_dir);

    // Main event loop - keep running until Ctrl+C
    info!("Entering main event loop...");
    tokio::signal::ctrl_c().await?;
    
    info!("Shutting down...");
    node.stop().await?;
    info!("✅ Node stopped gracefully");
    
    Ok(())
}

/// Generate a new Ed25519 validator key pair
fn generate_key(output: Option<String>) -> anyhow::Result<()> {
    use rand::rngs::OsRng;
    
    // Generate key pair
    let signing_key = SigningKey::generate(&mut OsRng);
    let verifying_key: VerifyingKey = (&signing_key).into();
    
    // Create key JSON
    let key_json = serde_json::json!({
        "private_key": hex::encode(signing_key.to_bytes()),
        "public_key": hex::encode(verifying_key.to_bytes()),
        "address": hex::encode(verifying_key.to_bytes()),
        "key_type": "ed25519",
        "version": 1
    });
    
    let key_str = serde_json::to_string_pretty(&key_json)?;
    
    match output {
        Some(path) => {
            std::fs::write(&path, &key_str)?;
            eprintln!("✅ Validator key saved to: {}", path);
            eprintln!("Public key (address): {}", hex::encode(verifying_key.to_bytes()));
        }
        None => {
            println!("{}", key_str);
        }
    }
    
    Ok(())
}

/// Show key info from a key file
fn show_key(file: &str) -> anyhow::Result<()> {
    let contents = std::fs::read_to_string(file)?;
    let key: serde_json::Value = serde_json::from_str(&contents)?;
    
    println!("Key File: {}", file);
    println!("Key Type: {}", key.get("key_type").and_then(|v| v.as_str()).unwrap_or("unknown"));
    println!("Public Key: {}", key.get("public_key").and_then(|v| v.as_str()).unwrap_or("unknown"));
    println!("Address: {}", key.get("address").and_then(|v| v.as_str()).unwrap_or("unknown"));
    
    Ok(())
}
