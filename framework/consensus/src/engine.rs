//! Consensus engine - Hybrid PoS + BFT

use crate::{Finality, Result, Validator, ValidatorSet, ConsensusError, SlashingTracker, StakingPool};
use demiurge_core::{Block, Transaction};
use demiurge_storage::Storage;
use codec::{Encode, Decode};
use std::collections::HashMap;
use ed25519_dalek::{SigningKey, Signature, Signer, Verifier};
use hex;
use tracing::warn;

/// Consensus engine combining PoS and BFT
pub struct ConsensusEngine<S: Storage> {
    validators: ValidatorSet,
    finality: Finality,
    storage: S,
    current_era: u64,
    block_time: u64, // Block time in milliseconds
    era_length: u64, // Blocks per era (default: 1000)
    validator_keys: HashMap<[u8; 32], SigningKey>, // Validator account -> signing key
    slashing: SlashingTracker, // Slashing tracker
    pub(crate) staking_pools: HashMap<[u8; 32], StakingPool>, // Validator -> staking pool (pub for testing)
    transaction_fees: u128, // Accumulated transaction fees for current era
}

impl<S: Storage> ConsensusEngine<S> {
    /// Create a new consensus engine
    pub fn new(storage: S, block_time_ms: u64) -> Self {
        // Try to load current era from storage
        let current_era = Self::load_current_era(&storage).unwrap_or(0);
        
        Self {
            validators: ValidatorSet::new(),
            finality: Finality::new(),
            storage,
            current_era,
            block_time: block_time_ms,
            era_length: 1000, // Default: 1000 blocks per era
            validator_keys: HashMap::new(),
            slashing: SlashingTracker::new(),
            staking_pools: HashMap::new(),
            transaction_fees: 0,
        }
    }

    /// Register a validator with their signing key
    pub fn register_validator_key(&mut self, account: [u8; 32], signing_key: SigningKey) {
        self.validator_keys.insert(account, signing_key);
    }

    /// Set era length
    pub fn set_era_length(&mut self, era_length: u64) {
        self.era_length = era_length;
    }

    /// Get current era
    pub fn current_era(&self) -> u64 {
        self.current_era
    }

    /// Check if era transition is needed
    pub fn should_transition_era(&self) -> bool {
        let current_block = self.get_latest_block_number().unwrap_or(0);
        current_block > 0 && current_block % self.era_length == 0
    }

    /// Propose a new block
    /// Returns the proposed block and proof
    pub fn propose_block(
        &mut self,
        transactions: Vec<Transaction>,
        proposer: [u8; 32], // Validator account
    ) -> Result<(Block, BlockProof)> {
        // Select proposer based on stake (PoS) with weighted selection
        let selected_proposer = self.select_proposer_weighted()?;
        if selected_proposer != proposer {
            return Err(ConsensusError::InvalidProposer);
        }

        // Get latest block info from storage
        let latest_block_number = self.get_latest_block_number()?;
        let latest_hash = self.get_latest_hash()?;
        let new_block_number = latest_block_number + 1;

        // Create block header (state root will be calculated after execution)
        let header = demiurge_core::BlockHeader {
            parent_hash: latest_hash,
            block_number: new_block_number,
            state_root: [0u8; 32], // Will be calculated after execution
            extrinsics_root: self.calculate_extrinsics_root(&transactions),
            timestamp: self.get_timestamp(),
        };

        // Create block
        let block = Block {
            header: header.clone(),
            transactions: transactions.clone(),
        };
        
        // Collect fees from transactions
        self.collect_transaction_fees(&block);

        // Sign block with proposer's key
        let signature = self.sign_block(&block, proposer)?;

        // Create proof
        let proof = BlockProof {
            proposer,
            signature,
            timestamp: block.header.timestamp,
        };

        Ok((block, proof))
    }

