//! CVP Consensus Integration
//!
//! Integrates Consensus-Verified Polymorphism with the Demiurge consensus engine.
//! Provides hooks for era transitions, proof validation, and attack detection.

use crate::{
    CvpEngine, CvpConfig, EquivalenceProof, MutationResult,
    ContractId, SemanticIR, Result, CvpError,
};
use codec::{Decode, Encode};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// CVP Consensus Integration
/// 
/// This struct provides the bridge between the CVP engine and the consensus layer.
/// It handles:
/// - Era/epoch synchronization
/// - Block-level proof inclusion
/// - Attack pattern detection
/// - Emergency response coordination
pub struct CvpConsensusIntegration {
    /// The CVP engine
    engine: CvpEngine,
    
    /// Pending proofs to include in next block
    pending_proofs: Vec<EquivalenceProof>,
    
    /// Attack detector
    attack_detector: AttackDetector,
    
    /// Recent block hashes for epoch seed generation
    recent_block_hashes: Vec<[u8; 32]>,
    
    /// Maximum block hashes to keep
    max_block_hashes: usize,
    
    /// Whether CVP mutations are pending validation
    pending_mutations: bool,
}

impl CvpConsensusIntegration {
    /// Create new CVP consensus integration
    pub fn new(config: CvpConfig) -> Self {
        Self {
            engine: CvpEngine::with_config(config),
            pending_proofs: Vec::new(),
            attack_detector: AttackDetector::new(),
            recent_block_hashes: Vec::new(),
            max_block_hashes: 10,
            pending_mutations: false,
        }
    }
    
    /// Create with default configuration
    pub fn default_config() -> Self {
        Self::new(CvpConfig::default())
    }
    
    /// Register a contract for CVP protection
    pub fn register_contract(
        &self,
        id: ContractId,
        semantic_ir: SemanticIR,
        bytecode: Vec<u8>,
    ) -> Result<()> {
        self.engine.register_contract(id, semantic_ir, bytecode)
    }
    
    /// Called when a new block is finalized
    /// 
    /// This should be called from `ConsensusEngine::finalize_block()`
    pub fn on_block_finalized(
        &mut self,
        block_number: u64,
        block_hash: [u8; 32],
        transactions: &[TransactionInfo],
    ) -> Result<CvpBlockResult> {
        // Store block hash for seed generation
        self.recent_block_hashes.push(block_hash);
        if self.recent_block_hashes.len() > self.max_block_hashes {
            self.recent_block_hashes.remove(0);
        }
        
        // Analyze transactions for attack patterns
        let threats = self.attack_detector.analyze_block(block_number, transactions);
        
        // Handle any detected threats
        let mut emergency_mutations = Vec::new();
        for threat in &threats {
            if threat.severity >= ThreatSeverity::Critical {
                // Trigger emergency mutation
                if let Some(contract_id) = threat.target_contract {
                    match self.engine.emergency_mutate(&contract_id, &threat.description) {
                        Ok(result) => {
                            emergency_mutations.push(result);
                        }
                        Err(e) => {
                            tracing::error!("CVP: Emergency mutation failed: {}", e);
                        }
                    }
                }
            }
        }
        
        // Check if epoch transition is needed
        let epoch_mutations = if self.engine.should_mutate(block_number) {
            self.perform_epoch_transition(block_number)?
        } else {
            Vec::new()
        };
        
        Ok(CvpBlockResult {
            block_number,
            threats_detected: threats,
            emergency_mutations,
            epoch_mutations,
        })
    }
    
    /// Perform epoch transition with CVP mutations
    fn perform_epoch_transition(&mut self, block_number: u64) -> Result<Vec<MutationResult>> {
        tracing::info!("CVP: Performing epoch transition at block {}", block_number);
        
        let results = self.engine.transition_epoch(
            block_number,
            &self.recent_block_hashes,
        )?;
        
        // Queue proofs for inclusion in next block
        for result in &results {
            self.pending_proofs.push(result.proof.clone());
        }
        
        self.pending_mutations = !results.is_empty();
        
        Ok(results)
    }
    
    /// Get pending proofs for block inclusion
    pub fn take_pending_proofs(&mut self) -> Vec<EquivalenceProof> {
        std::mem::take(&mut self.pending_proofs)
    }
    
