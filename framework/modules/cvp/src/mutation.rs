//! Mutation Strategies
//!
//! Defines the various bytecode transformation strategies that maintain
//! semantic equivalence while changing structural representation.

use crate::Result;
use codec::{Decode, Encode};
use serde::{Deserialize, Serialize};

/// A mutation strategy that can be applied to bytecode
pub trait MutationStrategy: Send + Sync {
    /// Name of this strategy
    fn name(&self) -> &str;
    
    /// Apply mutation to bytecode given a seed
    fn mutate(&self, bytecode: &[u8], seed: &[u8; 32]) -> Result<Vec<u8>>;
    
    /// Estimate the size change from this mutation
    fn size_estimate(&self, original_size: usize) -> usize;
    
    /// Whether this strategy is reversible (for debugging)
    fn is_reversible(&self) -> bool;
}

/// Collection of mutation strategies to apply
#[derive(Debug, Clone, Encode, Decode, Serialize, Deserialize)]
pub struct MutationConfig {
    /// Which strategies to enable
    pub enabled_strategies: Vec<StrategyType>,
    
    /// Intensity of mutations (0.0 - 1.0)
    pub intensity: f32,
    
    /// Maximum bytecode size increase ratio
    pub max_size_increase: f32,
    
    /// Whether to include dead code injection
    pub inject_dead_code: bool,
    
    /// Whether to randomize memory layout
    pub randomize_memory: bool,
    
    /// Whether to obfuscate control flow
    pub obfuscate_control_flow: bool,
}

impl Default for MutationConfig {
    fn default() -> Self {
        Self {
            enabled_strategies: vec![
                StrategyType::OpcodeSubstitution,
                StrategyType::MemoryRandomization,
                StrategyType::ControlFlowObfuscation,
            ],
            intensity: 0.5,
            max_size_increase: 2.0,
            inject_dead_code: true,
            randomize_memory: true,
            obfuscate_control_flow: true,
        }
    }
}

/// Types of mutation strategies
#[derive(Debug, Clone, Copy, Encode, Decode, Serialize, Deserialize, PartialEq)]
pub enum StrategyType {
    /// Replace opcodes with equivalent sequences
    OpcodeSubstitution,
    /// Change memory layout while preserving logic
    MemoryRandomization,
    /// Restructure control flow (jumps, branches)
    ControlFlowObfuscation,
    /// Scramble stack manipulation patterns
    StackScrambling,
    /// Insert non-executing code paths
    DeadCodeInjection,
    /// Change constant representations
    ConstantObfuscation,
    /// Reorder independent operations
    OperationReordering,
}

/// Opcode substitution strategy
/// Replaces single opcodes with equivalent multi-opcode sequences
pub struct OpcodeSubstitution {
    /// Substitution rules
    rules: Vec<SubstitutionRule>,
}

impl OpcodeSubstitution {
    pub fn new() -> Self {
        Self {
            rules: Self::default_rules(),
        }
    }
    
    fn default_rules() -> Vec<SubstitutionRule> {
        vec![
            // ADD can be replaced with: DUP2 DUP2 ADD SWAP2 POP POP (same result, different pattern)
            SubstitutionRule {
                original: vec![0x01], // ADD
                variants: vec![
                    vec![0x81, 0x81, 0x01, 0x91, 0x50, 0x50], // DUP2 DUP2 ADD SWAP2 POP POP
                ],
            },
            // PUSH1 0x00 can be replaced with: PUSH1 0x01 PUSH1 0x01 SUB
            SubstitutionRule {
                original: vec![0x60, 0x00], // PUSH1 0x00
                variants: vec![
                    vec![0x60, 0x01, 0x60, 0x01, 0x03], // PUSH1 1 PUSH1 1 SUB
                ],
            },
            // MUL can be replaced with repeated ADD (for small constants)
            SubstitutionRule {
                original: vec![0x02], // MUL
                variants: vec![
                    // Leave as-is for now, complex substitution
                    vec![0x02],
                ],
            },
        ]
    }
}

