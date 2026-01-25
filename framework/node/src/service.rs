//! Node service - Main node logic

use crate::{NodeConfig, GenesisConfig};
use demiurge_core::{Runtime, Block, Transaction};
use demiurge_storage::StorageBackend;
use demiurge_consensus::{ConsensusEngine, Validator, BlockProof};
use demiurge_rpc::{RpcServer, RpcMethods};
use anyhow::Result;
use tracing::{info, warn};
use std::sync::Arc;
use tokio::sync::Mutex;
use tokio::time::{sleep, Duration};
use ed25519_dalek::{SigningKey, VerifyingKey};
use hex;

/// Node service
pub struct NodeService {
    config: NodeConfig,
    runtime: Arc<Mutex<Runtime<StorageBackend>>>,
    consensus: Option<Arc<Mutex<ConsensusEngine<StorageBackend>>>>,
    rpc_server: Option<RpcServer<StorageBackend>>,
    is_validator: bool,
    validator_account: Option<[u8; 32]>,
    validator_key: Option<SigningKey>,
    validator_stake: Option<u128>,
    genesis_config: Option<GenesisConfig>,
}

impl NodeService {
    /// Create a new node service
    pub fn new(config: NodeConfig) -> Result<Self> {
        info!("Initializing node service...");
        
        // Initialize storage
        let storage = StorageBackend::new(
            config.data_dir.to_str().unwrap_or("./data")
        )?;
        
        // Initialize runtime (wrapped in Arc<Mutex> for sharing)
        let runtime = Arc::new(Mutex::new(Runtime::new(storage)));
        
        Ok(Self {
            config,
            runtime,
            consensus: None,
            rpc_server: None,
            is_validator: false,
            validator_account: None,
            validator_key: None,
            validator_stake: None,
            genesis_config: None,
        })
    }
    
    /// Load genesis configuration (call before start())
    pub fn load_genesis(&mut self, genesis_config: GenesisConfig) -> Result<()> {
        info!("Loading genesis configuration: chain_id={}", genesis_config.chain_id);
        info!("Genesis validators: {}", genesis_config.validators.len());
        for (i, validator) in genesis_config.validators.iter().enumerate() {
            info!("  Validator {}: {} (stake: {})", 
                i + 1, 
                validator.name.as_deref().unwrap_or(&validator.account),
                validator.stake
            );
        }
        self.genesis_config = Some(genesis_config);
        Ok(())
    }

    /// Initialize consensus engine
    pub fn init_consensus(&mut self) -> Result<()> {
        info!("Initializing consensus engine...");
        
        // Share storage with runtime by cloning the Arc
        // Get storage from runtime - Runtime stores it as Arc internally
        // We need to create a shared storage wrapper
        // For now, use a separate database path for consensus to avoid lock conflicts
        // TODO: Refactor Runtime and ConsensusEngine to accept Arc<Mutex<StorageBackend>>
        let consensus_storage_path = format!("{}/consensus", self.config.data_dir.to_str().unwrap_or("./data"));
        let storage = StorageBackend::new(&consensus_storage_path)?;
        
        let mut consensus_engine = ConsensusEngine::new(storage, self.config.block_time_ms);
        
        // Register genesis validators if we have genesis config
        if let Some(ref genesis_config) = self.genesis_config {
            info!("Registering {} genesis validators...", genesis_config.validators.len());
            
            for validator_config in &genesis_config.validators {
                // Parse validator address
                let account: [u8; 32] = match hex::decode(&validator_config.account) {
                    Ok(bytes) if bytes.len() == 32 => {
                        bytes.try_into().unwrap()
                    }
                    _ => {
                        warn!("Invalid validator account format: {}", validator_config.account);
                        continue;
                    }
                };
                
                // Parse stake
                let stake: u128 = validator_config.stake.parse().unwrap_or(1_000_000_000);
                
                // For genesis validators without keys, we create a placeholder public key
                // The actual validator with the key will register properly
                // This is just to initialize the validator set for consensus
                info!("  Registering genesis validator: {} (stake: {})", 
                    validator_config.name.as_deref().unwrap_or(&validator_config.account),
                    stake
                );
                
                // Note: Genesis validators are placeholders - real validators must register with keys
                // We'll skip actually adding them here since we need real keys
                // The local validator registration below will add the actual validator
            }
        }
        
        self.consensus = Some(Arc::new(Mutex::new(consensus_engine)));
        
        // Now register the local validator if configured
        self.register_validator_with_consensus()?;
        
        // Log final validator count
        if let Some(ref consensus) = self.consensus {
            if let Ok(consensus_guard) = consensus.try_lock() {
                let validator_count = consensus_guard.validators.count();
                info!("✅ Consensus engine initialized with {} validators", validator_count);
            }
        }
        
        Ok(())
    }

