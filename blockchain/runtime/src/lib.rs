//! # Demiurge Runtime
//!
//! The blockchain runtime for the Demiurge Ecosystem.
//!
//! ## Pallets
//!
//! - **frame-system**: Core blockchain functionality
//! - **pallet-balances**: Account balances (CGT)
//! - **pallet-timestamp**: Block timestamps
//! - **pallet-cgt**: Creator God Token (13B supply)
//! - **pallet-qor-identity**: Qor ID system (username-only)
//! - **pallet-drc369**: Phygital Asset Standard (with Stateful NFTs)
//! - **pallet-game-assets**: Multi-Asset System with Zero-Gas Transfers
//! - **pallet-energy**: Regenerating Currencies (Hybrid Energy Model)
//! - **pallet-composable-nfts**: RMRK-style Equippable & Nested NFTs
//! - **pallet-dex**: Automatic Liquidity Pairs DEX
//! - **pallet-fractional-assets**: Guild-Owned Assets with Scheduling
//! - **pallet-drc369-ocw**: Off-Chain Workers for Game Data Integration
//! - **pallet-governance**: Game Studio Governance for Soft-Forks
//! - **pallet-session-keys**: Session Keys for Temporary Authorization (Phase 11)

#![cfg_attr(not(feature = "std"), no_std)]
#![recursion_limit = "256"]

// Make the WASM binary available.
#[cfg(feature = "std")]
include!(concat!(env!("OUT_DIR"), "/wasm_binary.rs"));

// Re-export pallets for node access
pub use frame_support::{
    construct_runtime, parameter_types,
    traits::{ConstU128, ConstU32, ConstU64, ConstU8},
    weights::{constants::WEIGHT_REF_TIME_PER_SECOND, Weight},
    PalletId,
};
pub use frame_system::Call as SystemCall;
pub use pallet_balances::Call as BalancesCall;
pub use pallet_timestamp::Call as TimestampCall;
pub use sp_runtime::{
    create_runtime_str, generic,
    traits::{BlakeTwo256, Block as BlockT, IdentifyAccount, Verify},
    transaction_validity::{TransactionSource, TransactionValidity},
    ApplyExtrinsicResult, MultiSignature, Perbill,
};

#[cfg(feature = "std")]
use sp_version::NativeVersion;
use sp_version::RuntimeVersion;

/// An index to a block.
pub type BlockNumber = u32;
/// Alias to 512-bit hash when used in the context of a transaction signature on the chain.
pub type Signature = MultiSignature;
/// Some way of identifying an account on the chain.
pub type AccountId = <<Signature as Verify>::Signer as IdentifyAccount>::AccountId;
/// Balance of an account.
pub type Balance = u128;
/// Index of a transaction in the chain.
pub type Nonce = u32;
/// A hash of some data used by the chain.
pub type Hash = sp_core::H256;

/// CGT constants (13B supply)
/// 100 Sparks = 1 CGT (Sparks are like Sats to Bitcoin)
pub const CGT_UNIT: Balance = 100; // 100 Sparks = 1 CGT
pub const CGT_TOTAL_SUPPLY: Balance = 13_000_000_000 * CGT_UNIT;

/// Time constants
pub const MILLISECS_PER_BLOCK: u64 = 6000;
pub const SLOT_DURATION: u64 = MILLISECS_PER_BLOCK;
pub const MINUTES: BlockNumber = 60_000 / (MILLISECS_PER_BLOCK as BlockNumber);
pub const HOURS: BlockNumber = MINUTES * 60;
pub const DAYS: BlockNumber = HOURS * 24;

/// Opaque types for the runtime
pub mod opaque {
    use super::*;
    pub use sp_runtime::OpaqueExtrinsic as UncheckedExtrinsic;

    pub type Header = generic::Header<BlockNumber, BlakeTwo256>;
    pub type Block = generic::Block<Header, UncheckedExtrinsic>;
    pub type BlockId = generic::BlockId<Block>;
}

/// Runtime version
#[sp_version::runtime_version]
pub const VERSION: RuntimeVersion = RuntimeVersion {
    spec_name: create_runtime_str!("demiurge"),
    impl_name: create_runtime_str!("demiurge"),
    authoring_version: 1,
    spec_version: 100,
    impl_version: 1,
    apis: RUNTIME_API_VERSIONS,
    transaction_version: 1,
    state_version: 1,
};

/// Native version
#[cfg(feature = "std")]
pub fn native_version() -> NativeVersion {
    NativeVersion {
        runtime_version: VERSION,
        can_author_with: Default::default(),
    }
}

