//! RPC server implementation

use crate::{RpcError, Result, RpcMethods};
use demiurge_storage::Storage;
use jsonrpsee::{
    server::{ServerBuilder, ServerHandle},
    RpcModule,
};
use std::net::SocketAddr;

/// RPC server
pub struct RpcServer {
    handle: Option<ServerHandle>,
    address: SocketAddr,
}

impl RpcServer {
    /// Create a new RPC server
    pub fn new(address: SocketAddr) -> Self {
        Self {
            handle: None,
            address,
        }
    }

    /// Start the RPC server
    pub async fn start(&mut self, methods: RpcMethods) -> Result<()> {
        let server = ServerBuilder::default()
            .build(self.address)
            .await
            .map_err(|e| RpcError::ServerError(e.to_string()))?;

        let mut module = RpcModule::new(());
        
        // Register methods
        self.register_methods(&mut module, methods)?;

        let handle = server.start(module);
        self.handle = Some(handle);

        Ok(())
    }

    /// Register RPC methods
    fn register_methods<S: Storage>(
        &self,
        module: &mut RpcModule<()>,
        methods: crate::RpcMethods<S>,
    ) -> Result<()> {
        // TODO: Register methods using jsonrpsee macros
        // For now, placeholder
        Ok(())
    }

    /// Stop the RPC server
    pub async fn stop(&mut self) -> Result<()> {
        if let Some(handle) = self.handle.take() {
            handle.stop().map_err(|e| RpcError::ServerError(e.to_string()))?;
        }
        Ok(())
    }
}
