//! Chain specification definitions for Demiurge networks.
//!
//! Defines genesis configuration including:
//! - Initial validators
//! - CGT token distribution
//! - Qor ID system parameters

use sc_service::ChainType;
use sp_consensus_aura::sr25519::AuthorityId as AuraId;
use sp_consensus_grandpa::AuthorityId as GrandpaId;
use sp_core::{sr25519, Pair, Public};
use sp_runtime::traits::{IdentifyAccount, Verify};
use serde::{Deserialize, Serialize};

// The runtime types (would be imported from demiurge-runtime)
// For now, use placeholder types
pub type AccountId = sp_runtime::AccountId32;
pub type Balance = u128;
pub type Signature = sp_runtime::MultiSignature;

/// Specialized `ChainSpec` for Demiurge.
pub type ChainSpec = sc_service::GenericChainSpec<GenesisConfig>;

/// CGT precision: 8 decimals
const CGT: Balance = 100_000_000;

/// Total CGT supply: 13 billion (FIXED)
const TOTAL_SUPPLY: Balance = 13_000_000_000 * CGT;

// Distribution buckets (The Creation Model)
const PLEROMA_MINING: Balance = 5_200_000_000 * CGT;      // 40%
const ARCHON_STAKING: Balance = 2_600_000_000 * CGT;      // 20%
const DEMIURGE_TREASURY: Balance = 1_950_000_000 * CGT;   // 15%
const TEAM_ALLOCATION: Balance = 1_950_000_000 * CGT;     // 15%
const GENESIS_OFFERING: Balance = 1_300_000_000 * CGT;    // 10%

/// Genesis configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GenesisConfig {
    /// Initial balances
    pub balances: Vec<(AccountId, Balance)>,
    /// Aura authorities
    pub aura_authorities: Vec<AuraId>,
    /// Grandpa authorities  
    pub grandpa_authorities: Vec<(GrandpaId, u64)>,
    /// Sudo key (for testnet governance)
    pub sudo_key: Option<AccountId>,
}

/// Generate a crypto pair from seed
pub fn get_from_seed<TPublic: Public>(seed: &str) -> <TPublic::Pair as Pair>::Public {
    TPublic::Pair::from_string(&format!("//{}", seed), None)
        .expect("static values are valid; qed")
        .public()
}

/// Generate an account ID from seed
pub fn get_account_id_from_seed<TPublic: Public>(seed: &str) -> AccountId
where
    AccountPublic: From<<TPublic::Pair as Pair>::Public>,
{
    AccountPublic::from(get_from_seed::<TPublic>(seed)).into_account()
}

type AccountPublic = <Signature as Verify>::Signer;

/// Generate an Aura authority key
pub fn authority_keys_from_seed(seed: &str) -> (AuraId, GrandpaId) {
    (
        get_from_seed::<AuraId>(seed),
        get_from_seed::<GrandpaId>(seed),
    )
}

/// Development chain configuration (single validator)
pub fn development_config() -> Result<ChainSpec, String> {
    Ok(ChainSpec::builder(
        // This would be the runtime WASM - placeholder for now
        &[],
        None,
    )
    .with_name("Demiurge Development")
    .with_id("demiurge_dev")
    .with_chain_type(ChainType::Development)
    .with_genesis_config_patch(development_genesis_config())
    .with_protocol_id("demiurge-dev")
    .build())
}

/// Local testnet configuration (two validators)
pub fn local_testnet_config() -> Result<ChainSpec, String> {
    Ok(ChainSpec::builder(
        &[],
        None,
    )
    .with_name("Demiurge Local Testnet")
    .with_id("demiurge_local")
    .with_chain_type(ChainType::Local)
    .with_genesis_config_patch(local_testnet_genesis_config())
    .with_protocol_id("demiurge-local")
    .build())
}

/// Demiurge testnet configuration
pub fn demiurge_testnet_config() -> Result<ChainSpec, String> {
    Ok(ChainSpec::builder(
        &[],
        None,
    )
    .with_name("Demiurge Testnet")
    .with_id("demiurge_testnet")
    .with_chain_type(ChainType::Live)
    .with_genesis_config_patch(testnet_genesis_config())
    .with_protocol_id("demiurge")
    .with_properties(chain_properties())
    .build())
}

