//! Consensus engine - Hybrid PoS + BFT

use crate::{Finality, Result, ValidatorSet, ConsensusError};
use demiurge_core::{Block, Transaction};
use demiurge_storage::Storage;
use std::collections::HashMap;

/// Consensus engine combining PoS and BFT
pub struct ConsensusEngine<S: Storage> {
    validators: ValidatorSet,
    finality: Finality,
    storage: S,
    current_era: u64,
    block_time: u64, // Block time in milliseconds
}

impl<S: Storage> ConsensusEngine<S> {
    /// Create a new consensus engine
    pub fn new(storage: S, block_time_ms: u64) -> Self {
        Self {
            validators: ValidatorSet::new(),
            finality: Finality::new(),
            storage,
            current_era: 0,
            block_time: block_time_ms,
        }
    }

    /// Propose a new block
    /// Returns the proposed block and proof
    pub fn propose_block(
        &mut self,
        transactions: Vec<Transaction>,
        proposer: [u8; 32], // Validator account
    ) -> Result<(Block, BlockProof)> {
        // Select proposer based on stake (PoS)
        let selected_proposer = self.validators.select_proposer()?;
        if selected_proposer != proposer {
            return Err(ConsensusError::InvalidProposer);
        }

        // Create block header
        let header = demiurge_core::BlockHeader {
            parent_hash: self.get_latest_hash()?,
            block_number: self.get_latest_block_number()? + 1,
            state_root: [0u8; 32], // Will be calculated after execution
            extrinsics_root: self.calculate_extrinsics_root(&transactions),
            timestamp: self.get_timestamp(),
        };

        // Create block
        let block = Block {
            header: header.clone(),
            transactions,
        };

        // Create proof
        let proof = BlockProof {
            proposer,
            signature: self.sign_block(&block, proposer)?,
            timestamp: block.header.timestamp,
        };

        Ok((block, proof))
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
        let total_validators = self.validators.count();

        for sig in signatures {
            if self.validators.is_validator(&sig.validator) {
                if self.verify_signature(block, &sig.proof)? {
                    signed_validators += 1;
                }
            }
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

        Ok(())
    }

    /// Get latest block hash
    fn get_latest_hash(&self) -> Result<[u8; 32]> {
        // TODO: Get from storage
        Ok([0u8; 32])
    }

    /// Get latest block number
    fn get_latest_block_number(&self) -> Result<u64> {
        // TODO: Get from storage
        Ok(0)
    }

    /// Calculate extrinsics root
    fn calculate_extrinsics_root(&self, transactions: &[Transaction]) -> [u8; 32] {
        use blake2::{Blake2b512, Digest};
        let mut hasher = Blake2b512::new();
        for tx in transactions {
            hasher.update(&tx.encode());
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

    /// Sign a block
    fn sign_block(&self, block: &Block, validator: [u8; 32]) -> Result<[u8; 64]> {
        // TODO: Implement actual signing
        let message = block.hash();
        // For now, return placeholder
        Ok([0u8; 64])
    }

    /// Verify block signature
    fn verify_signature(&self, block: &CoreBlock, proof: &BlockProof) -> Result<()> {
        // TODO: Implement actual verification
        let message = block.hash();
        // For now, always succeed
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
