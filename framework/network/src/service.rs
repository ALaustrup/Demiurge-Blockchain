//! Network service - Main networking component

use crate::{Result, NetworkError};
use demiurge_core::Block;
use libp2p::PeerId;
use std::collections::HashMap;
use std::net::SocketAddr;
use std::sync::Arc;
use tokio::sync::RwLock;
use tracing::{info, warn};

/// Network configuration
#[derive(Clone, Debug)]
pub struct NetworkConfig {
    /// Local address to listen on
    pub listen_addr: SocketAddr,
    
    /// Bootstrap peer addresses (format: "/ip4/x.x.x.x/tcp/30333/p2p/PeerId")
    pub bootstrap_peers: Vec<String>,
    
    /// Node identity (optional - will be generated if not provided)
    pub node_key: Option<[u8; 32]>,
}

impl Default for NetworkConfig {
    fn default() -> Self {
        Self {
            listen_addr: "0.0.0.0:30333".parse().unwrap(),
            bootstrap_peers: vec![],
            node_key: None,
        }
    }
}

/// Network service managing P2P connections
pub struct NetworkService {
    /// Configuration
    config: NetworkConfig,
    
    /// Connected peers
    peers: Arc<RwLock<HashMap<PeerId, PeerInfo>>>,
    
    /// Pending outbound blocks to broadcast
    pending_blocks: Arc<RwLock<Vec<Block>>>,
    
    /// Pending outbound transactions to broadcast
    pending_transactions: Arc<RwLock<Vec<demiurge_core::Transaction>>>,
    
    /// Running flag
    running: bool,
}

/// Peer information
#[derive(Clone, Debug)]
pub struct PeerInfo {
    pub peer_id: PeerId,
    pub address: String,
    pub connected: bool,
    pub last_seen: u64,
    pub block_height: u64,
}

impl NetworkService {
    /// Create a new network service with default config
    pub fn new() -> Result<Self> {
        Self::with_config(NetworkConfig::default())
    }
    
    /// Create a new network service with custom config
    pub fn with_config(config: NetworkConfig) -> Result<Self> {
        Ok(Self {
            config,
            peers: Arc::new(RwLock::new(HashMap::new())),
            pending_blocks: Arc::new(RwLock::new(Vec::new())),
            pending_transactions: Arc::new(RwLock::new(Vec::new())),
            running: false,
        })
    }

    /// Start the network service
    pub async fn start(&mut self) -> Result<()> {
        if self.running {
            return Err(NetworkError::ConnectionFailed("Already running".to_string()));
        }
        
        info!("Starting P2P network on {:?}", self.config.listen_addr);
        
        // Connect to bootstrap peers
        for peer_addr in &self.config.bootstrap_peers {
            info!("Connecting to bootstrap peer: {}", peer_addr);
            // Note: Full libp2p integration would go here
            // For now, we log and continue - actual connection requires swarm setup
        }
        
        self.running = true;
        info!("P2P network started");
        
        Ok(())
    }
    
    /// Stop the network service
    pub async fn stop(&mut self) -> Result<()> {
        if !self.running {
            return Ok(());
        }
        
        info!("Stopping P2P network...");
        self.running = false;
        
        // Clear peers
        self.peers.write().await.clear();
        
        info!("P2P network stopped");
        Ok(())
    }

    /// Broadcast a block to all peers
    pub async fn broadcast_block(&mut self, block: &Block) -> Result<()> {
        let peer_count = self.peer_count().await;
        
        if peer_count == 0 {
            // Queue block for later broadcast
            self.pending_blocks.write().await.push(block.clone());
            return Ok(());
        }
        
        info!("Broadcasting block {} to {} peers", block.header.block_number, peer_count);
        
        // In a full implementation, this would serialize the block and send to all peers
        // For now, we just log the action
        
        Ok(())
    }

    /// Broadcast a transaction to all peers
    pub async fn broadcast_transaction(&mut self, tx: &demiurge_core::Transaction) -> Result<()> {
        let peer_count = self.peer_count().await;
        
        if peer_count == 0 {
            // Queue transaction for later broadcast
            self.pending_transactions.write().await.push(tx.clone());
            return Ok(());
        }
        
        info!("Broadcasting transaction to {} peers", peer_count);
        
        Ok(())
    }

    /// Get connected peer count
    pub async fn peer_count(&self) -> usize {
        self.peers.read().await
            .values()
            .filter(|p| p.connected)
            .count()
    }

    /// Get peer information
    pub async fn get_peer(&self, peer_id: &PeerId) -> Option<PeerInfo> {
        self.peers.read().await.get(peer_id).cloned()
    }
    
    /// Get all connected peers
    pub async fn get_connected_peers(&self) -> Vec<PeerInfo> {
        self.peers.read().await
            .values()
            .filter(|p| p.connected)
            .cloned()
            .collect()
    }
    
    /// Add a peer manually (for testing or manual peer management)
    pub async fn add_peer(&mut self, peer_id: PeerId, address: String) -> Result<()> {
        let peer_info = PeerInfo {
            peer_id,
            address,
            connected: false,
            last_seen: 0,
            block_height: 0,
        };
        
        self.peers.write().await.insert(peer_id, peer_info);
        Ok(())
    }
    
    /// Mark a peer as connected
    pub async fn peer_connected(&mut self, peer_id: &PeerId) {
        if let Some(peer) = self.peers.write().await.get_mut(peer_id) {
            peer.connected = true;
            peer.last_seen = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs();
            info!("Peer connected: {}", peer_id);
        }
    }
    
    /// Mark a peer as disconnected
    pub async fn peer_disconnected(&mut self, peer_id: &PeerId) {
        if let Some(peer) = self.peers.write().await.get_mut(peer_id) {
            peer.connected = false;
            warn!("Peer disconnected: {}", peer_id);
        }
    }
    
    /// Is the network running?
    pub fn is_running(&self) -> bool {
        self.running
    }
}

impl Default for NetworkService {
    fn default() -> Self {
        Self::new().unwrap()
    }
}