/// Development genesis configuration
fn development_genesis_config() -> serde_json::Value {
    let alice = get_account_id_from_seed::<sr25519::Public>("Alice");
    let (aura, grandpa) = authority_keys_from_seed("Alice");
    
    genesis_config(
        // Authorities
        vec![(aura, grandpa)],
        // Sudo account
        Some(alice.clone()),
        // Endowed accounts with CGT allocation
        vec![
            // Alice gets full dev supply
            (alice, TOTAL_SUPPLY),
        ],
    )
}

/// Local testnet genesis configuration
fn local_testnet_genesis_config() -> serde_json::Value {
    let alice = get_account_id_from_seed::<sr25519::Public>("Alice");
    let bob = get_account_id_from_seed::<sr25519::Public>("Bob");
    
    let authorities = vec![
        authority_keys_from_seed("Alice"),
        authority_keys_from_seed("Bob"),
    ];
    
    genesis_config(
        authorities,
        Some(alice.clone()),
        vec![
            // Split between validators
            (alice, 500_000_000 * CGT),
            (bob, 500_000_000 * CGT),
        ],
    )
}

/// Testnet genesis with proper tokenomics (The Creation Model)
fn testnet_genesis_config() -> serde_json::Value {
    // Use well-known dev accounts for testnet
    let alice = get_account_id_from_seed::<sr25519::Public>("Alice");
    let bob = get_account_id_from_seed::<sr25519::Public>("Bob");
    let charlie = get_account_id_from_seed::<sr25519::Public>("Charlie");
    
    let authorities = vec![
        authority_keys_from_seed("Alice"),
        authority_keys_from_seed("Bob"),
        authority_keys_from_seed("Charlie"),
    ];
    
    // CGT Distribution per The Creation Model:
    // 40% Pleroma Mining, 20% Archon Staking, 15% Treasury, 15% Team, 10% Offering
    let pleroma_mining = get_account_id_from_seed::<sr25519::Public>("PleromaMining");
    let archon_staking = get_account_id_from_seed::<sr25519::Public>("ArchonStaking");
    let treasury = get_account_id_from_seed::<sr25519::Public>("DemiurgeTreasury");
    let team = get_account_id_from_seed::<sr25519::Public>("TeamVesting");
    let genesis_offering = get_account_id_from_seed::<sr25519::Public>("GenesisOffering");
    
    genesis_config(
        authorities,
        Some(alice.clone()),
        vec![
            // Pleroma Mining Pool (40%)
            (pleroma_mining, PLEROMA_MINING),
            // Archon Staking Pool (20%)
            (archon_staking, ARCHON_STAKING),
            // Demiurge Treasury (15%)
            (treasury, DEMIURGE_TREASURY),
            // Team Vesting Contract (15%)
            (team, TEAM_ALLOCATION),
            // Genesis Offering (10%)
            (genesis_offering, GENESIS_OFFERING),
            // Small amounts for validators
            (alice, 1000 * CGT),
            (bob, 1000 * CGT),
            (charlie, 1000 * CGT),
        ],
    )
}

/// Create genesis config JSON
fn genesis_config(
    authorities: Vec<(AuraId, GrandpaId)>,
    sudo_key: Option<AccountId>,
    endowed_accounts: Vec<(AccountId, Balance)>,
) -> serde_json::Value {
    serde_json::json!({
        "balances": {
            "balances": endowed_accounts
        },
        "aura": {
            "authorities": authorities.iter().map(|(a, _)| a).collect::<Vec<_>>()
        },
        "grandpa": {
            "authorities": authorities.iter().map(|(_, g)| (g, 1u64)).collect::<Vec<_>>()
        },
        "sudo": {
            "key": sudo_key
        },
        "cgt": {
            "totalSupply": TOTAL_SUPPLY,
            "circulatingSupply": endowed_accounts.iter().map(|(_, b)| b).sum::<Balance>()
        },
        "qorIdentity": {
            "registrationFee": 5 * CGT  // 5 CGT to register Qor ID
        }
    })
}

/// Chain properties for wallet display
fn chain_properties() -> serde_json::Map<String, serde_json::Value> {
    let mut properties = serde_json::Map::new();
    properties.insert("tokenSymbol".into(), "CGT".into());
    properties.insert("tokenDecimals".into(), 8.into());
    properties.insert("ss58Format".into(), 42.into()); // Generic Substrate
    properties
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_cgt_constants() {
        assert_eq!(CGT, 100_000_000);
        assert_eq!(TOTAL_SUPPLY, 1_000_000_000 * CGT);
    }
    
    #[test]
    fn test_development_config() {
        assert!(development_config().is_ok());
    }
}
