//! Node service - Main node logic

use crate::NodeConfig;
use demiurge_core::{Runtime, Block, Transaction};
use demiurge_storage::StorageBackend;
use demiurge_consensus::{ConsensusEngine, ValidatorSet, Validator, BlockProof, BlockSignature};
use demiurge_rpc::{RpcServer, RpcMethods};
use anyhow::Result;
use tracing::{info, warn, error};
use std::sync::Arc;
use tokio::sync::Mutex;
use tokio::time::{sleep, Duration};
use ed25519_dalek::SigningKey;
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
        })
    }

    /// Initialize consensus engine
    pub fn init_consensus(&mut self) -> Result<()> {
        info!("Initializing consensus engine...");
        
        // Get storage from runtime (we'll need to refactor for proper sharing)
        // For now, create a new storage instance for consensus
        // TODO: Refactor to share storage properly
        let storage = StorageBackend::new(
            self.config.data_dir.to_str().unwrap_or("./data")
        )?;
        
        let mut consensus_engine = ConsensusEngine::new(storage, self.config.block_time_ms);
        
        // Register validators (for now, empty - will be populated from config or storage)
        // TODO: Load validators from storage or config
        
        self.consensus = Some(Arc::new(Mutex::new(consensus_engine)));
        
        info!("✅ Consensus engine initialized");
        Ok(())
    }

    /// Register as validator
    pub fn register_validator(&mut self, account: [u8; 32], signing_key: SigningKey, stake: u128) -> Result<()> {
        info!("Registering validator: {:?}", hex::encode(account));
        
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
            
            self.is_validator = true;
            self.validator_account = Some(account);
            self.validator_key = Some(signing_key);
            
            info!("✅ Validator registered");
        } else {
            return Err(anyhow::anyhow!("Consensus engine not initialized"));
        }
        
        Ok(())
    }

    /// Start the node service
    pub async fn start(&mut self) -> Result<()> {
        info!("🚀 Starting Demiurge Node...");
        info!("The flame burns eternal. The code serves the will.");
        
        // Initialize consensus engine
        self.init_consensus()?;
        
        // Start block production if validator
        if self.is_validator {
            info!("Starting block production loop...");
            let consensus_clone = self.consensus.clone().unwrap();
            let runtime_clone = self.runtime.clone();
            let block_time = Duration::from_millis(self.config.block_time_ms);
            
            // Note: Runtime sharing needs to be handled differently
            // For now, block production loop runs but doesn't execute blocks
            // TODO: Refactor storage sharing between runtime and consensus
            tokio::spawn(async move {
                Self::block_production_loop(consensus_clone, runtime_clone, block_time).await;
            });
        }
        
        // TODO: Start network
        // TODO: Start RPC server
        
        info!("✅ Node service started");
        Ok(())
    }

    /// Block production loop
    async fn block_production_loop(
        consensus: Arc<Mutex<ConsensusEngine<StorageBackend>>>,
        runtime: Arc<Mutex<Runtime<StorageBackend>>>,
        block_time: Duration,
    ) {
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
                    info!("Selected proposer for next block: {:?}", hex::encode(proposer));
                    // TODO: Check if we're the proposer and produce block
                    // TODO: Get transactions from transaction pool
                    // TODO: Produce and broadcast block
                }
                Err(e) => {
                    warn!("Failed to select proposer: {:?}", e);
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
        // TODO: Stop RPC server when implemented
        Ok(())
    }

    /// Get runtime reference
    pub fn runtime(&self) -> &Arc<Mutex<Runtime<StorageBackend>>> {
        &self.runtime
    }
}
