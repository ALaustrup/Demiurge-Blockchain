//! Yield NFTs implementation

use crate::{YieldNftsError, Result};
use demiurge_modules::traits::Module;
use demiurge_storage::Storage;
use codec::{Decode, Encode};
use scale_info::TypeInfo;

/// Yield NFTs module
pub struct YieldNftsModule;

impl Module for YieldNftsModule {
    fn name() -> &'static str {
        "YieldNfts"
    }

    fn version() -> u32 {
        1
    }

    fn execute(
        &self,
        call: Vec<u8>,
        storage: &mut dyn Storage,
    ) -> std::result::Result<(), demiurge_modules::traits::ModuleError> {
        let call_data: YieldCall = Decode::decode(&mut &call[..])
            .map_err(|e| demiurge_modules::traits::ModuleError::InvalidCall(e.to_string()))?;

        match call_data {
            YieldCall::Stake { nft_id, duration } => {
                // TODO: Stake NFT
                Ok(())
            }
            YieldCall::Unstake { nft_id } => {
                // TODO: Unstake NFT and claim yield
                Ok(())
            }
            YieldCall::ClaimYield { nft_id } => {
                // TODO: Claim accumulated yield
                Ok(())
            }
            YieldCall::ShareRevenue { nft_id, amount } => {
                // TODO: Game shares revenue with staked NFT
                Ok(())
            }
        }
    }

    fn on_initialize(
        &mut self,
        block_number: u64,
        storage: &mut dyn Storage,
    ) -> std::result::Result<(), demiurge_modules::traits::ModuleError> {
        // Update yield pools on each block
        // TODO: Implement yield accumulation
        Ok(())
    }
}

/// Yield NFTs module calls
#[derive(Clone, Debug, Encode, Decode, TypeInfo)]
pub enum YieldCall {
    /// Stake NFT to earn yield
    Stake {
        nft_id: [u8; 32],
        duration: u64, // Duration in blocks (0 = indefinite)
    },
    /// Unstake NFT and claim yield
    Unstake {
        nft_id: [u8; 32],
    },
    /// Claim yield without unstaking
    ClaimYield {
        nft_id: [u8; 32],
    },
    /// Share revenue with staked NFT (game calls this)
    ShareRevenue {
        nft_id: [u8; 32],
        amount: u128,
    },
}