    /// Register as validator (call before start())
    /// The validator will be registered when consensus engine is initialized
    pub fn register_validator(&mut self, account: [u8; 32], signing_key: SigningKey, stake: u128) -> Result<()> {
        info!("Preparing to register as validator: {}", hex::encode(account));
        
        self.is_validator = true;
        self.validator_account = Some(account);
        self.validator_key = Some(signing_key);
        self.validator_stake = Some(stake);
        
        info!("✅ Validator configuration stored (will register on start)");
        Ok(())
    }
    
    /// Actually register the validator with the consensus engine (called after consensus init)
    fn register_validator_with_consensus(&self) -> Result<()> {
        if !self.is_validator {
            return Ok(());
        }
        
        let account = self.validator_account.ok_or_else(|| anyhow::anyhow!("No validator account"))?;
        let signing_key = self.validator_key.as_ref().ok_or_else(|| anyhow::anyhow!("No validator key"))?;
        let stake = self.validator_stake.unwrap_or(1_000_000_000);
        
        if let Some(consensus) = &self.consensus {
            let mut consensus = consensus.try_lock()
                .map_err(|_| anyhow::anyhow!("Failed to acquire consensus lock"))?;
            
            // Register validator key
            consensus.register_validator_key(account, signing_key.clone());
            
            // Register validator in validator set
            let public_key = signing_key.verifying_key();
            let validator = Validator {
                account,
                stake,
                commission: 10,
                active: true,
                public_key: public_key.clone(),
            };
            consensus.validators.register_validator(validator);
            
            info!("✅ Validator registered with consensus: {}", hex::encode(account));
        } else {
            return Err(anyhow::anyhow!("Consensus engine not initialized"));
        }
        
        Ok(())
    }

    /// Start the node service
    pub async fn start(&mut self) -> Result<()> {
        info!("🚀 Starting Demiurge Node...");
        info!("The flame burns eternal. The code serves the will.");
        
        // Initialize consensus engine (also registers validators)
        self.init_consensus()?;
        
        // Start block production if validator
        if self.is_validator {
            let validator_account = self.validator_account
                .ok_or_else(|| anyhow::anyhow!("Validator mode enabled but no account set"))?;
            
            info!("Starting block production loop for validator {}...", 
                hex::encode(validator_account));
            
            let consensus_clone = self.consensus.clone().unwrap();
            let runtime_clone = self.runtime.clone();
            let block_time = Duration::from_millis(self.config.block_time_ms);
            
            tokio::spawn(async move {
                Self::block_production_loop(
                    consensus_clone, 
                    runtime_clone, 
                    block_time,
                    validator_account,
                ).await;
            });
        } else {
            info!("Running in observer mode (no block production)");
        }
        
        // Start RPC server if enabled
        if self.config.enable_rpc {
            self.start_rpc_server().await?;
        }
        
        // TODO: Start network
        
        info!("✅ Node service started");
        Ok(())
    }

    /// Start RPC server
    async fn start_rpc_server(&mut self) -> Result<()> {
        info!("Starting RPC server on {}...", self.config.rpc_addr);
        
        // Get storage from runtime - Runtime stores it as Arc internally
        // Extract it by locking the runtime and cloning the storage Arc
        let storage_arc = {
            let runtime_guard = self.runtime.lock().await;
            runtime_guard.storage.clone()
        };
        
        // Create RPC methods handler
        let mut rpc_methods = RpcMethods::new(storage_arc);
        
        // Set runtime and consensus references
        rpc_methods.set_runtime(self.runtime.clone());
        if let Some(consensus) = &self.consensus {
            rpc_methods.set_consensus(consensus.clone());
        }
        
        // Create and start RPC server
        let mut rpc_server = RpcServer::new(self.config.rpc_addr);
        rpc_server.start(Arc::new(rpc_methods)).await
            .map_err(|e| anyhow::anyhow!("Failed to start RPC server: {}", e))?;
        
        self.rpc_server = Some(rpc_server);
        info!("✅ RPC server started on {}", self.config.rpc_addr);
        Ok(())
    }