    /// Verify CVP proofs in a block
    /// 
    /// Called during block validation
    pub fn verify_block_proofs(&self, proofs: &[EquivalenceProof]) -> Result<bool> {
        for proof in proofs {
            if !self.engine.verify_proof(proof)? {
                return Ok(false);
            }
        }
        Ok(true)
    }
    
    /// Get current bytecode for a contract
    pub fn get_bytecode(&self, contract_id: &ContractId) -> Result<Option<Vec<u8>>> {
        self.engine.get_bytecode(contract_id)
    }
    
    /// Get engine statistics
    pub fn stats(&self) -> CvpStats {
        let engine_stats = self.engine.stats();
        CvpStats {
            enabled: engine_stats.enabled,
            current_epoch: engine_stats.current_epoch,
            registered_contracts: engine_stats.registered_contracts,
            total_mutations: engine_stats.total_mutations,
            threats_detected: self.attack_detector.total_threats_detected(),
            pending_proofs: self.pending_proofs.len(),
        }
    }
    
    /// Check if there are pending mutations awaiting proof inclusion
    pub fn has_pending_mutations(&self) -> bool {
        self.pending_mutations
    }
    
    /// Mark mutations as included in block
    pub fn mutations_included(&mut self) {
        self.pending_mutations = false;
    }
}

/// Result of CVP processing for a block
#[derive(Debug, Clone)]
pub struct CvpBlockResult {
    pub block_number: u64,
    pub threats_detected: Vec<Threat>,
    pub emergency_mutations: Vec<MutationResult>,
    pub epoch_mutations: Vec<MutationResult>,
}

/// CVP integration statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CvpStats {
    pub enabled: bool,
    pub current_epoch: u64,
    pub registered_contracts: usize,
    pub total_mutations: u64,
    pub threats_detected: u64,
    pub pending_proofs: usize,
}

/// Transaction info for attack detection
#[derive(Debug, Clone)]
pub struct TransactionInfo {
    /// Transaction hash
    pub hash: [u8; 32],
    
    /// Sender address
    pub sender: [u8; 32],
    
    /// Target contract (if any)
    pub target_contract: Option<ContractId>,
    
    /// Function selector called
    pub function_selector: Option<[u8; 4]>,
    
    /// Gas used
    pub gas_used: u64,
    
    /// Value transferred
    pub value: u128,
    
    /// Whether transaction succeeded
    pub success: bool,
    
    /// Internal call depth
    pub call_depth: u8,
    
    /// Timestamp
    pub timestamp: u64,
}

/// Attack detection system
pub struct AttackDetector {
    /// Registered threat patterns
    patterns: Vec<Box<dyn ThreatPattern>>,
    
    /// Historical transaction data for pattern analysis
    transaction_history: TransactionHistory,
    
    /// Total threats detected
    total_threats: u64,
    
    /// Configuration
    config: AttackDetectorConfig,
}

impl AttackDetector {
    pub fn new() -> Self {
        let mut detector = Self {
            patterns: Vec::new(),
            transaction_history: TransactionHistory::new(),
            total_threats: 0,
            config: AttackDetectorConfig::default(),
        };
        
        // Register default patterns
        detector.register_default_patterns();
        detector
    }
    
    /// Register default threat patterns
    fn register_default_patterns(&mut self) {
        self.patterns.push(Box::new(HighFrequencyPattern::new()));
        self.patterns.push(Box::new(ReentrancyPattern::new()));
        self.patterns.push(Box::new(FlashLoanPattern::new()));
        self.patterns.push(Box::new(AnomalousGasPattern::new()));
        self.patterns.push(Box::new(SandwichAttackPattern::new()));
    }
    
    /// Analyze a block for threats
    pub fn analyze_block(
        &mut self,
        block_number: u64,
        transactions: &[TransactionInfo],
    ) -> Vec<Threat> {
        let mut threats = Vec::new();
        
        // Add transactions to history
        for tx in transactions {
            self.transaction_history.add(block_number, tx.clone());
        }
        
        // Run each pattern detector
        for pattern in &self.patterns {
            let pattern_threats = pattern.detect(
                block_number,
                transactions,
                &self.transaction_history,
            );
            
            for threat in pattern_threats {
                if threat.severity >= self.config.min_severity {
                    self.total_threats += 1;
                    threats.push(threat);
                }
            }
        }
        
        // Clean old history
        self.transaction_history.prune(block_number.saturating_sub(100));
        
        threats
    }
    
