//! Mock runtime for the session keys pallet.

use crate as pallet_session_keys;
use frame_support::{
	parameter_types,
	traits::{ConstU16, ConstU32, ConstU64},
};
use sp_core::H256;
use sp_runtime::{
	traits::{BlakeTwo256, IdentityLookup},
	BuildStorage,
};

type Block = frame_system::mocking::MockBlock<Test>;

// Configure a mock runtime to test the pallet.
frame_support::construct_runtime!(
	pub enum Test
	{
		System: frame_system,
		Balances: pallet_balances,
		QorIdentity: pallet_qor_identity,
		SessionKeys: pallet_session_keys,
	}
);

impl frame_system::Config for Test {
	type BaseCallFilter = frame_support::traits::Everything;
	type BlockWeights = ();
	type BlockLength = ();
	type DbWeight = ();
	type RuntimeOrigin = RuntimeOrigin;
	type RuntimeCall = RuntimeCall;
	type Nonce = u64;
	type Hash = H256;
	type Hashing = BlakeTwo256;
	type AccountId = u64;
	type Lookup = IdentityLookup<Self::AccountId>;
	type Block = Block;
	type RuntimeEvent = RuntimeEvent;
	type BlockHashCount = ConstU64<250>;
	type Version = ();
	type PalletInfo = PalletInfo;
	type AccountData = pallet_balances::AccountData<u64>;
	type OnNewAccount = ();
	type OnKilledAccount = ();
	type SystemWeightInfo = ();
	type SS58Prefix = ConstU16<42>;
	type OnSetCode = ();
	type MaxConsumers = ConstU32<16>;
}

parameter_types! {
    pub const MaxSessionDuration: u64 = 100;
	pub const ExistentialDeposit: u64 = 0;
	pub const MaxLocks: u32 = 50;
	pub const MaxReserves: u32 = 50;
	pub const QorRegistrationFee: u64 = 0;
}

impl pallet_balances::Config for Test {
	type MaxLocks = MaxLocks;
	type MaxReserves = MaxReserves;
	type ReserveIdentifier = [u8; 8];
	type Balance = u64;
	type RuntimeEvent = RuntimeEvent;
	type DustRemoval = ();
	type ExistentialDeposit = ExistentialDeposit;
	type AccountStore = System;
	type WeightInfo = ();
	type RuntimeHoldReason = ();
	type RuntimeFreezeReason = ();
	type FreezeIdentifier = ();
	type MaxFreezes = ConstU32<0>;
}

impl pallet_qor_identity::Config for Test {
	type RuntimeEvent = RuntimeEvent;
	type Currency = Balances;
	type RegistrationFee = QorRegistrationFee;
	type WeightInfo = ();
}

// Mock QOR Identity query implementation
impl pallet_session_keys::QorIdentityQuery<Test> for Test {
	fn get_qor_id_username(_account: &u64) -> Option<frame_support::BoundedVec<u8, ConstU32<20>>> {
		// Return None for tests (QOR ID lookup not needed for basic tests)
		None
	}
}

impl pallet_session_keys::Config for Test {
	type RuntimeEvent = RuntimeEvent;
	type MaxSessionDuration = MaxSessionDuration;
	type QorIdentity = Test;
	type QorIdentityQuery = Test;
}

// Build genesis storage according to the mock runtime.
pub fn new_test_ext() -> sp_io::TestExternalities {
	frame_system::GenesisConfig::<Test>::default().build_storage().unwrap().into()
}
