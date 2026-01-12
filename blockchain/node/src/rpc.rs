//! RPC API definitions for the Demiurge node.
//!
//! Exposes blockchain state and functionality via JSON-RPC:
//! - Standard Substrate RPC (system, chain, state, author)
//! - Custom CGT RPC endpoints
//! - Qor ID queries

use jsonrpsee::RpcModule;
use sp_api::ProvideRuntimeApi;
use sp_blockchain::{Error as BlockChainError, HeaderBackend, HeaderMetadata};
use sp_runtime::traits::Block as BlockT;
use std::sync::Arc;

/// Extra dependencies for RPC
pub struct FullDeps<C, P, B: BlockT> {
    /// The client instance
    pub client: Arc<C>,
    /// Transaction pool
    pub pool: Arc<P>,
    /// Whether to deny unsafe calls
    pub deny_unsafe: bool,
    /// Phantom block type
    pub _marker: std::marker::PhantomData<B>,
}

/// Instantiate all full RPC extensions
pub fn create_full<C, P, B>(
    deps: FullDeps<C, P, B>,
) -> Result<RpcModule<()>, Box<dyn std::error::Error + Send + Sync>>
where
    B: BlockT,
    C: ProvideRuntimeApi<B>
        + HeaderBackend<B>
        + HeaderMetadata<B, Error = BlockChainError>
        + Send
        + Sync
        + 'static,
    P: Send + Sync + 'static,
{
    let mut module = RpcModule::new(());
    
    // Add standard Substrate RPC modules
    // module.merge(System::new(...).into_rpc())?;
    // module.merge(TransactionPayment::new(...).into_rpc())?;
    
    // Custom Demiurge RPC endpoints would be added here:
    // - cgt_getBalance
    // - cgt_getTotalBurned
    // - qorId_lookup
    // - qorId_getAttestations
    
    Ok(module)
}

/// CGT-specific RPC trait
#[rpc::rpc(server)]
pub trait CgtApi<BlockHash> {
    /// Get total CGT burned since genesis
    #[method(name = "cgt_totalBurned")]
    fn total_burned(&self, at: Option<BlockHash>) -> Result<u128, Error>;
    
    /// Get circulating supply
    #[method(name = "cgt_circulatingSupply")]
    fn circulating_supply(&self, at: Option<BlockHash>) -> Result<u128, Error>;
    
    /// Get account balance
    #[method(name = "cgt_balance")]
    fn balance(&self, account: String, at: Option<BlockHash>) -> Result<u128, Error>;
}

/// Qor ID RPC trait
#[rpc::rpc(server)]
pub trait QorIdApi<BlockHash> {
    /// Lookup Qor ID by account
    #[method(name = "qorId_lookup")]
    fn lookup(&self, account: String, at: Option<BlockHash>) -> Result<Option<String>, Error>;
    
    /// Get identity details
    #[method(name = "qorId_getIdentity")]
    fn get_identity(&self, qor_id: String, at: Option<BlockHash>) -> Result<Option<IdentityInfo>, Error>;
    
    /// Get attestations for identity
    #[method(name = "qorId_getAttestations")]
    fn get_attestations(&self, qor_id: String, at: Option<BlockHash>) -> Result<Vec<Attestation>, Error>;
}

/// Identity info returned by RPC
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct IdentityInfo {
    pub qor_id: String,
    pub primary_account: String,
    pub linked_accounts: Vec<String>,
    pub status: String,
    pub registered_at: u32,
}

/// Attestation info returned by RPC
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct Attestation {
    pub attestation_type: String,
    pub verified_at: u32,
    pub expires_at: Option<u32>,
}

/// RPC error type
#[derive(Debug)]
pub struct Error(String);

impl From<String> for Error {
    fn from(s: String) -> Self {
        Error(s)
    }
}
