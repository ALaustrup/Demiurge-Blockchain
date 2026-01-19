//! RPC server implementation

use crate::{RpcError, Result, RpcMethods};
use crate::error::{invalid_params, method_not_found};
use demiurge_storage::Storage;
use jsonrpsee::{
    server::{ServerBuilder, ServerHandle},
    RpcModule,
    core::Error as JsonRpcError,
};
use std::net::SocketAddr;
use std::sync::Arc;
use hex;

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
        
        // Register chain methods
        Self::register_chain_methods(&mut module)?;
        
        // Register balance methods
        Self::register_balance_methods(&mut module)?;
        
        // Register consensus methods
        Self::register_consensus_methods(&mut module)?;
        
        // Register energy methods
        Self::register_energy_methods(&mut module)?;
        
        // Register session keys methods
        Self::register_session_keys_methods(&mut module)?;
        
        let handle = server.start(module);
        self.handle = Some(handle);

        Ok(())
    }

    /// Register chain RPC methods
    fn register_chain_methods(module: &mut RpcModule<Arc<RpcMethods<S>>>) -> Result<()> {
        // chain_getHealth
        module.register_async_method("chain_getHealth", |_params, ctx, _exts| {
            let ctx = ctx.clone();
            async move {
                ctx.chain_get_health().await
                    .map_err(|e| JsonRpcError::from(e))
            }
        }).map_err(|e| RpcError::ServerError(format!("Failed to register chain_getHealth: {}", e)))?;

        // chain_getBlockNumber
        module.register_async_method("chain_getBlockNumber", |_params, ctx, _exts| {
            let ctx = ctx.clone();
            async move {
                ctx.chain_get_block_number().await
                    .map_err(|e| JsonRpcError::from(e))
            }
        }).map_err(|e| RpcError::ServerError(format!("Failed to register chain_getBlockNumber: {}", e)))?;

        // chain_getBlock
        module.register_async_method("chain_getBlock", |params, ctx, _exts| {
            let ctx = ctx.clone();
            async move {
                let block_number: u64 = params.one().map_err(|e| RpcError::invalid_params(&format!("Invalid block number: {}", e)))?;
                ctx.chain_get_block_by_number(block_number).await
                    .map_err(|e| JsonRpcError::from(e))
            }
        }).map_err(|e| RpcError::ServerError(format!("Failed to register chain_getBlock: {}", e)))?;

        // chain_getLatestBlock
        module.register_async_method("chain_getLatestBlock", |_params, ctx, _exts| {
            let ctx = ctx.clone();
            async move {
                ctx.chain_get_latest_block().await
                    .map_err(|e| JsonRpcError::from(e))
            }
        }).map_err(|e| RpcError::ServerError(format!("Failed to register chain_getLatestBlock: {}", e)))?;

        // chain_getTransaction
        module.register_async_method("chain_getTransaction", |params, ctx, _exts| {
            let ctx = ctx.clone();
            async move {
                let hash_str: String = params.one().map_err(|e| RpcError::invalid_params(&format!("Invalid hash: {}", e)))?;
                let hash = hex::decode(hash_str)
                    .map_err(|e| RpcError::invalid_params(&format!("Invalid hash hex: {}", e)))?
                    .try_into()
                    .map_err(|_| RpcError::invalid_params("Hash must be 32 bytes"))?;
                ctx.chain_get_transaction(hash).await
                    .map_err(|e| JsonRpcError::from(e))
            }
        }).map_err(|e| RpcError::ServerError(format!("Failed to register chain_getTransaction: {}", e)))?;

        // chain_getTransactionHistory
        module.register_async_method("chain_getTransactionHistory", |params, ctx, _exts| {
            let ctx = ctx.clone();
            async move {
                let (address_str, limit): (String, Option<u64>) = params.parse().map_err(|e| RpcError::invalid_params(&format!("Invalid params: {}", e)))?;
                let address = hex::decode(address_str)
                    .map_err(|e| RpcError::invalid_params(&format!("Invalid address hex: {}", e)))?
                    .try_into()
                    .map_err(|_| RpcError::invalid_params("Address must be 32 bytes"))?;
                let limit = limit.unwrap_or(50);
                ctx.chain_get_transaction_history(address, limit).await
                    .map_err(|e| JsonRpcError::from(e))
            }
        }).map_err(|e| RpcError::ServerError(format!("Failed to register chain_getTransactionHistory: {}", e)))?;

        Ok(())
    }

    /// Register balance RPC methods
    fn register_balance_methods(module: &mut RpcModule<Arc<RpcMethods<S>>>) -> Result<()> {
        // balances_getBalance
        module.register_async_method("balances_getBalance", |params, ctx, _exts| {
            let ctx = ctx.clone();
            async move {
                let address_str: String = params.one().map_err(|e| RpcError::invalid_params(&format!("Invalid address: {}", e)))?;
                let address = hex::decode(address_str)
                    .map_err(|e| RpcError::invalid_params(&format!("Invalid address hex: {}", e)))?
                    .try_into()
                    .map_err(|_| RpcError::invalid_params("Address must be 32 bytes"))?;
                ctx.balances_get_balance(address).await
                    .map_err(|e| JsonRpcError::from(e))
            }
        }).map_err(|e| RpcError::ServerError(format!("Failed to register balances_getBalance: {}", e)))?;

        // balances_transfer (placeholder - requires transaction signing)
        module.register_async_method("balances_transfer", |_params, _ctx, _exts| {
            async move {
                Err::<String, _>(method_not_found())
            }
        }).map_err(|e| RpcError::ServerError(format!("Failed to register balances_transfer: {}", e)))?;

        Ok(())
    }

    /// Register consensus RPC methods
    fn register_consensus_methods(module: &mut RpcModule<Arc<RpcMethods<S>>>) -> Result<()> {
        // consensus_getCurrentEra
        module.register_async_method("consensus_getCurrentEra", |_params, ctx, _exts| {
            let ctx = ctx.clone();
            async move {
                ctx.consensus_get_current_era().await
                    .map_err(|e| JsonRpcError::from(e))
            }
        }).map_err(|e| RpcError::ServerError(format!("Failed to register consensus_getCurrentEra: {}", e)))?;

        // consensus_getValidators
        module.register_async_method("consensus_getValidators", |_params, ctx, _exts| {
            let ctx = ctx.clone();
            async move {
                ctx.consensus_get_validators().await
                    .map_err(|e| JsonRpcError::from(e))
            }
        }).map_err(|e| RpcError::ServerError(format!("Failed to register consensus_getValidators: {}", e)))?;

        // consensus_getValidator
        module.register_async_method("consensus_getValidator", |params, ctx, _exts| {
            let ctx = ctx.clone();
            async move {
                let account_str: String = params.one().map_err(|e| RpcError::invalid_params(&format!("Invalid account: {}", e)))?;
                let account = hex::decode(account_str)
                    .map_err(|e| RpcError::invalid_params(&format!("Invalid account hex: {}", e)))?
                    .try_into()
                    .map_err(|_| RpcError::invalid_params("Account must be 32 bytes"))?;
                ctx.consensus_get_validator(account).await
                    .map_err(|e| JsonRpcError::from(e))
            }
        }).map_err(|e| RpcError::ServerError(format!("Failed to register consensus_getValidator: {}", e)))?;

        // consensus_getStakingPool
        module.register_async_method("consensus_getStakingPool", |params, ctx, _exts| {
            let ctx = ctx.clone();
            async move {
                let validator_str: String = params.one().map_err(|e| RpcError::invalid_params(&format!("Invalid validator: {}", e)))?;
                let validator = hex::decode(validator_str)
                    .map_err(|e| RpcError::invalid_params(&format!("Invalid validator hex: {}", e)))?
                    .try_into()
                    .map_err(|_| RpcError::invalid_params("Validator must be 32 bytes"))?;
                ctx.consensus_get_staking_pool(validator).await
                    .map_err(|e| JsonRpcError::from(e))
            }
        }).map_err(|e| RpcError::ServerError(format!("Failed to register consensus_getStakingPool: {}", e)))?;

        // consensus_getStatus
        module.register_async_method("consensus_getStatus", |_params, ctx, _exts| {
            let ctx = ctx.clone();
            async move {
                ctx.consensus_get_status().await
                    .map_err(|e| JsonRpcError::from(e))
            }
        }).map_err(|e| RpcError::ServerError(format!("Failed to register consensus_getStatus: {}", e)))?;

        Ok(())
    }

    /// Register energy RPC methods
    fn register_energy_methods(module: &mut RpcModule<Arc<RpcMethods<S>>>) -> Result<()> {
        // energy_getEnergy
        module.register_async_method("energy_getEnergy", |params, ctx, _exts| {
            let ctx = ctx.clone();
            async move {
                let address_str: String = params.one().map_err(|e| RpcError::invalid_params(&format!("Invalid address: {}", e)))?;
                let address = hex::decode(address_str)
                    .map_err(|e| RpcError::invalid_params(&format!("Invalid address hex: {}", e)))?
                    .try_into()
                    .map_err(|_| RpcError::invalid_params("Address must be 32 bytes"))?;
                ctx.energy_get_energy(address).await
                    .map_err(|e| JsonRpcError::from(e))
            }
        }).map_err(|e| RpcError::ServerError(format!("Failed to register energy_getEnergy: {}", e)))?;

        Ok(())
    }

    /// Register session keys RPC methods
    fn register_session_keys_methods(module: &mut RpcModule<Arc<RpcMethods<S>>>) -> Result<()> {
        // sessionKeys_getActiveKeys
        module.register_async_method("sessionKeys_getActiveKeys", |params, ctx, _exts| {
            let ctx = ctx.clone();
            async move {
                let address_str: String = params.one().map_err(|e| RpcError::invalid_params(&format!("Invalid address: {}", e)))?;
                let address = hex::decode(address_str)
                    .map_err(|e| RpcError::invalid_params(&format!("Invalid address hex: {}", e)))?
                    .try_into()
                    .map_err(|_| RpcError::invalid_params("Address must be 32 bytes"))?;
                ctx.session_keys_get_active_keys(address).await
                    .map_err(|e| JsonRpcError::from(e))
            }
        }).map_err(|e| RpcError::ServerError(format!("Failed to register sessionKeys_getActiveKeys: {}", e)))?;

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