    /// Select proposer using weighted random selection based on stake
    pub fn select_proposer_weighted(&self) -> Result<[u8; 32]> {
        if self.validators.count() == 0 {
            return Err(ConsensusError::NoValidators);
        }

        let total_stake = self.validators.total_stake();
        if total_stake == 0 {
            return Err(ConsensusError::NoValidators);
        }

        // Generate deterministic random value based on block number
        let block_number = self.get_latest_block_number().unwrap_or(0);
        let seed = self.generate_vrf_seed(block_number + 1);
        
        // Convert seed to u128 for weighted selection
        let mut random_value = 0u128;
        for (i, byte) in seed.iter().enumerate() {
            random_value = random_value.wrapping_add((*byte as u128) << (i * 8));
        }
        random_value %= total_stake;

        // Select proposer based on cumulative stake weights
        let mut cumulative = 0u128;
        for (account, validator) in self.validators.iter() {
            if !validator.active {
                continue;
            }
            cumulative += validator.stake;
            if random_value < cumulative {
                return Ok(*account);
            }
        }

        // Fallback: return first active validator
        for (account, validator) in self.validators.iter() {
            if validator.active {
                return Ok(*account);
            }
        }

        Err(ConsensusError::NoValidators)
    }

    /// Generate VRF seed for deterministic randomness
    fn generate_vrf_seed(&self, block_number: u64) -> [u8; 32] {
        use blake2::{Blake2b512, Digest};
        let mut hasher = Blake2b512::new();
        
        // Include block number and parent hash for determinism
        let parent_hash = self.get_latest_hash().unwrap_or([0u8; 32]);
        hasher.update(&block_number.to_le_bytes());
        hasher.update(&parent_hash);
        hasher.update(b"demiurge_vrf_seed"); // Domain separator
        
        let hash = hasher.finalize();
        let mut result = [0u8; 32];
        result.copy_from_slice(&hash[..32]);
        result
    }

    /// Validate a block proposal
    pub fn validate_block(&self, block: &Block, proof: &BlockProof) -> Result<()> {
        // Verify proposer is valid
        if !self.validators.is_validator(&proof.proposer) {
            return Err(ConsensusError::InvalidValidator);
        }

        // Verify signature
        self.verify_signature(block, proof)?;

        // Verify block structure
        block.validate()?;
        
        // If validation fails, slash proposer for invalid block
        // Note: This is a simplified check - in production, we'd validate more thoroughly
        // before slashing

        // Verify transactions
        for tx in &block.transactions {
            tx.validate()?;
        }

        // Verify timestamp (not too far in future/past)
        self.verify_timestamp(block.header.timestamp)?;

        Ok(())
    }

    /// Finalize a block using BFT
    /// Requires 2/3+ of validators to agree
    pub fn finalize_block(
        &mut self,
        block: &Block,
        signatures: Vec<BlockSignature>,
    ) -> Result<()> {
        // Collect signatures from validators
        let mut signed_validators = 0;
        let mut signed_validator_accounts = std::collections::HashSet::new();
        let total_validators = self.validators.count();

        for sig in signatures {
            if self.validators.is_validator(&sig.validator) {
                // Verify signature
                self.verify_signature(block, &sig.proof)?;
                
                // Record signature for slashing detection
                if let Err(e) = self.slashing.record_signature(sig.validator, block) {
                    // Double signing detected - slash validator
                    warn!("Double signing detected: {:?}", e);
                    self.slashing.slash_double_signing(&mut self.storage, &mut self.validators, sig.validator)?;
                    continue; // Don't count this signature
                }
                
                signed_validators += 1;
                signed_validator_accounts.insert(sig.validator);
            }
        }
        
        // Check for validators who should have signed but didn't (downtime)
        let block_number = block.header.block_number;
        // Collect accounts to slash first to avoid borrow checker issues
        let mut accounts_to_slash: Vec<([u8; 32], u64)> = Vec::new();
        for (account, validator) in self.validators.iter() {
            if validator.active && !signed_validator_accounts.contains(account) {
                self.slashing.record_missed_block(&mut self.storage, *account, block_number);
                
                // Check if should slash and collect for later
                if self.slashing.should_slash_downtime(*account) {
                    let missed = self.slashing.get_missed_blocks(*account);
                    accounts_to_slash.push((*account, missed));
                }
            }
        }
        
        // Now perform slashing outside the iterator
        for (account, missed) in accounts_to_slash {
            warn!("Slashing validator {:?} for downtime: {} missed blocks", 
                hex::encode(account), missed);
            self.slashing.slash_downtime(&mut self.storage, &mut self.validators, account, missed)?;
        }

        // Require 2/3+ agreement (BFT)
        let required = (total_validators * 2) / 3 + 1;
        if signed_validators < required {
            return Err(ConsensusError::InsufficientSignatures {
                required,
                received: signed_validators,
            });
        }

        // Finalize block
        self.finality.finalize(block)?;

        // Check if era transition is needed
        if self.should_transition_era() {
            self.transition_era()?;
        }

        Ok(())
    }

