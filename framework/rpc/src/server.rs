//! RPC server implementation

use crate::{RpcError, Result, RpcMethods};
use demiurge_storage::Storage;
use jsonrpsee::{
    server::{ServerBuilder, ServerHandle},
    RpcModule,
};
use std::net::SocketAddr;
use std::sync::Arc;

/// RPC server
pub struct RpcServer<S: Storage> {
    handle: Option<ServerHandle>,
    address: SocketAddr,
    _methods: Option<Arc<RpcMethods<S>>>,
}

impl<S: Storage + Send + Sync + 'static> RpcServer<S> {
    /// Create a new RPC server
    pub fn new(address: SocketAddr) -> Self {
        Self {
            handle: None,
            address,
            _methods: None,
        }
    }

    /// Start the RPC server
    pub async fn start(&mut self, methods: Arc<RpcMethods<S>>) -> Result<()> {
        let methods_clone = methods.clone();
        self._methods = Some(methods);
        
        let server = ServerBuilder::default()
            .build(self.address)
            .await
            .map_err(|e| RpcError::ServerError(e.to_string()))?;

        let mut module = RpcModule::new(methods_clone);
        
        // TODO: RPC method registration with jsonrpsee 0.20
        // The API is complex and requires proper error type conversions
        // For now, methods are implemented in RpcMethods and can be called directly
        // Full registration will be completed when jsonrpsee API is fully understood
        
        let handle = server.start(module);
        self.handle = Some(handle);

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
