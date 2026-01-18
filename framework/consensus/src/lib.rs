//! # Demiurge Consensus - Hybrid PoS + BFT
//!
//! Fast finality, energy efficient, governance-integrated consensus.
//! Built for creators, developers, and gamers.


pub mod engine;
pub mod validator;
pub mod finality;
pub mod staking;
pub mod error;

pub use engine::ConsensusEngine;
pub use validator::{Validator, ValidatorSet};
pub use finality::Finality;
pub use staking::{Stake, StakingPool};
pub use error::{ConsensusError, Result};