    /// Get total threats detected
    pub fn total_threats_detected(&self) -> u64 {
        self.total_threats
    }
}

impl Default for AttackDetector {
    fn default() -> Self {
        Self::new()
    }
}

/// Attack detector configuration
#[derive(Debug, Clone)]
pub struct AttackDetectorConfig {
    /// Minimum severity to report
    pub min_severity: ThreatSeverity,
    
    /// History window in blocks
    pub history_window: u64,
}

impl Default for AttackDetectorConfig {
    fn default() -> Self {
        Self {
            min_severity: ThreatSeverity::Low,
            history_window: 100,
        }
    }
}

/// A detected threat
#[derive(Debug, Clone)]
pub struct Threat {
    /// Threat type
    pub threat_type: ThreatType,
    
    /// Severity level
    pub severity: ThreatSeverity,
    
    /// Description
    pub description: String,
    
    /// Target contract (if identified)
    pub target_contract: Option<ContractId>,
    
    /// Related transactions
    pub related_transactions: Vec<[u8; 32]>,
    
    /// Block where detected
    pub block_number: u64,
    
    /// Recommended action
    pub recommended_action: RecommendedAction,
}

/// Types of threats
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Encode, Decode, Serialize, Deserialize)]
pub enum ThreatType {
    /// High frequency calls to same function
    HighFrequency,
    /// Re-entrancy attack pattern
    Reentrancy,
    /// Flash loan attack pattern
    FlashLoan,
    /// Unusual gas consumption
    AnomalousGas,
    /// Sandwich attack (front/back running)
    SandwichAttack,
    /// Price manipulation
    PriceManipulation,
    /// Access control probe
    AccessControlProbe,
    /// Unknown pattern
    Unknown,
}

/// Threat severity levels
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Encode, Decode, Serialize, Deserialize)]
pub enum ThreatSeverity {
    /// Informational - just logging
    Info = 0,
    /// Low - monitor
    Low = 1,
    /// Medium - alert operators
    Medium = 2,
    /// High - consider emergency mutation
    High = 3,
    /// Critical - trigger emergency mutation
    Critical = 4,
}

/// Recommended action for a threat
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum RecommendedAction {
    /// Just log the event
    Log,
    /// Alert operators
    Alert,
    /// Schedule early mutation
    ScheduleMutation,
    /// Trigger emergency mutation immediately
    EmergencyMutation,
    /// Pause contract (if supported)
    PauseContract,
}

/// Trait for threat patterns
pub trait ThreatPattern: Send + Sync {
    /// Pattern name
    fn name(&self) -> &str;
    
    /// Detect threats in current block
    fn detect(
        &self,
        block_number: u64,
        transactions: &[TransactionInfo],
        history: &TransactionHistory,
    ) -> Vec<Threat>;
}

/// Transaction history for pattern analysis
pub struct TransactionHistory {
    /// Transactions by block
    by_block: HashMap<u64, Vec<TransactionInfo>>,
    
    /// Transactions by sender
    by_sender: HashMap<[u8; 32], Vec<(u64, TransactionInfo)>>,
    
    /// Transactions by target contract
    by_contract: HashMap<ContractId, Vec<(u64, TransactionInfo)>>,
}

impl TransactionHistory {
    pub fn new() -> Self {
        Self {
            by_block: HashMap::new(),
            by_sender: HashMap::new(),
            by_contract: HashMap::new(),
        }
    }
    
    /// Add a transaction to history
    pub fn add(&mut self, block: u64, tx: TransactionInfo) {
        // By block
        self.by_block
            .entry(block)
            .or_insert_with(Vec::new)
            .push(tx.clone());
        
        // By sender
        self.by_sender
            .entry(tx.sender)
            .or_insert_with(Vec::new)
            .push((block, tx.clone()));
        
        // By contract
        if let Some(contract) = tx.target_contract {
            self.by_contract
                .entry(contract)
                .or_insert_with(Vec::new)
                .push((block, tx));
        }
    }
    
    /// Get transactions for a sender in recent blocks
    pub fn get_sender_transactions(
        &self,
        sender: &[u8; 32],
        min_block: u64,
    ) -> Vec<&TransactionInfo> {
        self.by_sender
            .get(sender)
            .map(|txs| {
                txs.iter()
                    .filter(|(block, _)| *block >= min_block)
                    .map(|(_, tx)| tx)
                    .collect()
            })
            .unwrap_or_default()
    }
    