// Configure frame_system
parameter_types! {
    pub const BlockHashCount: BlockNumber = 2400;
    pub const Version: RuntimeVersion = VERSION;
    pub BlockWeights: frame_system::limits::BlockWeights =
        frame_system::limits::BlockWeights::simple_max(
            Weight::from_parts(2u64 * WEIGHT_REF_TIME_PER_SECOND, u64::MAX),
        );
    pub const SS58Prefix: u16 = 42;
}

impl frame_system::Config for Runtime {
    type BaseCallFilter = frame_support::traits::Everything;
    type BlockWeights = BlockWeights;
    type BlockLength = ();
    type DbWeight = ();
    type RuntimeOrigin = RuntimeOrigin;
    type RuntimeCall = RuntimeCall;
    type Nonce = Nonce;
    type Hash = Hash;
    type Hashing = BlakeTwo256;
    type AccountId = AccountId;
    type Lookup = sp_runtime::traits::AccountIdLookup<AccountId, ()>;
    type Block = Block;
    type RuntimeEvent = RuntimeEvent;
    type RuntimeTask = RuntimeTask;
    type BlockHashCount = BlockHashCount;
    type Version = Version;
    type PalletInfo = PalletInfo;
    type AccountData = pallet_balances::AccountData<Balance>;
    type OnNewAccount = ();
    type OnKilledAccount = ();
    type SystemWeightInfo = ();
    type SS58Prefix = SS58Prefix;
    type OnSetCode = ();
    type MaxConsumers = ConstU32<16>;
    type SingleBlockMigrations = ();
    type MultiBlockMigrator = ();
    type PreInherents = ();
    type PostInherents = ();
    type PostTransactions = ();
}

// Configure pallet_timestamp
parameter_types! {
    pub const MinimumPeriod: u64 = SLOT_DURATION / 2;
}

impl pallet_timestamp::Config for Runtime {
    type Moment = u64;
    type OnTimestampSet = ();
    type MinimumPeriod = MinimumPeriod;
    type WeightInfo = ();
}

// Configure pallet_balances
parameter_types! {
    pub const ExistentialDeposit: Balance = CGT_UNIT / 1000; // 0.001 CGT
    pub const MaxLocks: u32 = 50;
    pub const MaxReserves: u32 = 50;
}

impl pallet_balances::Config for Runtime {
    type Balance = Balance;
    type DustRemoval = ();
    type RuntimeEvent = RuntimeEvent;
    type ExistentialDeposit = ExistentialDeposit;
    type AccountStore = System;
    type WeightInfo = ();
    type MaxLocks = MaxLocks;
    type MaxReserves = MaxReserves;
    type ReserveIdentifier = [u8; 8];
    type RuntimeHoldReason = RuntimeHoldReason;
    type RuntimeFreezeReason = RuntimeFreezeReason;
    type FreezeIdentifier = ();
    type MaxFreezes = ConstU32<0>;
}

// Configure pallet_cgt
parameter_types! {
    pub const CgtMinTransferAmount: Balance = CGT_UNIT / 1000; // 0.001 CGT
    pub const CgtBurnPercentage: Perbill = Perbill::from_percent(80);
}

impl pallet_cgt::Config for Runtime {
    type RuntimeEvent = RuntimeEvent;
    type Currency = Balances;
    type OnBurn = ();
    type BurnPercentage = CgtBurnPercentage;
    type MinTransferAmount = CgtMinTransferAmount;
    type WeightInfo = pallet_cgt::weights::SubstrateWeight<Runtime>;
}

// Configure pallet_qor_identity
parameter_types! {
    pub const QorRegistrationFee: Balance = 5 * CGT_UNIT; // 5 CGT burned
}

impl pallet_qor_identity::Config for Runtime {
    type RuntimeEvent = RuntimeEvent;
    type Currency = Balances;
    type RegistrationFee = QorRegistrationFee;
    type WeightInfo = pallet_qor_identity::weights::SubstrateWeight<Runtime>;
}

// Configure pallet_drc369
impl pallet_drc369::Config for Runtime {
    type RuntimeEvent = RuntimeEvent;
    type Currency = Balances;
}

// Configure pallet_game_assets
parameter_types! {
    pub const GameAssetsMinFeelessStake: Balance = 10 * CGT_UNIT; // 10 CGT
    pub const GameAssetsTreasuryPalletId: PalletId = PalletId(*b"game/trsy");
}

impl pallet_game_assets::Config for Runtime {
    type RuntimeEvent = RuntimeEvent;
    type Currency = Balances;
    type MinFeelessStake = GameAssetsMinFeelessStake;
    type TreasuryPalletId = GameAssetsTreasuryPalletId;
}

// Configure pallet_energy
impl pallet_energy::Config for Runtime {
    type RuntimeEvent = RuntimeEvent;
}