    /// Calculate extrinsics root
    fn calculate_extrinsics_root(&self, transactions: &[Transaction]) -> [u8; 32] {
        use blake2::{Blake2b512, Digest};
        let mut hasher = Blake2b512::new();
        for tx in transactions {
            let encoded = tx.encode();
            hasher.update(&encoded);
        }
        let hash = hasher.finalize();
        let mut result = [0u8; 32];
        result.copy_from_slice(&hash[..32]);
        result
    }

    /// Get current timestamp
    fn get_timestamp(&self) -> u64 {
        // TODO: Get actual timestamp
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_millis() as u64
    }

    /// Sign a block with validator's signing key
    fn sign_block(&self, block: &Block, validator: [u8; 32]) -> Result<[u8; 64]> {
        let signing_key = self.validator_keys
            .get(&validator)
            .ok_or(ConsensusError::ValidatorNotFound)?;
        
        let message = block.hash();
        let signature = signing_key.sign(&message);
        
        // Convert signature to [u8; 64]
        let mut sig_bytes = [0u8; 64];
        sig_bytes.copy_from_slice(&signature.to_bytes());
        Ok(sig_bytes)
    }

    /// Verify block signature using validator's public key
    fn verify_signature(&self, block: &Block, proof: &BlockProof) -> Result<()> {
        // Get validator's public key from validator set
        let public_key = self.validators
            .get_public_key(&proof.proposer)
            .ok_or(ConsensusError::ValidatorNotFound)?;
        
        // Get block hash as message
        let message = block.hash();
        
        // Parse signature
        let signature = Signature::from_bytes(&proof.signature);
        
        // Verify signature
        public_key.verify(&message, &signature)
            .map_err(|e| ConsensusError::BlockValidationFailed(
                format!("Signature verification failed: {:?}", e)
            ))?;
        
        Ok(())
    }

    /// Verify timestamp is within acceptable range
    fn verify_timestamp(&self, timestamp: u64) -> Result<()> {
        let now = self.get_timestamp();
        let max_future = self.block_time * 10; // Allow 10 blocks in future
        let max_past = self.block_time * 10; // Allow 10 blocks in past

        if timestamp > now + max_future {
            return Err(ConsensusError::TimestampTooFarInFuture);
        }
        if timestamp < now.saturating_sub(max_past) {
            return Err(ConsensusError::TimestampTooFarInPast);
        }

        Ok(())
    }

    /// Get latest block hash from storage
    fn get_latest_hash(&self) -> Result<[u8; 32]> {
        let key = b"Consensus:LatestHash";
        match self.storage.get(key) {
            Some(value) => {
                let mut hash = [0u8; 32];
                if value.len() == 32 {
                    hash.copy_from_slice(&value);
                    Ok(hash)
                } else {
                    Err(ConsensusError::BlockValidationFailed(
                        "Invalid hash length in storage".to_string()
                    ))
                }
            }
            None => Ok([0u8; 32]), // Genesis block hash
        }
    }

    /// Get latest block number from storage
    fn get_latest_block_number(&self) -> Result<u64> {
        let key = b"System:BlockNumber";
        match self.storage.get(key) {
            Some(value) => {
                u64::decode(&mut &value[..])
                    .map_err(|e| ConsensusError::BlockValidationFailed(
                        format!("Failed to decode block number: {:?}", e)
                    ))
            }
            None => Ok(0), // Genesis block
        }
    }

    /// Store block in storage
    pub fn store_block(&mut self, block: &Block) -> Result<()> {
        let block_number = block.header.block_number;
        let block_hash = block.hash();
        
        // Store block by number
        let block_key = Self::block_key(block_number);
        let encoded_block = block.encode();
        self.storage.put(&block_key, &encoded_block);
        
        // Store block by hash
        let hash_key = Self::block_hash_key(block_hash);
        self.storage.put(&hash_key, &block_number.encode());
        
        // Update latest block hash
        let latest_hash_key = b"Consensus:LatestHash";
        self.storage.put(latest_hash_key, &block_hash);
        
        // Update latest block number
        let latest_block_key = b"System:BlockNumber";
        self.storage.put(latest_block_key, &block_number.encode());
        
        // Check if era transition is needed after storing block
        if self.should_transition_era() {
            self.transition_era()?;
        }
        
        Ok(())
    }