    /// Get transactions for a contract in recent blocks
    pub fn get_contract_transactions(
        &self,
        contract: &ContractId,
        min_block: u64,
    ) -> Vec<&TransactionInfo> {
        self.by_contract
            .get(contract)
            .map(|txs| {
                txs.iter()
                    .filter(|(block, _)| *block >= min_block)
                    .map(|(_, tx)| tx)
                    .collect()
            })
            .unwrap_or_default()
    }
    
    /// Prune old transactions
    pub fn prune(&mut self, min_block: u64) {
        self.by_block.retain(|block, _| *block >= min_block);
        
        for txs in self.by_sender.values_mut() {
            txs.retain(|(block, _)| *block >= min_block);
        }
        
        for txs in self.by_contract.values_mut() {
            txs.retain(|(block, _)| *block >= min_block);
        }
    }
}

impl Default for TransactionHistory {
    fn default() -> Self {
        Self::new()
    }
}

// ============================================================================
// THREAT PATTERNS
// ============================================================================

/// High frequency call pattern
/// Detects when same address calls same function many times rapidly
pub struct HighFrequencyPattern {
    /// Threshold for high frequency (calls per block)
    threshold: usize,
}

impl HighFrequencyPattern {
    pub fn new() -> Self {
        Self { threshold: 10 }
    }
}

impl Default for HighFrequencyPattern {
    fn default() -> Self {
        Self::new()
    }
}

impl ThreatPattern for HighFrequencyPattern {
    fn name(&self) -> &str {
        "HighFrequency"
    }
    
    fn detect(
        &self,
        block_number: u64,
        transactions: &[TransactionInfo],
        _history: &TransactionHistory,
    ) -> Vec<Threat> {
        let mut threats = Vec::new();
        
        // Count calls per (sender, contract, function)
        let mut call_counts: HashMap<([u8; 32], ContractId, [u8; 4]), Vec<[u8; 32]>> = HashMap::new();
        
        for tx in transactions {
            if let (Some(contract), Some(selector)) = (tx.target_contract, tx.function_selector) {
                let key = (tx.sender, contract, selector);
                call_counts
                    .entry(key)
                    .or_insert_with(Vec::new)
                    .push(tx.hash);
            }
        }
        
        for ((sender, contract, selector), tx_hashes) in call_counts {
            if tx_hashes.len() >= self.threshold {
                threats.push(Threat {
                    threat_type: ThreatType::HighFrequency,
                    severity: if tx_hashes.len() >= self.threshold * 5 {
                        ThreatSeverity::High
                    } else if tx_hashes.len() >= self.threshold * 2 {
                        ThreatSeverity::Medium
                    } else {
                        ThreatSeverity::Low
                    },
                    description: format!(
                        "High frequency: {} calls to function {:?} on contract {:?} by {:?}",
                        tx_hashes.len(),
                        hex::encode(selector),
                        hex::encode(&contract[..8]),
                        hex::encode(&sender[..8]),
                    ),
                    target_contract: Some(contract),
                    related_transactions: tx_hashes,
                    block_number,
                    recommended_action: RecommendedAction::Alert,
                });
            }
        }
        
        threats
    }
}

/// Re-entrancy attack pattern
/// Detects nested calls that may indicate re-entrancy
pub struct ReentrancyPattern {
    /// Maximum safe call depth
    max_depth: u8,
}

impl ReentrancyPattern {
    pub fn new() -> Self {
        Self { max_depth: 3 }
    }
}

impl Default for ReentrancyPattern {
    fn default() -> Self {
        Self::new()
    }
}

impl ThreatPattern for ReentrancyPattern {
    fn name(&self) -> &str {
        "Reentrancy"
    }
    