// Configure pallet_composable_nfts
impl pallet_composable_nfts::Config for Runtime {
    type RuntimeEvent = RuntimeEvent;
    type Drc369 = Drc369;
}

// Configure pallet_dex
parameter_types! {
    pub const DexPalletId: PalletId = PalletId(*b"dex/lp  ");
}

impl pallet_dex::Config for Runtime {
    type RuntimeEvent = RuntimeEvent;
    type Currency = Balances;
    type GameAssets = GameAssets;
    type PalletId = DexPalletId;
}

// Configure pallet_fractional_assets
impl pallet_fractional_assets::Config for Runtime {
    type RuntimeEvent = RuntimeEvent;
    type Drc369 = Drc369;
    // pallet_timestamp::Config is already implemented for Runtime above
}

// Configure pallet_drc369_ocw
parameter_types! {
    pub const MaxGameSources: u32 = 100;
}

impl pallet_drc369_ocw::Config for Runtime {
    type RuntimeEvent = RuntimeEvent;
    type MaxGameSources = MaxGameSources;
    type Drc369 = Drc369;
}

// Configure pallet_session_keys (Phase 11: Revolutionary Features)
parameter_types! {
    pub const MaxSessionDuration: BlockNumber = DAYS * 7; // 7 days max session (100,800 blocks)
}

// Implement QOR Identity query trait for session keys pallet
impl pallet_session_keys::QorIdentityQuery<Runtime> for Runtime {
    fn get_qor_id_username(account: &AccountId) -> Option<frame_support::BoundedVec<u8, ConstU32<20>>> {
        // Query AccountToIdentity to get the QOR ID hash
        if let Some(qor_id_hash) = pallet_qor_identity::AccountToIdentity::<Runtime>::get(account) {
            // Query Identities to get the full identity with username
            if let Some(identity) = pallet_qor_identity::Identities::<Runtime>::get(qor_id_hash) {
                return Some(identity.username);
            }
        }
        None
    }
}

impl pallet_session_keys::Config for Runtime {
    type RuntimeEvent = RuntimeEvent;
    type WeightInfo = pallet_session_keys::weights::SubstrateWeight<Runtime>;
    type MaxSessionDuration = MaxSessionDuration;
    type QorIdentity = QorIdentity; // Link to QOR Identity pallet for QOR ID lookups
    type QorIdentityQuery = Runtime; // Runtime implements the query trait
}

// Configure pallet_yield_nfts (Phase 11: Revolutionary Features)
parameter_types! {
    pub const MinStakingDuration: BlockNumber = 100; // Minimum 100 blocks (~10 minutes)
    pub const MaxStakingDuration: BlockNumber = 0; // 0 = unlimited
    pub const DefaultYieldRate: Balance = CGT_UNIT / 1000; // 0.001 CGT per block (very small)
}

impl pallet_yield_nfts::Config for Runtime {
    type RuntimeEvent = RuntimeEvent;
    type Currency = Balances;
    type Drc369 = Drc369;
    type MinStakingDuration = MinStakingDuration;
    type MaxStakingDuration = MaxStakingDuration;
    type DefaultYieldRate = DefaultYieldRate;
    type WeightInfo = pallet_yield_nfts::weights::SubstrateWeight<Runtime>;
}

// Construct runtime
construct_runtime!(
    pub struct Runtime {
        System: frame_system,
        Timestamp: pallet_timestamp,
        Balances: pallet_balances,
        Cgt: pallet_cgt,
        QorIdentity: pallet_qor_identity,
        Drc369: pallet_drc369,
        GameAssets: pallet_game_assets,
        Energy: pallet_energy,
        ComposableNfts: pallet_composable_nfts,
        Dex: pallet_dex,
        FractionalAssets: pallet_fractional_assets,
        Drc369Ocw: pallet_drc369_ocw,
        Governance: pallet_governance,
        SessionKeys: pallet_session_keys,
        YieldNfts: pallet_yield_nfts,
    }
);

/// The address format for describing accounts.
pub type Address = sp_runtime::MultiAddress<AccountId, ()>;
/// Block header type.
pub type Header = generic::Header<BlockNumber, BlakeTwo256>;
/// Block type.
pub type Block = generic::Block<Header, UncheckedExtrinsic>;
/// A Block signed with a Justification.
pub type SignedBlock = generic::SignedBlock<Block>;
/// BlockId type.
pub type BlockId = generic::BlockId<Block>;
/// The SignedExtension to the basic transaction logic.
pub type SignedExtra = (
    frame_system::CheckNonZeroSender<Runtime>,
    frame_system::CheckSpecVersion<Runtime>,
    frame_system::CheckTxVersion<Runtime>,
    frame_system::CheckGenesis<Runtime>,
    frame_system::CheckEra<Runtime>,
    frame_system::CheckNonce<Runtime>,
    frame_system::CheckWeight<Runtime>,
);
/// Unchecked extrinsic type.
pub type UncheckedExtrinsic =
    generic::UncheckedExtrinsic<Address, RuntimeCall, Signature, SignedExtra>;
