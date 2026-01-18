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
pub struct RpcServer {
    handle: Option<ServerHandle>,
    address: SocketAddr,
}

impl<S: Storage> RpcServer<S> {
    /// Create a new RPC server
    pub fn new(address: SocketAddr) -> Self {
        Self {
            handle: None,
            address,
            methods: None,
        }
    }

    /// Start the RPC server
    pub async fn start(&mut self, methods: Arc<RpcMethods<S>>) -> Result<()> {
        let methods_clone = methods.clone();
        self.methods = Some(methods);
        
        let server = ServerBuilder::default()
            .build(self.address)
            .await
            .map_err(|e| RpcError::ServerError(e.to_string()))?;

        let mut module = RpcModule::new(methods_clone);
        
        // Register methods
        self.register_methods(&mut module)?;

        let handle = server.start(module);
        self.handle = Some(handle);

        Ok(())
    }

    /// Register RPC methods
    fn register_methods(&self, module: &mut RpcModule<Arc<RpcMethods<S>>>) -> Result<()> {
        // Register get_balance method
        module.register_method("get_balance", |params, ctx| async move {
            // Parse account parameter (32 bytes as hex string or array)
            let account_bytes: Vec<u8> = params.parse()?;
            if account_bytes.len() != 32 {
                return Err(jsonrpsee::core::Error::invalid_params("Account must be 32 bytes"));
            }
            let mut account = [0u8; 32];
            account.copy_from_slice(&account_bytes);
            
            ctx.get_balance(account).await
                .map_err(|e| jsonrpsee::core::Error::from(jsonrpsee::types::error::INTERNAL_ERROR))
        })?;
        
        // Register get_chain_info method
        module.register_method("get_chain_info", |_params, ctx| async move {
            ctx.get_chain_info().await
                .map_err(|e| jsonrpsee::core::Error::from(jsonrpsee::types::error::INTERNAL_ERROR))
        })?;
        
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
    }
        Ok(())
    }
}
