//! # Consensus-Verified Polymorphism (CVP)
//!
//! A novel blockchain security mechanism that transforms static smart contract
//! bytecode into a dynamically mutating target while cryptographically proving
//! semantic equivalence.
//!
//! ## Overview
//!
//! CVP eliminates the fundamental vulnerability of all existing blockchains:
//! the ability for attackers to study immutable code indefinitely.
//!
//! By automatically recompiling contract logic into structurally different but
//! semantically equivalent bytecode at each epoch, CVP creates a "moving target"
//! that renders static analysis attacks obsolete.
//!
//! ## Components
//!
//! - **Semantic IR**: Intermediate representation capturing contract logic
//! - **Polymorphic Compiler**: Generates bytecode variants from Semantic IR
//! - **Equivalence Prover**: ZK proofs that variants are semantically equivalent
//! - **Consensus Integration**: Epoch-based mutation with validator verification
//!
//! ## Status
//!
//! This module is in active research and development.

pub mod semantic_ir;
pub mod compiler;
pub mod mutation;
pub mod proof;
pub mod engine;
pub mod error;
pub mod integration;
pub mod drc369;
pub mod consensus_hook;

pub use semantic_ir::*;
pub use compiler::{PolymorphicCompiler, Bytecode};
pub use mutation::{MutationStrategy, MutationConfig, CompositeMutation};
pub use proof::{
    EquivalenceProof, ProofGenerator, ProofVerifier, ProofSystem,
    PlaceholderProofGenerator, PlaceholderProofVerifier,
};
pub use engine::{CvpEngine, CvpConfig, MutationResult};
pub use error::{CvpError, Result};
pub use integration::{
    CvpConsensusIntegration, CvpBlockResult, TransactionInfo,
    AttackDetector, Threat, ThreatType, ThreatSeverity,
};
pub use drc369::{build_drc369_semantic_ir, create_cvp_drc369, Drc369CvpConfig};
pub use consensus_hook::{CvpBlockExtension, integrate_era_transition, validate_block_cvp};

/// CVP version for compatibility tracking
pub const CVP_VERSION: &str = "0.1.0";

/// Default epoch length for CVP mutations (in blocks)
pub const DEFAULT_MUTATION_EPOCH: u64 = 100;
