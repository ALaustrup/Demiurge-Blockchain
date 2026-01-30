//! # Demiurge Consensus - Hybrid PoS + BFT
//!
//! Fast finality, energy efficient, governance-integrated consensus.
//! Built for creators, developers, and gamers.
//!
//! ## Features
//!
//! - **Modular Fluidity**: Hot-swappable consensus mechanisms without hard forks
//! - **Hybrid PoS + BFT**: Sub-2-second finality with Byzantine fault tolerance
//! - **CVP Integration**: Consensus-Verified Polymorphism for dynamic security
//! - **Staking Pools**: Nominator support with commission-based rewards
//! - **Slashing**: Automatic penalties for misbehavior

pub mod engine;
pub mod validator;
pub mod finality;
pub mod staking;
pub mod slashing;
pub mod error;
pub mod modular;
pub mod sharding;

pub use engine::{ConsensusEngine, BlockProof, BlockSignature};
pub use validator::{Validator, ValidatorSet};
pub use finality::Finality;
pub use staking::{Stake, StakingPool};
pub use slashing::{SlashingTracker, penalties as SlashingPenalties};
pub use error::{ConsensusError, Result};

// Modular Fluidity exports
pub use modular::{
    ConsensusMechanism,
    ConsensusOrchestrator,
    MechanismConfig,
    MechanismError,
    MechanismId,
    MechanismMetadata,
    MechanismState,
    MechanismVersion,
    Vote,
    ValidationResult,
    FinalityResult,
    ScheduledSwitch,
    SwitchRecord,
    // Built-in mechanisms
    PosBftMechanism,
    PureBftMechanism,
};

// Elastic Sharding exports
pub use sharding::{
    ShardCoordinator,
    ShardingConfig,
    ShardId,
    ShardInfo,
    ShardState,
    ShardMetrics,
    ShardOperation,
    ShardEvent,
    ShardError,
    ScalingDecision,
    CrossShardMessage,
    CrossShardMessageType,
    CrossShardReceipt,
};