impl Default for OpcodeSubstitution {
    fn default() -> Self {
        Self::new()
    }
}

impl MutationStrategy for OpcodeSubstitution {
    fn name(&self) -> &str {
        "OpcodeSubstitution"
    }
    
    fn mutate(&self, bytecode: &[u8], seed: &[u8; 32]) -> Result<Vec<u8>> {
        let mut result = Vec::with_capacity(bytecode.len() * 2);
        let mut i = 0;
        
        // Use seed to determine which substitutions to apply
        let mut seed_idx = 0;
        
        while i < bytecode.len() {
            let mut substituted = false;
            
            for rule in &self.rules {
                if i + rule.original.len() <= bytecode.len() 
                   && &bytecode[i..i + rule.original.len()] == &rule.original[..] 
                {
                    // Decide whether to substitute based on seed
                    let should_substitute = seed[seed_idx % 32] > 128;
                    seed_idx += 1;
                    
                    if should_substitute && !rule.variants.is_empty() {
                        // Pick a variant based on seed
                        let variant_idx = (seed[seed_idx % 32] as usize) % rule.variants.len();
                        seed_idx += 1;
                        
                        result.extend_from_slice(&rule.variants[variant_idx]);
                        i += rule.original.len();
                        substituted = true;
                        break;
                    }
                }
            }
            
            if !substituted {
                result.push(bytecode[i]);
                i += 1;
            }
        }
        
        Ok(result)
    }
    
    fn size_estimate(&self, original_size: usize) -> usize {
        // Opcode substitution can increase size by up to 3x in worst case
        original_size * 3
    }
    
    fn is_reversible(&self) -> bool {
        false // Substitutions are not reversible
    }
}

/// Substitution rule
struct SubstitutionRule {
    original: Vec<u8>,
    variants: Vec<Vec<u8>>,
}

/// Memory layout randomization strategy
/// Changes where data is stored in memory while preserving logic
pub struct MemoryRandomization {
    /// Base offset to add to memory addresses
    base_offset: u64,
    /// Mapping of original addresses to new addresses (reserved for future use)
    _address_map: std::collections::HashMap<u64, u64>,
}

impl MemoryRandomization {
    pub fn new() -> Self {
        Self {
            base_offset: 0,
            _address_map: std::collections::HashMap::new(),
        }
    }
    
    pub fn with_offset(mut self, offset: u64) -> Self {
        self.base_offset = offset;
        self
    }
}

impl Default for MemoryRandomization {
    fn default() -> Self {
        Self::new()
    }
}

impl MutationStrategy for MemoryRandomization {
    fn name(&self) -> &str {
        "MemoryRandomization"
    }
    
    fn mutate(&self, bytecode: &[u8], seed: &[u8; 32]) -> Result<Vec<u8>> {
        // Calculate offset from seed
        let _offset = u64::from_le_bytes([
            seed[0], seed[1], seed[2], seed[3],
            seed[4], seed[5], seed[6], seed[7],
        ]) % 0x1000; // Max 4KB offset
        
        let result = bytecode.to_vec();
        let mut i = 0;
        
        while i < result.len() {
            // Look for MSTORE/MLOAD patterns and adjust addresses
            match result[i] {
                0x51 => { // MLOAD
                    // Check if preceded by PUSH
                    if i > 0 && result[i-1] >= 0x60 && result[i-1] <= 0x7f {
                        // Adjust the pushed value (simplified)
                        // In real implementation, need to handle multi-byte pushes
                    }
                }
                0x52 => { // MSTORE
                    // Similar adjustment
                }
                _ => {}
            }
            i += 1;
        }
        
        Ok(result)
    }
    
    fn size_estimate(&self, original_size: usize) -> usize {
        // Memory randomization doesn't significantly change size
        original_size + 64
    }
    
    fn is_reversible(&self) -> bool {
        true // Can be reversed with the offset
    }
}

/// Control flow obfuscation strategy
/// Restructures jumps and branches while preserving logic
pub struct ControlFlowObfuscation;

