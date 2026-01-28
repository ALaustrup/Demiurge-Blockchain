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

pub use semantic_ir::*;
pub use compiler::PolymorphicCompiler;
pub use mutation::MutationStrategy;
pub use proof::{EquivalenceProof, ProofGenerator, ProofVerifier};
pub use engine::CvpEngine;
pub use error::{CvpError, Result};

/// CVP version for compatibility tracking
pub const CVP_VERSION: &str = "0.1.0";

/// Default epoch length for CVP mutations (in blocks)
pub const DEFAULT_MUTATION_EPOCH: u64 = 100;
