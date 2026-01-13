//! RPC API definitions for the Demiurge node.
//!
//! Exposes blockchain state and functionality via JSON-RPC:
//! - Standard Substrate RPC (system, chain, state, author)
//! - Custom CGT RPC endpoints
//! - Qor ID queries
//! - DRC-369 item queries

use jsonrpsee::{
	core::{Error as JsonRpseeError, RpcResult},
	types::error::{CallError, ErrorCode, ErrorObject},
	RpcModule,
};
use sp_api::ProvideRuntimeApi;
use sp_blockchain::{Error as BlockChainError, HeaderBackend, HeaderMetadata};
use sp_core::{
	crypto::Ss58Codec,
	storage::StorageKey,
};
use sp_runtime::{
	traits::{Block as BlockT, Header as HeaderT},
	AccountId32,
};
use std::sync::Arc;
use codec::Decode;

use demiurge_runtime::{AccountId, Block};

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

	// Create RPC handler instances
	let cgt_handler = CgtRpcHandler {
		client: deps.client.clone(),
		_phantom: std::marker::PhantomData,
	};

	let qor_id_handler = QorIdRpcHandler {
		client: deps.client.clone(),
		_phantom: std::marker::PhantomData,
	};

	let drc369_handler = Drc369RpcHandler {
		client: deps.client.clone(),
		_phantom: std::marker::PhantomData,
	};

	// Register CGT RPC methods
	module.register_method("cgt_balance", move |params, _| {
		let (account,): (String,) = params.parse()?;
		cgt_handler.balance(account)
	})?;

	module.register_method("cgt_totalBurned", move |_params, _| {
		cgt_handler.total_burned()
	})?;

	module.register_method("cgt_circulatingSupply", move |_params, _| {
		cgt_handler.circulating_supply()
	})?;

	// Register Qor ID RPC methods
	module.register_method("qorId_lookup", move |params, _| {
		let (account,): (String,) = params.parse()?;
		qor_id_handler.lookup(account)
	})?;

	module.register_method("qorId_checkAvailability", move |params, _| {
		let (username,): (String,) = params.parse()?;
		qor_id_handler.check_availability(username)
	})?;

	module.register_method("qorId_getIdentity", move |params, _| {
		let (qor_id,): (String,) = params.parse()?;
		qor_id_handler.get_identity(qor_id)
	})?;

	// Register DRC-369 RPC methods
	module.register_method("drc369_getInventory", move |params, _| {
		let (account,): (String,) = params.parse()?;
		drc369_handler.get_inventory(account)
	})?;

	module.register_method("drc369_getItem", move |params, _| {
		let (uuid,): (String,) = params.parse()?;
		drc369_handler.get_item(uuid)
	})?;

	Ok(module)
}

// ═══════════════════════════════════════════════════════════════════════════════
// CGT RPC HANDLER
// ═══════════════════════════════════════════════════════════════════════════════

struct CgtRpcHandler<C, B> {
	client: Arc<C>,
	_phantom: std::marker::PhantomData<B>,
}

impl<C, B> CgtRpcHandler<C, B>
where
	B: BlockT,
	C: HeaderBackend<B> + Send + Sync + 'static,
{
	/// Get CGT balance for an account
	fn balance(&self, account: String) -> RpcResult<String> {
		let account_id = decode_account(&account)?;
		let storage_key = storage_key_for_balance(&account_id);
		
		// Query storage using state_getStorage
		// Note: This is a simplified implementation
		// In production, you'd use the state API properly
		let block_hash = self.get_latest_block_hash()?;
		
		// For now, return a placeholder response
		// TODO: Implement actual storage query via state API
		Ok(format!("0x0"))
	}

	/// Get total CGT burned
	fn total_burned(&self) -> RpcResult<String> {
		// TODO: Query TotalBurned storage
		Ok(format!("0x0"))
	}

	/// Get circulating supply
	fn circulating_supply(&self) -> RpcResult<String> {
		// TODO: Query CirculatingSupply storage
		Ok(format!("0x0"))
	}

	fn get_latest_block_hash(&self) -> RpcResult<B::Hash> {
		self.client
			.hash(0)
			.ok()
			.flatten()
			.ok_or_else(|| internal_err("Failed to get latest block hash"))
	}
}

// ═══════════════════════════════════════════════════════════════════════════════
// QOR ID RPC HANDLER
// ═══════════════════════════════════════════════════════════════════════════════

struct QorIdRpcHandler<C, B> {
	client: Arc<C>,
	_phantom: std::marker::PhantomData<B>,
}