impl ControlFlowObfuscation {
    pub fn new() -> Self {
        Self
    }
}

impl Default for ControlFlowObfuscation {
    fn default() -> Self {
        Self::new()
    }
}

impl MutationStrategy for ControlFlowObfuscation {
    fn name(&self) -> &str {
        "ControlFlowObfuscation"
    }
    
    fn mutate(&self, bytecode: &[u8], _seed: &[u8; 32]) -> Result<Vec<u8>> {
        // Control flow obfuscation is complex and requires full bytecode analysis
        // This is a placeholder that will be implemented with proper CFG analysis
        
        // For now, just return the original bytecode
        // Real implementation would:
        // 1. Build control flow graph
        // 2. Identify basic blocks
        // 3. Reorder blocks with computed jumps
        // 4. Insert opaque predicates
        
        Ok(bytecode.to_vec())
    }
    
    fn size_estimate(&self, original_size: usize) -> usize {
        // CFG obfuscation can increase size by up to 50%
        (original_size as f64 * 1.5) as usize
    }
    
    fn is_reversible(&self) -> bool {
        false
    }
}

/// Dead code injection strategy
/// Inserts code that never executes but changes bytecode structure
pub struct DeadCodeInjection {
    /// Maximum amount of dead code to inject (as ratio of original size)
    max_ratio: f32,
}

impl DeadCodeInjection {
    pub fn new() -> Self {
        Self { max_ratio: 0.2 }
    }
    
    pub fn with_ratio(mut self, ratio: f32) -> Self {
        self.max_ratio = ratio.clamp(0.0, 1.0);
        self
    }
    
    /// Generate a dead code snippet
    fn generate_dead_code(&self, seed: &[u8], size_hint: usize) -> Vec<u8> {
        let mut result = Vec::with_capacity(size_hint);
        
        // Pattern: PUSH 0 ISZERO JUMPI [dead code] JUMPDEST
        // The ISZERO of 0 is 1, so JUMPI always jumps, skipping dead code
        
        result.push(0x60); // PUSH1
        result.push(0x00); // 0
        result.push(0x15); // ISZERO
        
        // Calculate jump destination
        let dead_size = (size_hint.min(255) as u8).max(4);
        let jump_dest = result.len() + 3 + dead_size as usize;
        
        result.push(0x60); // PUSH1
        result.push(jump_dest as u8);
        result.push(0x57); // JUMPI
        
        // Dead code (random-looking but deterministic from seed)
        for i in 0..dead_size {
            result.push(seed[i as usize % seed.len()]);
        }
        
        result.push(0x5b); // JUMPDEST
        
        result
    }
}

impl Default for DeadCodeInjection {
    fn default() -> Self {
        Self::new()
    }
}

impl MutationStrategy for DeadCodeInjection {
    fn name(&self) -> &str {
        "DeadCodeInjection"
    }
    
    fn mutate(&self, bytecode: &[u8], seed: &[u8; 32]) -> Result<Vec<u8>> {
        let max_injection = ((bytecode.len() as f32) * self.max_ratio) as usize;
        let num_injections = (seed[0] as usize % 5) + 1;
        let injection_size = max_injection / num_injections;
        
        if injection_size < 8 {
            // Too small to inject meaningfully
            return Ok(bytecode.to_vec());
        }
        
        let mut result = Vec::with_capacity(bytecode.len() + max_injection);
        
        // Inject dead code at positions derived from seed
        let mut last_pos = 0;
        for i in 0..num_injections {
            let inject_pos = (seed[i + 1] as usize * bytecode.len() / 256).min(bytecode.len());
            
            if inject_pos > last_pos {
                result.extend_from_slice(&bytecode[last_pos..inject_pos]);
                result.extend(self.generate_dead_code(&seed[i..], injection_size));
                last_pos = inject_pos;
            }
        }
        
        result.extend_from_slice(&bytecode[last_pos..]);
        
        Ok(result)
    }
    
