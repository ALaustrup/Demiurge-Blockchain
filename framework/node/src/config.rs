//! Node configuration

use serde::{Deserialize, Serialize};
use std::net::SocketAddr;
use std::path::PathBuf;

/// Node configuration
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct NodeConfig {
    /// Data directory
    pub data_dir: PathBuf,
    
    /// RPC server address
    pub rpc_addr: SocketAddr,
    
    /// P2P network address
    pub p2p_addr: SocketAddr,
    
    /// Block time in milliseconds
    pub block_time_ms: u64,
    
    /// Enable RPC server
    pub enable_rpc: bool,
    
    /// Enable P2P networking
    pub enable_p2p: bool,
    
    /// Bootstrap peers
    pub bootstrap_peers: Vec<String>,
}

impl Default for NodeConfig {
    fn default() -> Self {
        Self {
            data_dir: PathBuf::from("./data"),
            rpc_addr: "127.0.0.1:9944".parse().unwrap(),
            p2p_addr: "0.0.0.0:30333".parse().unwrap(),
            block_time_ms: 1000,
            enable_rpc: true,
            enable_p2p: true,
            bootstrap_peers: vec![],
        }
    }
}