    /// Get block by number from storage
    pub fn get_block_by_number(&self, block_number: u64) -> Result<Option<Block>> {
        let key = Self::block_key(block_number);
        match self.storage.get(&key) {
            Some(value) => {
                Block::decode(&mut &value[..])
                    .map(Some)
                    .map_err(|e| ConsensusError::BlockValidationFailed(
                        format!("Failed to decode block: {:?}", e)
                    ))
            }
            None => Ok(None),
        }
    }

    /// Generate storage key for block by number
    fn block_key(block_number: u64) -> Vec<u8> {
        let mut key = b"Block:".to_vec();
        key.extend_from_slice(&block_number.to_le_bytes());
        key
    }

    /// Generate storage key for block by hash
    fn block_hash_key(hash: [u8; 32]) -> Vec<u8> {
        let mut key = b"BlockHash:".to_vec();
        key.extend_from_slice(&hash);
        key
    }

    /// Handle era transition
    /// This should be called when a new era begins
    pub fn transition_era(&mut self) -> Result<()> {
        let current_block = self.get_latest_block_number().unwrap_or(0);
        let new_era = current_block / self.era_length;
        
        // Only transition if we're actually at an era boundary
        if !self.should_transition_era() && new_era == self.current_era {
            return Ok(()); // Not at era boundary yet
        }

        // Calculate and distribute rewards for previous era
        self.distribute_era_rewards()?;

        // Update era
        self.current_era = new_era;
        
        // Reset transaction fees for new era
        self.transaction_fees = 0;
        
        // Store era in storage
        let era_key = b"Consensus:CurrentEra";
        self.storage.put(era_key, &self.current_era.encode());

        Ok(())
    }

    /// Distribute rewards for the completed era
    fn distribute_era_rewards(&mut self) -> Result<()> {
        // Calculate total rewards for the era
        // Base reward per block * blocks in era + transaction fees
        let blocks_in_era: u128 = self.era_length as u128;
        let base_reward_per_block = 1000u128; // 1000 CGT per block (configurable)
        let total_base_rewards = base_reward_per_block * blocks_in_era;
        
        // Add accumulated transaction fees
        let total_rewards = total_base_rewards + self.transaction_fees;
        
        // Allocate rewards: 20% to proposers, 80% to validators
        let proposer_share = total_rewards * 20 / 100;
        let validator_share = total_rewards * 80 / 100;
        
        // Distribute proposer rewards (simplified - in production, track per block)
        let proposer_count = self.validators.count() as u128;
        if proposer_count > 0 {
            let proposer_reward_per_validator = proposer_share / proposer_count;
            // Collect validators to update first
            let validators_to_update: Vec<Validator> = self.validators.iter()
                .map(|(_account, validator)| {
                    let mut updated_validator = validator.clone();
                    updated_validator.stake += proposer_reward_per_validator;
                    updated_validator
                })
                .collect();
            
            // Update validators outside the iterator
            for updated_validator in validators_to_update {
                self.validators.register_validator(updated_validator);
            }
        }
        
        // Distribute validator rewards based on stake weight (including staking pools)
        let total_stake = self.validators.total_stake();
        if total_stake > 0 {
            // Collect validators to update first
            let mut validators_to_update: Vec<Validator> = Vec::new();
            let mut pool_updates: Vec<([u8; 32], Vec<([u8; 32], u128)>)> = Vec::new();
            
            for (account, validator) in self.validators.iter() {
                // Get staking pool for this validator
                let pool_stake = self.staking_pools
                    .get(account)
                    .map(|pool| pool.total_stake())
                    .unwrap_or(0);
                
                // Total stake = validator's own stake + pool stake
                let total_validator_stake = validator.stake + pool_stake;
                
                // Calculate validator's share based on total stake
                let validator_reward = (validator_share * total_validator_stake) / total_stake;
                
                // Apply commission
                let commission_amount = (validator_reward * validator.commission as u128) / 100;
                let validator_net_reward = validator_reward - commission_amount;
                
                // Prepare validator update (validator gets net reward + commission)
                let mut updated_validator = validator.clone();
                updated_validator.stake += validator_net_reward + commission_amount;
                validators_to_update.push(updated_validator);
                
                // Collect nominator distributions
                if let Some(pool) = self.staking_pools.get(account) {
                    if pool.total_stake() > 0 {
                        let mut nominator_shares = Vec::new();
                        let stakes = pool.stakes();
                        for (_staker_account, stake) in stakes.iter() {
                            let nominator_share = (validator_net_reward * stake.amount) / pool.total_stake();
                            nominator_shares.push((*_staker_account, nominator_share));
                            // TODO: Distribute to nominator account via balances module
                            // For now, we'll track it in the staking pool
                            // In production, we'd call: BalancesModule::mint(storage, *staker_account, nominator_share)
                        }
                        pool_updates.push((*account, nominator_shares));
                    }
                }
            }
            
            // Update validators outside the iterator
            for updated_validator in validators_to_update {
                self.validators.register_validator(updated_validator);
            }
            
            // Apply pool updates (if needed in the future)
            // Pool updates are handled above during collection
            // Future: distribute rewards to nominator accounts
            let _ = pool_updates; // Acknowledge that pool_updates is collected but not yet used
        }
        
        Ok(())
    }

