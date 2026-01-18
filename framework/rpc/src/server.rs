//! RPC server implementation

use crate::{RpcError, Result, RpcMethods};
use demiurge_storage::Storage;
use jsonrpsee::{
    server::{ServerBuilder, ServerHandle},
    RpcModule,
    core::{RpcResult, Error as JsonRpcError},
    server::rpc_module::Extensions,
    Params,
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
        
        // Register methods
        self.register_methods(&mut module)?;

        let handle = server.start(module);
        self.handle = Some(handle);

        Ok(())
    }

    /// Register RPC methods
    fn register_methods(&self, module: &mut RpcModule<Arc<RpcMethods<S>>>) -> Result<()> {
        // Register get_balance method
        // jsonrpsee 0.20 uses register_async_method with (params, ctx, _ext) signature
        module.register_async_method("get_balance", |params: Params<'_>, ctx: Arc<RpcMethods<S>>, _ext: Extensions| {
            let ctx = ctx.clone();
            async move {
                // Parse account parameter - expect hex string
                let account_str: String = params.one()
                    .map_err(|e| JsonRpcError::invalid_params(&format!("Invalid account format: {}", e)))?;
                
                // Parse as hex string
                let account_bytes = if account_str.starts_with("0x") {
                    hex::decode(&account_str[2..])
                        .map_err(|e| JsonRpcError::invalid_params(&format!("Invalid hex: {}", e)))?
                } else {
                    hex::decode(&account_str)
                        .map_err(|e| JsonRpcError::invalid_params(&format!("Invalid hex: {}", e)))?
                };
                
                if account_bytes.len() != 32 {
                    return Err(JsonRpcError::invalid_params("Account must be 32 bytes"));
                }
                
                let mut account = [0u8; 32];
                account.copy_from_slice(&account_bytes);
                
                ctx.get_balance(account).await
                    .map_err(|e| JsonRpcError::internal_error(&format!("RPC error: {}", e)))
            }
        })?;
        
        // Register get_chain_info method
        module.register_async_method("get_chain_info", |_params: Params<'_>, ctx: Arc<RpcMethods<S>>, _ext: Extensions| {
            let ctx = ctx.clone();
            async move {
                ctx.get_chain_info().await
                    .map_err(|e| JsonRpcError::internal_error(&format!("RPC error: {}", e)))
            }
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
