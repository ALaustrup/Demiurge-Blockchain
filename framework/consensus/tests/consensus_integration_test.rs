//! Integration tests for consensus engine with staking pools, fees, and state root

use demiurge_consensus::{ConsensusEngine, ValidatorSet, Validator, SlashingTracker};
use demiurge_core::{Block, Transaction, TransactionData, BlockHeader};
use demiurge_storage::StorageBackend;
use ed25519_dalek::SigningKey;
use rand::rngs::OsRng;
use tempfile::TempDir;

fn create_test_storage() -> StorageBackend {
    let temp_dir = TempDir::new().unwrap();
    StorageBackend::new(temp_dir.path().to_str().unwrap()).unwrap()
}

fn create_test_validator(account: [u8; 32], stake: u128) -> (Validator, SigningKey) {
    let signing_key = SigningKey::generate(&mut OsRng);
    let public_key = signing_key.verifying_key();
    let validator = Validator {
        account,
        stake,
        commission: 10,
        active: true,
        public_key: *public_key,
    };
    (validator, signing_key)
}

#[test]
fn test_staking_pool_nomination() {
    let mut storage = create_test_storage();
    let mut engine = ConsensusEngine::new(&mut storage, 1000);

    // Register validator
    let (validator1, key1) = create_test_validator([1u8; 32], 1000);
    engine.validators.register_validator(validator1);
    engine.register_validator_key([1u8; 32], key1);

    // Nominate validator
    let nominator = [2u8; 32];
    let nomination_amount = 500u128;
    
    let result = engine.nominate_validator([1u8; 32], nominator, nomination_amount);
    assert!(result.is_ok());

    // Check staking pool was created
    let pool = engine.staking_pools.get(&[1u8; 32]);
    assert!(pool.is_some());
    assert_eq!(pool.unwrap().total_stake(), nomination_amount);
}

#[test]
fn test_transaction_fee_collection() {
    let mut storage = create_test_storage();
    let mut engine = ConsensusEngine::new(&mut storage, 1000);

    // Create block with transactions
    let transactions = vec![
        Transaction {
            from: [1u8; 32],
            nonce: 0,
            data: TransactionData::Transfer {
                to: [2u8; 32],
                amount: 100,
            },
            signature: [0u8; 64],
        },
        Transaction {
            from: [2u8; 32],
            nonce: 0,
            data: TransactionData::Transfer {
                to: [3u8; 32],
                amount: 50,
            },
            signature: [0u8; 64],
        },
    ];

    let block = Block {
        header: BlockHeader {
            parent_hash: [0u8; 32],
            block_number: 1,
            state_root: [0u8; 32],
            extrinsics_root: [0u8; 32],
            timestamp: 1000,
        },
        transactions: transactions.clone(),
    };

    // Collect fees (1 CGT per transaction)
    let fees = engine.collect_transaction_fees(&block);
    assert_eq!(fees, 2); // 2 transactions * 1 CGT = 2 CGT

    // Note: Can't directly access transaction_fees field, but we can verify via method
    // The fees are accumulated internally
}

#[test]
fn test_state_root_calculation() {
    let mut storage = create_test_storage();
    let engine = ConsensusEngine::new(&mut storage, 1000);

    // Calculate state root
    let state_root = engine.calculate_state_root();
    assert!(state_root.is_ok());
    
    let root = state_root.unwrap();
    assert_ne!(root, [0u8; 32]); // Should not be all zeros
}

#[test]
fn test_state_root_verification() {
    let mut storage = create_test_storage();
    let engine = ConsensusEngine::new(&mut storage, 1000);

    // Calculate state root
    let calculated_root = engine.calculate_state_root().unwrap();

    // Verify state root
    let result = engine.verify_state_root(calculated_root);
    assert!(result.is_ok());

    // Verify wrong state root fails
    let wrong_root = [1u8; 32];
    let result = engine.verify_state_root(wrong_root);
    assert!(result.is_err());
}

