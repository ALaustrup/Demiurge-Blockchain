//! RPC server implementation

use crate::{RpcError, Result, RpcMethods};
use demiurge_storage::Storage;
use jsonrpsee::{
    server::{ServerBuilder, ServerHandle},
    RpcModule,
    core::RpcResult,
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
        // jsonrpsee 0.20 uses register_async_method with (params, ctx) signature
        module.register_async_method("get_balance", |params, ctx| {
            let ctx = ctx.clone();
            async move {
                // Parse account parameter - expect hex string
                let account_str: String = params.one()
                    .map_err(|e| jsonrpsee::core::Error::Call(jsonrpsee::types::error::CallError::InvalidParams(e.into())))?;
                
                // Parse as hex string
                let account_bytes = if account_str.starts_with("0x") {
                    hex::decode(&account_str[2..])
                        .map_err(|e| jsonrpsee::core::Error::Call(jsonrpsee::types::error::CallError::InvalidParams(format!("Invalid hex: {}", e).into())))?
                } else {
                    hex::decode(&account_str)
                        .map_err(|e| jsonrpsee::core::Error::Call(jsonrpsee::types::error::CallError::InvalidParams(format!("Invalid hex: {}", e).into())))?
                };
                
                if account_bytes.len() != 32 {
                    return Err(jsonrpsee::core::Error::Call(jsonrpsee::types::error::CallError::InvalidParams("Account must be 32 bytes".into())));
                }
                
                let mut account = [0u8; 32];
                account.copy_from_slice(&account_bytes);
                
                match ctx.get_balance(account).await {
                    Ok(balance) => Ok(balance),
                    Err(e) => Err(jsonrpsee::core::Error::Call(jsonrpsee::types::error::CallError::Failed(e.to_string().into()))),
                }
            }
        })?;
        
        // Register get_chain_info method
        module.register_async_method("get_chain_info", |_params, ctx| {
            let ctx = ctx.clone();
            async move {
                match ctx.get_chain_info().await {
                    Ok(info) => Ok(info),
                    Err(e) => Err(jsonrpsee::core::Error::Call(jsonrpsee::types::error::CallError::Failed(e.to_string().into()))),
                }
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