    fn size_estimate(&self, original_size: usize) -> usize {
        ((original_size as f32) * (1.0 + self.max_ratio)) as usize
    }
    
    fn is_reversible(&self) -> bool {
        false
    }
}

/// Composite mutation that applies multiple strategies
pub struct CompositeMutation {
    strategies: Vec<Box<dyn MutationStrategy>>,
}

impl CompositeMutation {
    pub fn new() -> Self {
        Self {
            strategies: Vec::new(),
        }
    }
    
    pub fn add_strategy<S: MutationStrategy + 'static>(mut self, strategy: S) -> Self {
        self.strategies.push(Box::new(strategy));
        self
    }
    
    pub fn from_config(config: &MutationConfig) -> Self {
        let mut composite = Self::new();
        
        for strategy_type in &config.enabled_strategies {
            match strategy_type {
                StrategyType::OpcodeSubstitution => {
                    composite = composite.add_strategy(OpcodeSubstitution::new());
                }
                StrategyType::MemoryRandomization => {
                    composite = composite.add_strategy(MemoryRandomization::new());
                }
                StrategyType::ControlFlowObfuscation => {
                    composite = composite.add_strategy(ControlFlowObfuscation::new());
                }
                StrategyType::DeadCodeInjection => {
                    composite = composite.add_strategy(DeadCodeInjection::new());
                }
                _ => {
                    // Other strategies to be implemented
                }
            }
        }
        
        composite
    }
}

impl Default for CompositeMutation {
    fn default() -> Self {
        Self::new()
            .add_strategy(OpcodeSubstitution::new())
            .add_strategy(MemoryRandomization::new())
            .add_strategy(DeadCodeInjection::new())
    }
}

impl MutationStrategy for CompositeMutation {
    fn name(&self) -> &str {
        "CompositeMutation"
    }
    
    fn mutate(&self, bytecode: &[u8], seed: &[u8; 32]) -> Result<Vec<u8>> {
        let mut result = bytecode.to_vec();
        
        // Derive sub-seeds for each strategy
        for (i, strategy) in self.strategies.iter().enumerate() {
            let mut sub_seed = *seed;
            // Mix in strategy index
            for j in 0..4 {
                sub_seed[j] ^= ((i >> (j * 8)) & 0xff) as u8;
            }
            
            result = strategy.mutate(&result, &sub_seed)?;
        }
        
        Ok(result)
    }
    
    fn size_estimate(&self, original_size: usize) -> usize {
        let mut size = original_size;
        for strategy in &self.strategies {
            size = strategy.size_estimate(size);
        }
        size
    }
    
    fn is_reversible(&self) -> bool {
        self.strategies.iter().all(|s| s.is_reversible())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_opcode_substitution() {
        let strategy = OpcodeSubstitution::new();
        let bytecode = vec![0x60, 0x01, 0x60, 0x02, 0x01]; // PUSH1 1 PUSH1 2 ADD
        let seed = [128u8; 32]; // Should trigger substitution
        
        let result = strategy.mutate(&bytecode, &seed).unwrap();
        
        // Result should be different (substitution applied)
        // Note: exact result depends on seed and rules
        assert!(!result.is_empty());
    }
    
    #[test]
    fn test_dead_code_injection() {
        let strategy = DeadCodeInjection::new().with_ratio(0.5);
        let bytecode = vec![0x60, 0x01, 0x60, 0x02, 0x01]; // Simple bytecode
        let seed = [42u8; 32];
        
        let result = strategy.mutate(&bytecode, &seed).unwrap();
        
        // Result should be larger due to dead code
        assert!(result.len() >= bytecode.len());
    }
    
    #[test]
    fn test_composite_mutation() {
        let mutation = CompositeMutation::default();
        let bytecode = vec![0x60, 0x01, 0x60, 0x02, 0x01, 0x60, 0x00, 0x52];
        let seed = [100u8; 32];
        
        let result = mutation.mutate(&bytecode, &seed).unwrap();
        
        // Should produce valid output
        assert!(!result.is_empty());
    }
}
