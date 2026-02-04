//! RPC server implementation

use crate::{RpcError, Result, RpcMethods};
use crate::error::{invalid_params, method_not_found};
use demiurge_storage::Storage;
use jsonrpsee::{
    server::{ServerBuilder, ServerHandle},
    RpcModule,
    types::ErrorObjectOwned,
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
        
        // Register DRC-369 NFT methods
        Self::register_drc369_methods(&mut module)?;
        
        // Configure server to support both HTTP and WebSocket
        // ServerBuilder::default() should support both, but we ensure HTTP is enabled
        // This allows curl (HTTP POST) for testing AND WebSocket for UI clients
        let server = ServerBuilder::default()
            .build(self.address)
            .await
            .map_err(|e| RpcError::ServerError(format!("Failed to build RPC server: {}", e)))?;
        
        // Start the server - start() returns ServerHandle directly
        // The server runs in the background automatically
        let handle = server.start(module);
        self.handle = Some(handle);

        Ok(())
    }

    /// Register chain RPC methods
    fn register_chain_methods(module: &mut RpcModule<Arc<RpcMethods<S>>>) -> Result<()> {
        // chain_getHealth
        module.register_async_method("chain_getHealth", |_params, ctx| async move {
            ctx.chain_get_health().await
                .map_err(|e: RpcError| ErrorObjectOwned::from(e))
        }).map_err(|e| RpcError::ServerError(format!("Failed to register chain_getHealth: {}", e)))?;

        // chain_getBlockNumber
        module.register_async_method("chain_getBlockNumber", |_params, ctx| async move {
            ctx.chain_get_block_number().await
                .map_err(|e: RpcError| ErrorObjectOwned::from(e))
        }).map_err(|e| RpcError::ServerError(format!("Failed to register chain_getBlockNumber: {}", e)))?;

        // chain_getBlock
        module.register_async_method("chain_getBlock", |params, ctx| async move {
            let block_number: u64 = params.one().map_err(|_| -> ErrorObjectOwned { invalid_params("Invalid block number") })?;
            ctx.chain_get_block_by_number(block_number).await
                .map_err(|e: RpcError| ErrorObjectOwned::from(e))
        }).map_err(|e| RpcError::ServerError(format!("Failed to register chain_getBlock: {}", e)))?;

        // chain_getLatestBlock
        module.register_async_method("chain_getLatestBlock", |_params, ctx| async move {
            ctx.chain_get_latest_block().await
                .map_err(|e: RpcError| ErrorObjectOwned::from(e))
        }).map_err(|e| RpcError::ServerError(format!("Failed to register chain_getLatestBlock: {}", e)))?;

        // chain_getTransaction
        module.register_async_method("chain_getTransaction", |params, ctx| async move {
            let hash_str: String = params.one().map_err(|_| -> ErrorObjectOwned { invalid_params("Invalid hash") })?;
            let hash = hex::decode(hash_str)
                .map_err(|_| -> ErrorObjectOwned { invalid_params("Invalid hash hex") })?
                .try_into()
                .map_err(|_| -> ErrorObjectOwned { invalid_params("Hash must be 32 bytes") })?;
            ctx.chain_get_transaction(hash).await
                .map_err(|e: RpcError| ErrorObjectOwned::from(e))
        }).map_err(|e| RpcError::ServerError(format!("Failed to register chain_getTransaction: {}", e)))?;

        // chain_getTransactionHistory
        module.register_async_method("chain_getTransactionHistory", |params, ctx| async move {
            let (address_str, limit): (String, Option<u64>) = params.parse().map_err(|_| -> ErrorObjectOwned { invalid_params("Invalid params") })?;
            let address = hex::decode(address_str)
                .map_err(|_| -> ErrorObjectOwned { invalid_params("Invalid address hex") })?
                .try_into()
                .map_err(|_| -> ErrorObjectOwned { invalid_params("Address must be 32 bytes") })?;
            let limit = limit.unwrap_or(50);
            ctx.chain_get_transaction_history(address, limit).await
                .map_err(|e: RpcError| ErrorObjectOwned::from(e))
        }).map_err(|e| RpcError::ServerError(format!("Failed to register chain_getTransactionHistory: {}", e)))?;

        Ok(())
    }

    /// Register balance RPC methods
    fn register_balance_methods(module: &mut RpcModule<Arc<RpcMethods<S>>>) -> Result<()> {
        // balances_getBalance
        module.register_async_method("balances_getBalance", |params, ctx| async move {
            let address_str: String = params.one().map_err(|_| -> ErrorObjectOwned { invalid_params("Invalid address") })?;
            let address = hex::decode(address_str)
                .map_err(|_| -> ErrorObjectOwned { invalid_params("Invalid address hex") })?
                .try_into()
                .map_err(|_| -> ErrorObjectOwned { invalid_params("Address must be 32 bytes") })?;
            ctx.balances_get_balance(address).await
                .map_err(|e: RpcError| ErrorObjectOwned::from(e))
        }).map_err(|e| RpcError::ServerError(format!("Failed to register balances_getBalance: {}", e)))?;

        // balances_transfer - Transfer tokens between accounts
        module.register_async_method("balances_transfer", |params, ctx| async move {
            let (from_str, to_str, amount, signature): (String, String, String, String) = params.parse()
                .map_err(|_| -> ErrorObjectOwned { invalid_params("Expected: [from_hex, to_hex, amount, signature]") })?;
            
            let from: [u8; 32] = hex::decode(&from_str)
                .map_err(|_| -> ErrorObjectOwned { invalid_params("Invalid from address hex") })?
                .try_into()
                .map_err(|_| -> ErrorObjectOwned { invalid_params("From address must be 32 bytes") })?;
            
            let to: [u8; 32] = hex::decode(&to_str)
                .map_err(|_| -> ErrorObjectOwned { invalid_params("Invalid to address hex") })?
                .try_into()
                .map_err(|_| -> ErrorObjectOwned { invalid_params("To address must be 32 bytes") })?;
            
            ctx.balances_transfer(from, to, amount, signature).await
                .map_err(|e: RpcError| ErrorObjectOwned::from(e))
        }).map_err(|e| RpcError::ServerError(format!("Failed to register balances_transfer: {}", e)))?;

        // balances_claimStarter - Onboarding faucet for new users
        module.register_async_method("balances_claimStarter", |params, ctx| async move {
            let address_str: String = params.one().map_err(|_| -> ErrorObjectOwned { invalid_params("Invalid address") })?;
            let address = hex::decode(address_str)
                .map_err(|_| -> ErrorObjectOwned { invalid_params("Invalid address hex") })?
                .try_into()
                .map_err(|_| -> ErrorObjectOwned { invalid_params("Address must be 32 bytes") })?;
            ctx.balances_claim_starter(address).await
                .map_err(|e: RpcError| ErrorObjectOwned::from(e))
        }).map_err(|e| RpcError::ServerError(format!("Failed to register balances_claimStarter: {}", e)))?;

        // balances_hasClaimedStarter - Check if user already claimed starter bonus
        module.register_async_method("balances_hasClaimedStarter", |params, ctx| async move {
            let address_str: String = params.one().map_err(|_| -> ErrorObjectOwned { invalid_params("Invalid address") })?;
            let address = hex::decode(address_str)
                .map_err(|_| -> ErrorObjectOwned { invalid_params("Invalid address hex") })?
                .try_into()
                .map_err(|_| -> ErrorObjectOwned { invalid_params("Address must be 32 bytes") })?;
            ctx.balances_has_claimed_starter(address).await
                .map_err(|e: RpcError| ErrorObjectOwned::from(e))
        }).map_err(|e| RpcError::ServerError(format!("Failed to register balances_hasClaimedStarter: {}", e)))?;

        Ok(())
    }

    /// Register consensus RPC methods
    fn register_consensus_methods(module: &mut RpcModule<Arc<RpcMethods<S>>>) -> Result<()> {
        // consensus_getCurrentEra
        module.register_async_method("consensus_getCurrentEra", |_params, ctx| async move {
            ctx.consensus_get_current_era().await
                .map_err(|e: RpcError| ErrorObjectOwned::from(e))
        }).map_err(|e| RpcError::ServerError(format!("Failed to register consensus_getCurrentEra: {}", e)))?;

        // consensus_getValidators
        module.register_async_method("consensus_getValidators", |_params, ctx| async move {
            ctx.consensus_get_validators().await
                .map_err(|e: RpcError| ErrorObjectOwned::from(e))
        }).map_err(|e| RpcError::ServerError(format!("Failed to register consensus_getValidators: {}", e)))?;

        // consensus_getValidator
        module.register_async_method("consensus_getValidator", |params, ctx| async move {
            let account_str: String = params.one().map_err(|_| -> ErrorObjectOwned { invalid_params("Invalid account") })?;
            let account = hex::decode(account_str)
                .map_err(|_| -> ErrorObjectOwned { invalid_params("Invalid account hex") })?
                .try_into()
                .map_err(|_| -> ErrorObjectOwned { invalid_params("Account must be 32 bytes") })?;
            ctx.consensus_get_validator(account).await
                .map_err(|e: RpcError| ErrorObjectOwned::from(e))
        }).map_err(|e| RpcError::ServerError(format!("Failed to register consensus_getValidator: {}", e)))?;

        // consensus_getStakingPool
        module.register_async_method("consensus_getStakingPool", |params, ctx| async move {
            let validator_str: String = params.one().map_err(|_| -> ErrorObjectOwned { invalid_params("Invalid validator") })?;
            let validator = hex::decode(validator_str)
                .map_err(|_| -> ErrorObjectOwned { invalid_params("Invalid validator hex") })?
                .try_into()
                .map_err(|_| -> ErrorObjectOwned { invalid_params("Validator must be 32 bytes") })?;
            ctx.consensus_get_staking_pool(validator).await
                .map_err(|e: RpcError| ErrorObjectOwned::from(e))
        }).map_err(|e| RpcError::ServerError(format!("Failed to register consensus_getStakingPool: {}", e)))?;

        // consensus_getStatus
        module.register_async_method("consensus_getStatus", |_params, ctx| async move {
            ctx.consensus_get_status().await
                .map_err(|e: RpcError| ErrorObjectOwned::from(e))
        }).map_err(|e| RpcError::ServerError(format!("Failed to register consensus_getStatus: {}", e)))?;

        Ok(())
    }

    /// Register energy RPC methods
    fn register_energy_methods(module: &mut RpcModule<Arc<RpcMethods<S>>>) -> Result<()> {
        // energy_getEnergy
        module.register_async_method("energy_getEnergy", |params, ctx| async move {
            let address_str: String = params.one().map_err(|_| -> ErrorObjectOwned { invalid_params("Invalid address") })?;
            let address = hex::decode(address_str)
                .map_err(|_| -> ErrorObjectOwned { invalid_params("Invalid address hex") })?
                .try_into()
                .map_err(|_| -> ErrorObjectOwned { invalid_params("Address must be 32 bytes") })?;
            ctx.energy_get_energy(address).await
                .map_err(|e: RpcError| ErrorObjectOwned::from(e))
        }).map_err(|e| RpcError::ServerError(format!("Failed to register energy_getEnergy: {}", e)))?;

        Ok(())
    }

    /// Register session keys RPC methods
    fn register_session_keys_methods(module: &mut RpcModule<Arc<RpcMethods<S>>>) -> Result<()> {
        // sessionKeys_getActiveKeys
        module.register_async_method("sessionKeys_getActiveKeys", |params, ctx| async move {
            let address_str: String = params.one().map_err(|_| -> ErrorObjectOwned { invalid_params("Invalid address") })?;
            let address = hex::decode(address_str)
                .map_err(|_| -> ErrorObjectOwned { invalid_params("Invalid address hex") })?
                .try_into()
                .map_err(|_| -> ErrorObjectOwned { invalid_params("Address must be 32 bytes") })?;
            ctx.session_keys_get_active_keys(address).await
                .map_err(|e: RpcError| ErrorObjectOwned::from(e))
        }).map_err(|e| RpcError::ServerError(format!("Failed to register sessionKeys_getActiveKeys: {}", e)))?;

        Ok(())
    }

    /// Register DRC-369 NFT RPC methods
    fn register_drc369_methods(module: &mut RpcModule<Arc<RpcMethods<S>>>) -> Result<()> {
        // drc369_ownerOf
        module.register_async_method("drc369_ownerOf", |params, ctx| async move {
            let token_id: String = params.one().map_err(|_| -> ErrorObjectOwned { invalid_params("Invalid token_id") })?;
            ctx.drc369_owner_of(token_id).await
                .map_err(|e: RpcError| ErrorObjectOwned::from(e))
        }).map_err(|e| RpcError::ServerError(format!("Failed to register drc369_ownerOf: {}", e)))?;

        // drc369_balanceOf
        module.register_async_method("drc369_balanceOf", |params, ctx| async move {
            let owner: String = params.one().map_err(|_| -> ErrorObjectOwned { invalid_params("Invalid owner") })?;
            ctx.drc369_balance_of(owner).await
                .map_err(|e: RpcError| ErrorObjectOwned::from(e))
        }).map_err(|e| RpcError::ServerError(format!("Failed to register drc369_balanceOf: {}", e)))?;

        // drc369_tokenURI
        module.register_async_method("drc369_tokenURI", |params, ctx| async move {
            let token_id: String = params.one().map_err(|_| -> ErrorObjectOwned { invalid_params("Invalid token_id") })?;
            ctx.drc369_token_uri(token_id).await
                .map_err(|e: RpcError| ErrorObjectOwned::from(e))
        }).map_err(|e| RpcError::ServerError(format!("Failed to register drc369_tokenURI: {}", e)))?;

        // drc369_isSoulbound
        module.register_async_method("drc369_isSoulbound", |params, ctx| async move {
            let token_id: String = params.one().map_err(|_| -> ErrorObjectOwned { invalid_params("Invalid token_id") })?;
            ctx.drc369_is_soulbound(token_id).await
                .map_err(|e: RpcError| ErrorObjectOwned::from(e))
        }).map_err(|e| RpcError::ServerError(format!("Failed to register drc369_isSoulbound: {}", e)))?;

        // drc369_getDynamicState
        module.register_async_method("drc369_getDynamicState", |params, ctx| async move {
            let (token_id, state_key): (String, String) = params.parse().map_err(|_| -> ErrorObjectOwned { invalid_params("Invalid params") })?;
            ctx.drc369_get_dynamic_state(token_id, state_key).await
                .map_err(|e: RpcError| ErrorObjectOwned::from(e))
        }).map_err(|e| RpcError::ServerError(format!("Failed to register drc369_getDynamicState: {}", e)))?;

        // drc369_getTokenInfo
        module.register_async_method("drc369_getTokenInfo", |params, ctx| async move {
            let token_id: String = params.one().map_err(|_| -> ErrorObjectOwned { invalid_params("Invalid token_id") })?;
            ctx.drc369_get_token_info(token_id).await
                .map_err(|e: RpcError| ErrorObjectOwned::from(e))
        }).map_err(|e| RpcError::ServerError(format!("Failed to register drc369_getTokenInfo: {}", e)))?;

        // drc369_totalSupply
        module.register_async_method("drc369_totalSupply", |_params, ctx| async move {
            ctx.drc369_total_supply().await
                .map_err(|e: RpcError| ErrorObjectOwned::from(e))
        }).map_err(|e| RpcError::ServerError(format!("Failed to register drc369_totalSupply: {}", e)))?;

        // drc369_getPhysics - Get physics properties for game engines
        module.register_async_method("drc369_getPhysics", |params, ctx| async move {
            let token_id: String = params.one().map_err(|_| -> ErrorObjectOwned { invalid_params("Invalid token_id") })?;
            ctx.drc369_get_physics(token_id).await
                .map_err(|e: RpcError| ErrorObjectOwned::from(e))
        }).map_err(|e| RpcError::ServerError(format!("Failed to register drc369_getPhysics: {}", e)))?;

        // drc369_hasPhysics - Check if token has physics
        module.register_async_method("drc369_hasPhysics", |params, ctx| async move {
            let token_id: String = params.one().map_err(|_| -> ErrorObjectOwned { invalid_params("Invalid token_id") })?;
            ctx.drc369_has_physics(token_id).await
                .map_err(|e: RpcError| ErrorObjectOwned::from(e))
        }).map_err(|e| RpcError::ServerError(format!("Failed to register drc369_hasPhysics: {}", e)))?;

        // drc369_setPhysics - Set physics properties
        module.register_async_method("drc369_setPhysics", |params, ctx| async move {
            let (token_id, physics_json, signature): (String, String, String) = params.parse()
                .map_err(|_| -> ErrorObjectOwned { invalid_params("Expected: [token_id, physics_json, signature]") })?;
            ctx.drc369_set_physics(token_id, physics_json, signature).await
                .map_err(|e: RpcError| ErrorObjectOwned::from(e))
        }).map_err(|e| RpcError::ServerError(format!("Failed to register drc369_setPhysics: {}", e)))?;

        // drc369_getStateBatch
        module.register_async_method("drc369_getStateBatch", |params, ctx| async move {
            let (token_id, paths): (String, Vec<String>) = params.parse().map_err(|_| -> ErrorObjectOwned { invalid_params("Invalid params") })?;
            ctx.drc369_get_state_batch(token_id, paths).await
                .map_err(|e: RpcError| ErrorObjectOwned::from(e))
        }).map_err(|e| RpcError::ServerError(format!("Failed to register drc369_getStateBatch: {}", e)))?;

        // drc369_mint - Privileged mint operation
        module.register_async_method("drc369_mint", |params, ctx| async move {
            let mint_request: crate::methods::Drc369MintRequest = params.one()
                .map_err(|_| -> ErrorObjectOwned { invalid_params("Invalid mint request") })?;
            ctx.drc369_mint(mint_request).await
                .map_err(|e: RpcError| ErrorObjectOwned::from(e))
        }).map_err(|e| RpcError::ServerError(format!("Failed to register drc369_mint: {}", e)))?;

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