    fn detect(
        &self,
        block_number: u64,
        transactions: &[TransactionInfo],
        _history: &TransactionHistory,
    ) -> Vec<Threat> {
        let mut threats = Vec::new();
        
        for tx in transactions {
            if tx.call_depth > self.max_depth {
                threats.push(Threat {
                    threat_type: ThreatType::Reentrancy,
                    severity: if tx.call_depth > self.max_depth + 3 {
                        ThreatSeverity::Critical
                    } else {
                        ThreatSeverity::High
                    },
                    description: format!(
                        "Deep call depth ({}) detected in transaction {:?}",
                        tx.call_depth,
                        hex::encode(&tx.hash[..8]),
                    ),
                    target_contract: tx.target_contract,
                    related_transactions: vec![tx.hash],
                    block_number,
                    recommended_action: if tx.call_depth > self.max_depth + 3 {
                        RecommendedAction::EmergencyMutation
                    } else {
                        RecommendedAction::ScheduleMutation
                    },
                });
            }
        }
        
        threats
    }
}

/// Flash loan attack pattern
/// Detects borrow -> action -> repay in same transaction
pub struct FlashLoanPattern {
    /// Known flash loan function selectors
    flash_loan_selectors: Vec<[u8; 4]>,
}

impl FlashLoanPattern {
    pub fn new() -> Self {
        Self {
            flash_loan_selectors: vec![
                [0x5c, 0xef, 0xf6, 0x20], // flashLoan
                [0xab, 0x9c, 0x4b, 0x5d], // executeOperation
            ],
        }
    }
}

impl Default for FlashLoanPattern {
    fn default() -> Self {
        Self::new()
    }
}

impl ThreatPattern for FlashLoanPattern {
    fn name(&self) -> &str {
        "FlashLoan"
    }
    
    fn detect(
        &self,
        block_number: u64,
        transactions: &[TransactionInfo],
        _history: &TransactionHistory,
    ) -> Vec<Threat> {
        let mut threats = Vec::new();
        
        for tx in transactions {
            if let Some(selector) = tx.function_selector {
                if self.flash_loan_selectors.contains(&selector) {
                    // Flash loan detected - check if it's suspicious
                    // High value + high gas usage = potentially malicious
                    if tx.value > 1_000_000_000 && tx.gas_used > 500_000 {
                        threats.push(Threat {
                            threat_type: ThreatType::FlashLoan,
                            severity: ThreatSeverity::Medium,
                            description: format!(
                                "High-value flash loan detected: {} CGT, {} gas",
                                tx.value / 1_000_000_000,
                                tx.gas_used,
                            ),
                            target_contract: tx.target_contract,
                            related_transactions: vec![tx.hash],
                            block_number,
                            recommended_action: RecommendedAction::Alert,
                        });
                    }
                }
            }
        }
        
        threats
    }
}

/// Anomalous gas pattern
/// Detects unusual gas consumption that may indicate exploit
pub struct AnomalousGasPattern {
    /// Baseline average gas (will be learned)
    baseline_gas: u64,
    /// Standard deviation threshold
    std_dev_threshold: f64,
}

impl AnomalousGasPattern {
    pub fn new() -> Self {
        Self {
            baseline_gas: 100_000,
            std_dev_threshold: 3.0,
        }
    }
}

impl Default for AnomalousGasPattern {
    fn default() -> Self {
        Self::new()
    }
}

impl ThreatPattern for AnomalousGasPattern {
    fn name(&self) -> &str {
        "AnomalousGas"
    }
    
    fn detect(
        &self,
        block_number: u64,
        transactions: &[TransactionInfo],
        history: &TransactionHistory,
    ) -> Vec<Threat> {
        let mut threats = Vec::new();
        
        for tx in transactions {
            if let Some(contract) = tx.target_contract {
                // Get historical gas usage for this contract
                let historical_txs = history.get_contract_transactions(
                    &contract,
                    block_number.saturating_sub(100),
                );
                
                if historical_txs.len() >= 10 {
                    let avg_gas: u64 = historical_txs.iter().map(|t| t.gas_used).sum::<u64>()
                        / historical_txs.len() as u64;
                    
                    // Simple anomaly detection: more than 3x average
                    if tx.gas_used > avg_gas * 3 && tx.gas_used > 1_000_000 {
                        threats.push(Threat {
                            threat_type: ThreatType::AnomalousGas,
                            severity: ThreatSeverity::Medium,
                            description: format!(
                                "Anomalous gas: {} (avg: {}, 3x threshold)",
                                tx.gas_used,
                                avg_gas,
                            ),
                            target_contract: Some(contract),
                            related_transactions: vec![tx.hash],
                            block_number,
                            recommended_action: RecommendedAction::Alert,
                        });
                    }
                }
            }
        }
        
        threats
    }
}

