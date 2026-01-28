//! # DRC-369 Module
//!
//! Stateful NFT Standard - NFTs that evolve, gain XP, and level up.
//! Multi-resource support, soulbound capability, composable.
//!
//! ## CVP Protection
//!
//! DRC-369 is protected by Consensus-Verified Polymorphism (CVP), making it
//! the most secure NFT standard in existence. The contract bytecode mutates
//! every epoch while preserving all functionality, making it impossible for
//! attackers to target static bytecode patterns.
//!
//! ## Features
//!
//! - **Evolving NFTs**: XP and level system for NFT progression
//! - **Soulbound**: Non-transferable NFTs bound to their owner
//! - **Multi-resource**: Multiple assets per NFT (sprites, 3D models, audio)
//! - **Composable**: NFTs can be nested within other NFTs
//! - **Delegated Permissions**: Grant specific rights without transferring ownership
//! - **CVP Protected**: Polymorphic bytecode that morphs to resist attacks

pub mod nft;
pub mod error;

pub use nft::{
    Drc369Module, 
    NftCall, 
    NftState, 
    Resource, 
    Permission, 
    Delegation,
    CvpRegistrar,
    register_drc369_with_cvp,
};
pub use error::{Drc369Error, Result};