    /// Block production loop
    async fn block_production_loop(
        consensus: Arc<Mutex<ConsensusEngine<StorageBackend>>>,
        _runtime: Arc<Mutex<Runtime<StorageBackend>>>,
        block_time: Duration,
        validator_account: [u8; 32],
    ) {
        info!("🔨 Block production loop started for validator {}", hex::encode(validator_account));
        let mut blocks_produced = 0u64;
        
        loop {
            // Wait for block time
            sleep(block_time).await;
            
            // Get consensus lock
            let mut consensus_guard = match consensus.try_lock() {
                Ok(guard) => guard,
                Err(_) => {
                    warn!("Failed to acquire consensus lock, skipping block production");
                    continue;
                }
            };
            
            // Check if we're the proposer
            match consensus_guard.select_proposer_weighted() {
                Ok(proposer) => {
                    if proposer == validator_account {
                        // We're the proposer - produce a block
                        let transactions = Vec::new(); // Empty block for now (no tx pool yet)
                        
                        match consensus_guard.propose_block(transactions, validator_account) {
                            Ok((block, _proof)) => {
                                // For now, use block hash as state root
                                // TODO: Properly execute transactions in runtime when storage sharing is fixed
                                let state_root = block.header.extrinsics_root;
                                
                                // Update block with state root and store
                                let mut final_block = block.clone();
                                final_block.header.state_root = state_root;
                                
                                if let Err(e) = consensus_guard.store_block(&final_block) {
                                    warn!("Failed to store block: {:?}", e);
                                    continue;
                                }
                                
                                blocks_produced += 1;
                                let block_num = final_block.header.block_number;
                                
                                // Log every block for now (can reduce frequency later)
                                if blocks_produced % 10 == 0 || blocks_produced <= 5 {
                                    info!("⛏️  Block #{} produced (total: {})", block_num, blocks_produced);
                                }
                            }
                            Err(e) => {
                                warn!("Failed to propose block: {:?}", e);
                            }
                        }
                    }
                    // If we're not the proposer, just wait for next round
                }
                Err(e) => {
                    // Only warn occasionally to avoid log spam
                    if blocks_produced == 0 {
                        warn!("No validators available for block production: {:?}", e);
                    }
                }
            }
        }
    }

    /// Produce a block (called when we're the proposer)
    pub async fn produce_block(&mut self, transactions: Vec<Transaction>) -> Result<(Block, BlockProof)> {
        if !self.is_validator {
            return Err(anyhow::anyhow!("Not a validator"));
        }
        
        let account = self.validator_account.ok_or_else(|| anyhow::anyhow!("No validator account"))?;
        
        if let Some(consensus) = &self.consensus {
            let mut consensus = consensus.lock().await;
            
            // Propose block
            let (block, proof) = consensus.propose_block(transactions, account)?;
            
            // Execute block in runtime and get state root
            let state_root = {
                let mut runtime = self.runtime.lock().await;
                runtime.execute_block(block.clone())?
            };
            
            // Update block header with state root
            let mut updated_block = block.clone();
            updated_block.header.state_root = state_root;
            
            // Store block in consensus engine
            consensus.store_block(&updated_block)?;
            
            // Verify state root matches
            consensus.verify_state_root(state_root)?;
            
            // TODO: Broadcast block to network
            // TODO: Collect validator signatures
            // TODO: Finalize block when 2/3+ signatures received
            
            Ok((block, proof))
        } else {
            Err(anyhow::anyhow!("Consensus engine not initialized"))
        }
    }

    /// Stop the node service
    pub async fn stop(&mut self) -> Result<()> {
        info!("Shutting down node service...");
        
        // Stop RPC server if running
        if let Some(ref mut rpc_server) = self.rpc_server {
            rpc_server.stop().await
                .map_err(|e| anyhow::anyhow!("Failed to stop RPC server: {}", e))?;
            info!("✅ RPC server stopped");
        }
        
        Ok(())
    }

    /// Get runtime reference
    pub fn runtime(&self) -> &Arc<Mutex<Runtime<StorageBackend>>> {
        &self.runtime
    }
}