/// Executive type handles dispatch.
pub type Executive = frame_executive::Executive<
    Runtime,
    Block,
    frame_system::ChainContext<Runtime>,
    Runtime,
    AllPalletsWithSystem,
>;

// Implement runtime APIs
sp_api::impl_runtime_apis! {
    impl sp_api::Core<Block> for Runtime {
        fn version() -> RuntimeVersion {
            VERSION
        }

        fn execute_block(block: Block) {
            Executive::execute_block(block);
        }

        fn initialize_block(header: &<Block as BlockT>::Header) -> sp_runtime::ExtrinsicInclusionMode {
            Executive::initialize_block(header)
        }
    }

    impl sp_api::Metadata<Block> for Runtime {
        fn metadata() -> sp_core::OpaqueMetadata {
            sp_core::OpaqueMetadata::new(Runtime::metadata().into())
        }

        fn metadata_at_version(version: u32) -> Option<sp_core::OpaqueMetadata> {
            Runtime::metadata_at_version(version)
        }

        fn metadata_versions() -> sp_std::vec::Vec<u32> {
            Runtime::metadata_versions()
        }
    }

    impl sp_block_builder::BlockBuilder<Block> for Runtime {
        fn apply_extrinsic(extrinsic: <Block as BlockT>::Extrinsic) -> ApplyExtrinsicResult {
            Executive::apply_extrinsic(extrinsic)
        }

        fn finalize_block() -> <Block as BlockT>::Header {
            Executive::finalize_block()
        }

        fn inherent_extrinsics(data: sp_inherents::InherentData) -> Vec<<Block as BlockT>::Extrinsic> {
            data.create_extrinsics()
        }

        fn check_inherents(
            block: Block,
            data: sp_inherents::InherentData,
        ) -> sp_inherents::CheckInherentsResult {
            data.check_extrinsics(&block)
        }
    }

    impl sp_transaction_pool::runtime_api::TaggedTransactionQueue<Block> for Runtime {
        fn validate_transaction(
            source: TransactionSource,
            tx: <Block as BlockT>::Extrinsic,
            block_hash: <Block as BlockT>::Hash,
        ) -> TransactionValidity {
            Executive::validate_transaction(source, tx, block_hash)
        }
    }

    impl sp_offchain::OffchainWorkerApi<Block> for Runtime {
        fn offchain_worker(header: &<Block as BlockT>::Header) {
            Executive::offchain_worker(header)
        }
    }

    impl sp_session::SessionKeys<Block> for Runtime {
        fn generate_session_keys(_seed: Option<sp_std::vec::Vec<u8>>) -> sp_std::vec::Vec<u8> {
            sp_std::vec::Vec::new()
        }

        fn decode_session_keys(
            _encoded: sp_std::vec::Vec<u8>,
        ) -> Option<sp_std::vec::Vec<(sp_std::vec::Vec<u8>, sp_core::crypto::KeyTypeId)>> {
            None
        }
    }

    impl frame_system_rpc_runtime_api::AccountNonceApi<Block, AccountId, Nonce> for Runtime {
        fn account_nonce(account: AccountId) -> Nonce {
            System::account_nonce(account)
        }
    }

    impl pallet_session_keys::runtime_api::SessionKeysApi<Block> for Runtime {
        fn get_active_session_keys(primary_account: AccountId) -> Vec<(AccountId, BlockNumber)> {
            SessionKeys::get_active_session_keys(&primary_account)
        }

        fn is_session_key_valid(primary_account: AccountId, session_key: AccountId) -> bool {
            SessionKeys::is_session_key_valid(&primary_account, &session_key)
        }

        fn get_session_key_expiry(primary_account: AccountId, session_key: AccountId) -> Option<BlockNumber> {
            SessionKeys::session_key_expiry(&primary_account, &session_key)
        }
    }

    impl sp_genesis_builder::GenesisBuilder<Block> for Runtime {
        fn build_state(config: sp_std::vec::Vec<u8>) -> sp_genesis_builder::Result {
            frame_support::genesis_builder_helper::build_state::<RuntimeGenesisConfig>(config)
        }

        fn get_preset(id: &Option<sp_genesis_builder::PresetId>) -> Option<sp_std::vec::Vec<u8>> {
            frame_support::genesis_builder_helper::get_preset::<RuntimeGenesisConfig>(id, |_| None)
        }

        fn preset_names() -> sp_std::vec::Vec<sp_genesis_builder::PresetId> {
            sp_std::vec::Vec::new()
        }
    }
}
