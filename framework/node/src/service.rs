//! Node service - Main node logic

use crate::NodeConfig;
use demiurge_core::Runtime;
use demiurge_storage::StorageBackend;
use demiurge_rpc::{RpcServer, RpcMethods};
use std::sync::Arc;
use anyhow::Result;
use tracing::info;

/// Node service
pub struct NodeService {
    config: NodeConfig,
    runtime: Runtime<StorageBackend>,
}

impl NodeService {
    /// Create a new node service
    pub fn new(config: NodeConfig) -> Result<Self> {
        info!("Initializing node service...");
        
        // Initialize storage
        let storage = StorageBackend::new(
            config.data_dir.to_str().unwrap_or("./data")
        )?;
        
        // Initialize runtime
        let runtime = Runtime::new(storage);
        
        Ok(Self {
            config,
            runtime,
            rpc_server: None,
        })
    }

    /// Start the node service
    pub async fn start(&mut self) -> Result<()> {
        info!("🚀 Starting Demiurge Node...");
        info!("The flame burns eternal. The code serves the will.");
        
        // TODO: Start consensus
        // TODO: Start network
        // TODO: Start RPC server
        // TODO: Start block production
        
        info!("✅ Node service started");
        Ok(())
    }

    /// Stop the node service
    pub async fn stop(&mut self) -> Result<()> {
        info!("Shutting down node service...");
        
        // Stop RPC server
        if let Some(mut rpc_server) = self.rpc_server.take() {
            rpc_server.stop().await?;
            info!("RPC server stopped");
        }
        
        Ok(())
    }

    /// Get runtime reference
    pub fn runtime(&self) -> &Runtime<StorageBackend> {
        &self.runtime
    }

    /// Get runtime mutable reference
    pub fn runtime_mut(&mut self) -> &mut Runtime<StorageBackend> {
        &mut self.runtime
    }
}