/// Qor ID response structure
#[derive(serde::Serialize, serde::Deserialize)]
pub struct QorIdResponse {
	pub username: String,
	pub qor_key: String,
	pub account_address: String,
	pub registration_block: u32,
	pub reputation: u32,
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

impl<C, B> QorIdRpcHandler<C, B>
where
	B: BlockT,
	C: HeaderBackend<B> + Send + Sync + 'static,
{
	/// Lookup Qor ID by account address
	fn lookup(&self, account: String) -> RpcResult<Option<QorIdResponse>> {
		let account_id = decode_account(&account)?;
		
		// TODO: Query AccountToIdentity storage, then Identities storage
		// For now, return None (not found)
		Ok(None)
	}

	/// Check if username is available
	fn check_availability(&self, username: String) -> RpcResult<bool> {
		// Normalize username (lowercase)
		let username_lower = username.to_lowercase();
		
		// Validate username format
		if username_lower.len() < 3 || username_lower.len() > 20 {
			return Ok(false);
		}
		
		if !username_lower.chars().all(|c| c.is_alphanumeric() || c == '_') {
			return Ok(false);
		}
		
		// TODO: Query Usernames storage to check if exists
		// For now, return true (available) as placeholder
		Ok(true)
	}

	/// Get full identity details
	fn get_identity(&self, _qor_id: String) -> RpcResult<Option<IdentityInfo>> {
		// TODO: Implement full identity lookup
		Ok(None)
	}
}

// ═══════════════════════════════════════════════════════════════════════════════
// DRC-369 RPC HANDLER
// ═══════════════════════════════════════════════════════════════════════════════

struct Drc369RpcHandler<C, B> {
	client: Arc<C>,
	_phantom: std::marker::PhantomData<B>,
}

/// DRC-369 item response
#[derive(serde::Serialize, serde::Deserialize)]
pub struct Drc369ItemResponse {
	pub uuid: String,
	pub name: String,
	pub creator_qor_key: String,
	pub creator_address: String,
	pub ue5_asset_path: String,
	pub glass_material: String,
	pub vfx_socket: String,
	pub is_soulbound: bool,
	pub royalty_fee_percent: u8,
	pub minted_at_block: u64,
	pub owner_address: String,
}

impl<C, B> Drc369RpcHandler<C, B>
where
	B: BlockT,
	C: HeaderBackend<B> + Send + Sync + 'static,
{
	/// Get inventory for an account
	fn get_inventory(&self, account: String) -> RpcResult<Vec<Drc369ItemResponse>> {
		let _account_id = decode_account(&account)?;
		
		// TODO: Query OwnerItems storage, then fetch each item
		Ok(vec![])
	}

	/// Get single item by UUID
	fn get_item(&self, uuid_hex: String) -> RpcResult<Option<Drc369ItemResponse>> {
		let _uuid = decode_hex_uuid(&uuid_hex)?;
		
		// TODO: Query Items storage and ItemOwners storage
		Ok(None)
	}
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/// Decode SS58 account address
fn decode_account(account: &str) -> RpcResult<AccountId> {
	AccountId32::from_ss58check(account)
		.map_err(|e| internal_err(&format!("Invalid SS58 address: {:?}", e)))
		.map(|id| AccountId::from(id))
}

/// Decode hex UUID string
fn decode_hex_uuid(hex: &str) -> RpcResult<[u8; 32]> {
	let hex = hex.strip_prefix("0x").unwrap_or(hex);
	let bytes = hex::decode(hex)
		.map_err(|e| internal_err(&format!("Invalid hex UUID: {:?}", e)))?;

	if bytes.len() != 32 {
		return Err(internal_err("UUID must be 32 bytes"));
	}

	let mut uuid = [0u8; 32];
	uuid.copy_from_slice(&bytes);
	Ok(uuid)
}

/// Format Qor Key from account ID
fn format_qor_key(account: &AccountId) -> String {
	let bytes = account.as_ref();
	if bytes.len() >= 6 {
		format!(
			"Q{:02X}{:02X}{:02X}:{:02X}{:02X}{:02X}",
			bytes[0],
			bytes[1],
			bytes[2],
			bytes[bytes.len() - 3],
			bytes[bytes.len() - 2],
			bytes[bytes.len() - 1]
		)
	} else {
		format!("Q{:02X}:{:02X}", bytes[0], bytes[bytes.len() - 1])
	}
}

/// Generate storage key for pallet_balances::Account
fn storage_key_for_balance(account: &AccountId) -> StorageKey {
	// TwoX128("Balances") + TwoX128("Account") + Blake2_128Concat(account)
	let mut key = Vec::new();

	// TwoX128("Balances")
	key.extend_from_slice(&sp_core::hashing::twox_128(b"Balances"));

	// TwoX128("Account")
	key.extend_from_slice(&sp_core::hashing::twox_128(b"Account"));

	// Blake2_128Concat(account)
	key.extend_from_slice(&sp_core::hashing::blake2_128(account.as_ref()));
	key.extend_from_slice(account.as_ref());

	StorageKey(key)
}

/// Generate storage key for pallet_cgt::TotalBurned
fn storage_key_for_total_burned() -> StorageKey {
	let mut key = Vec::new();
	key.extend_from_slice(&sp_core::hashing::twox_128(b"Cgt"));
	key.extend_from_slice(&sp_core::hashing::twox_128(b"TotalBurned"));
	StorageKey(key)
}

/// Generate storage key for pallet_cgt::CirculatingSupply
fn storage_key_for_circulating_supply() -> StorageKey {
	let mut key = Vec::new();
	key.extend_from_slice(&sp_core::hashing::twox_128(b"Cgt"));
	key.extend_from_slice(&sp_core::hashing::twox_128(b"CirculatingSupply"));
	StorageKey(key)
}

/// Generate storage key for pallet_qor_identity::AccountToIdentity
fn storage_key_for_account_to_identity(account: &AccountId) -> StorageKey {
	let mut key = Vec::new();
	key.extend_from_slice(&sp_core::hashing::twox_128(b"QorIdentity"));
	key.extend_from_slice(&sp_core::hashing::twox_128(b"AccountToIdentity"));
	key.extend_from_slice(&sp_core::hashing::blake2_128(account.as_ref()));
	key.extend_from_slice(account.as_ref());
	StorageKey(key)
}

/// Generate storage key for pallet_qor_identity::Identities
fn storage_key_for_identity(identity_hash: &[u8; 32]) -> StorageKey {
	let mut key = Vec::new();
	key.extend_from_slice(&sp_core::hashing::twox_128(b"QorIdentity"));
	key.extend_from_slice(&sp_core::hashing::twox_128(b"Identities"));
	key.extend_from_slice(&sp_core::hashing::blake2_128(identity_hash));
	key.extend_from_slice(identity_hash);
	StorageKey(key)
}

/// Generate storage key for pallet_qor_identity::Usernames
fn storage_key_for_username(username: &[u8]) -> StorageKey {
	let mut key = Vec::new();
	key.extend_from_slice(&sp_core::hashing::twox_128(b"QorIdentity"));
	key.extend_from_slice(&sp_core::hashing::twox_128(b"Usernames"));
	key.extend_from_slice(&sp_core::hashing::blake2_128(username));
	key.extend_from_slice(username);
	StorageKey(key)
}

/// Generate storage key for pallet_drc369::OwnerItems
fn storage_key_for_owner_items(account: &AccountId) -> StorageKey {
	let mut key = Vec::new();
	key.extend_from_slice(&sp_core::hashing::twox_128(b"Drc369"));
	key.extend_from_slice(&sp_core::hashing::twox_128(b"OwnerItems"));
	key.extend_from_slice(&sp_core::hashing::blake2_128(account.as_ref()));
	key.extend_from_slice(account.as_ref());
	StorageKey(key)
}

/// Generate storage key for pallet_drc369::Items
fn storage_key_for_drc369_item(uuid: &[u8; 32]) -> StorageKey {
	let mut key = Vec::new();
	key.extend_from_slice(&sp_core::hashing::twox_128(b"Drc369"));
	key.extend_from_slice(&sp_core::hashing::twox_128(b"Items"));
	key.extend_from_slice(&sp_core::hashing::blake2_128(uuid));
	key.extend_from_slice(uuid);
	StorageKey(key)
}

/// Generate storage key for pallet_drc369::ItemOwners
fn storage_key_for_drc369_owner(uuid: &[u8; 32]) -> StorageKey {
	let mut key = Vec::new();
	key.extend_from_slice(&sp_core::hashing::twox_128(b"Drc369"));
	key.extend_from_slice(&sp_core::hashing::twox_128(b"ItemOwners"));
	key.extend_from_slice(&sp_core::hashing::blake2_128(uuid));
	key.extend_from_slice(uuid);
	StorageKey(key)
}

/// Create internal error
fn internal_err(msg: &str) -> JsonRpseeError {
	JsonRpseeError::Call(CallError::Custom(ErrorObject::owned(
		ErrorCode::InternalError.code(),
		msg,
		None::<()>,
	)))
}