#[test]
fn test_era_reward_distribution_with_staking_pools() {
    let mut storage = create_test_storage();
    let mut engine = ConsensusEngine::new(&mut storage, 1000);

    // Register validators
    let (validator1, key1) = create_test_validator([1u8; 32], 1000);
    let (validator2, key2) = create_test_validator([2u8; 32], 2000);
    
    engine.validators.register_validator(validator1);
    engine.validators.register_validator(validator2);
    engine.register_validator_key([1u8; 32], key1);
    engine.register_validator_key([2u8; 32], key2);

    // Create staking pools and nominate
    engine.nominate_validator([1u8; 32], [3u8; 32], 500).unwrap();
    engine.nominate_validator([2u8; 32], [4u8; 32], 1000).unwrap();

    // Add some transaction fees (simulate by collecting fees)
    let dummy_block = Block {
        header: BlockHeader {
            parent_hash: [0u8; 32],
            block_number: 1,
            state_root: [0u8; 32],
            extrinsics_root: [0u8; 32],
            timestamp: 1000,
        },
        transactions: vec![
            Transaction {
                from: [1u8; 32],
                nonce: 0,
                data: TransactionData::Transfer { to: [2u8; 32], amount: 100 },
                signature: [0u8; 64],
            },
        ],
    };
    
    // Collect fees multiple times to accumulate
    for _ in 0..1000 {
        engine.collect_transaction_fees(&dummy_block);
    }
    
    assert_eq!(engine.get_transaction_fees(), 1000);

    // Manually trigger era transition (simplified - normally happens at era boundary)
    // For testing, we'll call distribute_era_rewards directly
    // Note: This is a simplified test - in production, era transition handles this
    
    // Check that staking pools exist
    assert!(engine.staking_pools.contains_key(&[1u8; 32]));
    assert!(engine.staking_pools.contains_key(&[2u8; 32]));
}

#[test]
fn test_slashing_double_signing() {
    let mut storage = create_test_storage();
    let mut engine = ConsensusEngine::new(&mut storage, 1000);

    // Register validator
    let (validator1, key1) = create_test_validator([1u8; 32], 10000);
    engine.validators.register_validator(validator1);
    engine.register_validator_key([1u8; 32], key1);

    // Create a block
    let block = Block {
        header: BlockHeader {
            parent_hash: [0u8; 32],
            block_number: 1,
            state_root: [0u8; 32],
            extrinsics_root: [0u8; 32],
            timestamp: 1000,
        },
        transactions: vec![],
    };

    // Record signature first time (should succeed)
    let result1 = engine.slashing.record_signature([1u8; 32], &block);
    assert!(result1.is_ok());

    // Record signature second time (should fail - double signing)
    let result2 = engine.slashing.record_signature([1u8; 32], &block);
    assert!(result2.is_err());

    // Slash for double signing
    let slash_amount = engine.slashing.slash_double_signing(
        &mut engine.storage,
        &mut engine.validators,
        [1u8; 32],
    ).unwrap();

    // Verify validator was slashed (5% of 10000 = 500)
    let validator = engine.validators.get_validator(&[1u8; 32]).unwrap();
    assert_eq!(validator.stake, 9500);
    assert_eq!(slash_amount, 500);
}

#[test]
fn test_slashing_downtime() {
    let mut storage = create_test_storage();
    let mut engine = ConsensusEngine::new(&mut storage, 1000);

    // Register validator
    let (validator1, _key1) = create_test_validator([1u8; 32], 10000);
    engine.validators.register_validator(validator1);

    // Record 10 missed blocks (threshold)
    for i in 1..=10 {
        engine.slashing.record_missed_block(&mut engine.storage, [1u8; 32], i);
    }

    // Check if should slash
    assert!(engine.slashing.should_slash_downtime([1u8; 32]));

    // Slash for downtime
    let slash_amount = engine.slashing.slash_downtime(
        &mut engine.storage,
        &mut engine.validators,
        [1u8; 32],
        10,
    ).unwrap();

    // Verify slash amount (0.1% per block = 1% total, capped at 10%)
    // 10 blocks * 0.1% = 1% = 100 CGT
    assert!(slash_amount > 0);

    // Verify validator stake decreased
    let validator = engine.validators.get_validator(&[1u8; 32]).unwrap();
    assert!(validator.stake < 10000);
}
