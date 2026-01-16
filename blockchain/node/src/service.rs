//! Service configuration and construction.
//!
//! Defines how the node components are wired together:
//! - Database backend
//! - Networking
//! - Consensus (Aura + GRANDPA)
//! - RPC handlers

use std::sync::Arc;

// Re-export block type for external use
pub use sp_runtime::generic::Block as BlockGeneric;
pub use sp_runtime::OpaqueExtrinsic;

use sc_executor::WasmExecutor;
use sc_service::{Configuration, TaskManager, error::Error as ServiceError};

use demiurge_runtime::{self as runtime, opaque::Block, RuntimeApi};

mod rpc;

// ═══════════════════════════════════════════════════════════════════════════════
// TYPE ALIASES
// ═══════════════════════════════════════════════════════════════════════════════

/// Opaque block type
pub type Block = BlockGeneric<
	sp_runtime::generic::Header<u32, sp_runtime::traits::BlakeTwo256>,
	OpaqueExtrinsic,
>;

/// Full client type
pub type FullClient = sc_service::TFullClient<Block, RuntimeApi, WasmExecutor<sp_io::SubstrateHostFunctions>>;

/// Full backend type
pub type FullBackend = sc_service::TFullBackend<Block>;

/// Full select chain type
pub type FullSelectChain = sc_consensus::LongestChain<FullBackend, Block>;

// ═══════════════════════════════════════════════════════════════════════════════
// EXECUTOR CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

/// Create WASM executor
pub fn create_executor() -> WasmExecutor<sp_io::SubstrateHostFunctions> {
	WasmExecutor::builder()
		.with_max_heap_pages(2048)
		.with_onchain_heap_pages(256)
		.build()
}

// ═══════════════════════════════════════════════════════════════════════════════
// CHAIN OPERATIONS
// ═══════════════════════════════════════════════════════════════════════════════

/// Create chain operations for utility commands
pub fn new_chain_ops(
	config: &Configuration,
) -> Result<
	(
		Arc<FullClient>,
		Arc<FullBackend>,
		sc_consensus::BasicQueue<Block>,
		TaskManager,
	),
	ServiceError,
> {
	let (client, backend, mut task_manager, import_queue) =
		sc_service::new_full_parts::<Block, RuntimeApi, _>(
			config,
			None,
			create_executor(),
		)?;

	Ok((client, backend, import_queue, task_manager))
}

// ═══════════════════════════════════════════════════════════════════════════════
// FULL NODE SERVICE
// ═══════════════════════════════════════════════════════════════════════════════