/// Sandwich attack pattern
/// Detects front-running and back-running patterns
pub struct SandwichAttackPattern;

impl SandwichAttackPattern {
    pub fn new() -> Self {
        Self
    }
}

impl Default for SandwichAttackPattern {
    fn default() -> Self {
        Self::new()
    }
}

impl ThreatPattern for SandwichAttackPattern {
    fn name(&self) -> &str {
        "SandwichAttack"
    }
    
    fn detect(
        &self,
        block_number: u64,
        transactions: &[TransactionInfo],
        _history: &TransactionHistory,
    ) -> Vec<Threat> {
        let mut threats = Vec::new();
        
        // Look for pattern: A -> B -> A where A and B are different senders
        // targeting the same contract with similar functions
        
        if transactions.len() < 3 {
            return threats;
        }
        
        for i in 0..transactions.len() - 2 {
            let tx1 = &transactions[i];
            let tx2 = &transactions[i + 1];
            let tx3 = &transactions[i + 2];
            
            // Check for sandwich pattern
            if tx1.sender == tx3.sender 
                && tx1.sender != tx2.sender
                && tx1.target_contract == tx2.target_contract
                && tx2.target_contract == tx3.target_contract
                && tx1.function_selector == tx3.function_selector
            {
                if let Some(contract) = tx1.target_contract {
                    threats.push(Threat {
                        threat_type: ThreatType::SandwichAttack,
                        severity: ThreatSeverity::High,
                        description: format!(
                            "Possible sandwich attack: {:?} sandwiched {:?}",
                            hex::encode(&tx1.sender[..8]),
                            hex::encode(&tx2.sender[..8]),
                        ),
                        target_contract: Some(contract),
                        related_transactions: vec![tx1.hash, tx2.hash, tx3.hash],
                        block_number,
                        recommended_action: RecommendedAction::Alert,
                    });
                }
            }
        }
        
        threats
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    fn make_tx(sender: u8, contract: u8, selector: [u8; 4]) -> TransactionInfo {
        TransactionInfo {
            hash: [sender; 32],
            sender: [sender; 32],
            target_contract: Some([contract; 32]),
            function_selector: Some(selector),
            gas_used: 100_000,
            value: 0,
            success: true,
            call_depth: 1,
            timestamp: 0,
        }
    }
    
    #[test]
    fn test_high_frequency_detection() {
        let pattern = HighFrequencyPattern { threshold: 3 };
        let history = TransactionHistory::new();
        
        // Create 5 transactions from same sender to same function
        let transactions: Vec<_> = (0..5)
            .map(|_| make_tx(1, 2, [0xa9, 0x05, 0x9c, 0xbb]))
            .collect();
        
        let threats = pattern.detect(100, &transactions, &history);
        
        assert_eq!(threats.len(), 1);
        assert_eq!(threats[0].threat_type, ThreatType::HighFrequency);
    }
    
    #[test]
    fn test_reentrancy_detection() {
        let pattern = ReentrancyPattern { max_depth: 3 };
        let history = TransactionHistory::new();
        
        let mut tx = make_tx(1, 2, [0x00; 4]);
        tx.call_depth = 5; // Deep call
        
        let threats = pattern.detect(100, &[tx], &history);
        
        assert_eq!(threats.len(), 1);
        assert_eq!(threats[0].threat_type, ThreatType::Reentrancy);
    }
    
    #[test]
    fn test_sandwich_detection() {
        let pattern = SandwichAttackPattern::new();
        let history = TransactionHistory::new();
        
        // Create sandwich pattern: A -> B -> A
        let transactions = vec![
            make_tx(1, 2, [0x01; 4]), // Attacker front-run
            make_tx(3, 2, [0x02; 4]), // Victim
            make_tx(1, 2, [0x01; 4]), // Attacker back-run
        ];
        
        let threats = pattern.detect(100, &transactions, &history);
        
        assert_eq!(threats.len(), 1);
        assert_eq!(threats[0].threat_type, ThreatType::SandwichAttack);
    }
    
    #[test]
    fn test_attack_detector() {
        let mut detector = AttackDetector::new();
        
        // Normal transactions - no threats
        let normal_txs = vec![make_tx(1, 2, [0x01; 4])];
        let threats = detector.analyze_block(100, &normal_txs);
        assert!(threats.is_empty());
    }
}