    /// Collect transaction fees from a block
    pub fn collect_transaction_fees(&mut self, block: &Block) -> u128 {
        // Calculate fees from transactions
        // For now, use a simple fee model: 1 CGT per transaction
        // In production, fees would be specified in transactions
        let fee_per_tx = 1u128;
        let total_fees = block.transactions.len() as u128 * fee_per_tx;
        
        // Accumulate fees for current era
        self.transaction_fees += total_fees;
        
        total_fees
    }

    /// Get accumulated transaction fees for current era
    pub fn get_transaction_fees(&self) -> u128 {
        self.transaction_fees
    }

    /// Calculate state root from storage
    pub fn calculate_state_root(&self) -> Result<[u8; 32]> {
        
        // Get all storage keys and values
        // Note: This is a simplified implementation
        // In production, we'd use a more efficient method to calculate state root
        // For now, we'll use a placeholder that represents the state
        
        // TODO: Implement proper state root calculation
        // This would involve:
        // 1. Iterating through all storage keys
        // 2. Creating Merkle tree from key-value pairs
        // 3. Returning root hash
        
        // Placeholder: return hash of "state" for now
        use blake2::{Blake2b512, Digest};
        let mut hasher = Blake2b512::new();
        hasher.update(b"state_root_placeholder");
        let hash = hasher.finalize();
        let mut result = [0u8; 32];
        result.copy_from_slice(&hash[..32]);
        Ok(result)
    }

    /// Verify state root matches calculated root
    pub fn verify_state_root(&self, expected_state_root: [u8; 32]) -> Result<()> {
        let calculated_root = self.calculate_state_root()?;
        
        if calculated_root != expected_state_root {
            return Err(ConsensusError::BlockValidationFailed(
                format!(
                    "State root mismatch: expected {:?}, got {:?}",
                    hex::encode(expected_state_root),
                    hex::encode(calculated_root)
                )
            ));
        }
        
        Ok(())
    }

    /// Create or get staking pool for a validator
    pub fn get_or_create_staking_pool(&mut self, validator: [u8; 32], commission: u8) -> &mut StakingPool {
        self.staking_pools
            .entry(validator)
            .or_insert_with(|| StakingPool::new(validator, commission))
    }

    /// Nominate a validator (add stake to their pool)
    pub fn nominate_validator(
        &mut self,
        validator: [u8; 32],
        nominator: [u8; 32],
        amount: u128,
    ) -> Result<()> {
        let validator_info = self.validators
            .get_validator(&validator)
            .ok_or(ConsensusError::ValidatorNotFound)?
            .clone();
        
        let current_era = self.current_era;
        let pool = self.get_or_create_staking_pool(validator, validator_info.commission);
        pool.stake(nominator, amount, current_era)?;
        
        // Update validator's total stake (includes pool stake)
        let mut updated_validator = validator_info;
        updated_validator.stake += amount; // Add to validator's stake
        self.validators.register_validator(updated_validator);
        
        Ok(())
    }

    /// Load current era from storage
    fn load_current_era(storage: &S) -> Option<u64> {
        let era_key = b"Consensus:CurrentEra";
        storage.get(era_key).and_then(|value| {
            u64::decode(&mut &value[..]).ok()
        })
    }
}


/// Block proof from proposer
#[derive(Clone, Debug)]
pub struct BlockProof {
    pub proposer: [u8; 32],
    pub signature: [u8; 64],
    pub timestamp: u64,
}

/// Block signature from validator
#[derive(Clone, Debug)]
pub struct BlockSignature {
    pub validator: [u8; 32],
    pub proof: BlockProof,
}