/// Create a new full node service
pub fn new_full(config: Configuration) -> Result<TaskManager, ServiceError> {
	log::info!("🎭 Starting Demiurge Node");
	log::info!("  Chain: {}", config.chain_spec.name());
	log::info!("  Role: {:?}", config.role);

	// Create executor
	let executor = create_executor();

	// Build the service using Substrate's helper
	let (client, backend, mut task_manager, import_queue, keystore_container, select_chain) =
		sc_service::new_full_parts::<Block, RuntimeApi, _>(&config, None, executor)?;

	// Create transaction pool
	let transaction_pool = sc_transaction_pool::BasicPool::new_full(
		config.transaction_pool.clone(),
		config.role.is_authority().into(),
		config.prometheus_registry(),
		task_manager.spawn_handle(),
		client.clone(),
	);

	// Create network
	let (network, system_rpc_tx, network_starter) =
		sc_service::build_network(sc_service::BuildNetworkParams {
			config: &config,
			client: client.clone(),
			transaction_pool: transaction_pool.clone(),
			spawn_handle: task_manager.spawn_handle(),
			import_queue,
			on_demand: None,
			block_announce_validator_builder: None,
			warp_sync: None,
		})?;

	// Spawn network
	network_starter.start_network();

	// Create RPC handlers
	let rpc_extensions_builder = {
		let client = client.clone();
		let pool = transaction_pool.clone();
		let deny_unsafe = config.rpc_methods.is_unsafe();

		Box::new(move |deny_unsafe: bool| {
			let deps = rpc::FullDeps {
				client: client.clone(),
				pool: pool.clone(),
				deny_unsafe,
				_marker: Default::default(),
			};
			rpc::create_full(deps)
		})
	};

	// Start RPC server and other tasks
	let _rpc_handlers = sc_service::spawn_tasks(sc_service::SpawnTasksParams {
		network: network.clone(),
		client: client.clone(),
		keystore: keystore_container.sync_keystore(),
		task_manager: &mut task_manager,
		transaction_pool: transaction_pool.clone(),
		rpc_builder: rpc_extensions_builder,
		backend: backend.clone(),
		system_rpc_tx,
		config,
		telemetry: None,
	})?;

	// If this node is an authority, start block production
	if config.role.is_authority() {
		// Create a new select chain for GRANDPA (Aura will consume the original)
		let grandpa_select_chain = select_chain.clone();
		
		// Start Aura block production
		let slot_duration = sc_consensus_aura::slot_duration(&*client)?;
		
		let proposer_factory = sc_basic_authorship::ProposerFactory::new(
			task_manager.spawn_handle(),
			client.clone(),
			transaction_pool.clone(),
			config.prometheus_registry(),
			None,
		);

		let _aura = sc_consensus_aura::start_aura::<sp_consensus_aura::sr25519::AuthorityPair, _, _, _, _, _, _>(
			sc_consensus_aura::StartAuraParams {
				slot_duration,
				client: client.clone(),
				select_chain,
				block_import: client.clone(),
				proposer_factory,
				create_inherent_data_providers: move |_, ()| async move {
					let timestamp = sp_timestamp::InherentDataProvider::from_system_time();
					Ok((timestamp,))
				},
				force_authoring: false,
				keystore: keystore_container.sync_keystore(),
				can_author_with: sp_consensus::CanAuthorWithNativeVersion::new(client.executor().clone()),
				sync_oracle: network.clone(),
				justification_sync_link: network.clone(),
				block_proposal_slot_portion: sp_consensus::SlotProportion::new(2f32 / 3f32),
				max_block_proposal_slot_portion: None,
				telemetry: None,
			},
		)?;

		// Start GRANDPA finality gadget
		let (grandpa_block_import, grandpa_link) = sc_consensus_grandpa::block_import(
			client.clone(),
			&client,
			grandpa_select_chain,
			None,
		)?;

		let grandpa_config = sc_consensus_grandpa::Config {
			gossip_duration: std::time::Duration::from_millis(333),
			justification_period: 512,
			name: Some(config.network.node_name().clone()),
			observer_enabled: false,
			keystore: Some(keystore_container.sync_keystore()),
			is_authority: config.role.is_authority(),
			telemetry: None,
		};

		let (grandpa, network) = sc_consensus_grandpa::start_grandpa(
			grandpa_config,
			grandpa_link,
			network.clone(),
			None,
			backend.clone(),
			task_manager.spawn_handle(),
			client.clone(),
		)?;

		task_manager.spawn_handle().spawn("grandpa-voter", None, grandpa);
	}

	log::info!("✅ Demiurge Node started successfully");
	log::info!("  RPC: ws://127.0.0.1:{}", config.rpc_listen_port());

	Ok(task_manager)
}

// ═══════════════════════════════════════════════════════════════════════════════
// NODE CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

/// Node configuration options
#[derive(Debug, Clone)]
pub struct NodeConfig {
	/// Enable RPC server
	pub rpc_enabled: bool,
	/// RPC port
	pub rpc_port: u16,
	/// Enable prometheus metrics
	pub prometheus_enabled: bool,
	/// Prometheus port
	pub prometheus_port: u16,
}

impl Default for NodeConfig {
	fn default() -> Self {
		Self {
			rpc_enabled: true,
			rpc_port: 9944,
			prometheus_enabled: true,
			prometheus_port: 9615,
		}
	}
}
