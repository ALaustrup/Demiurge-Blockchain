//! Weights for pallet_session_keys
//! THIS FILE WAS AUTO-GENERATED USING THE SUBSTRATE BENCHMARK CLI VERSION 4.0.0-dev
//! DATE: 2026-01-16, STEPS: `50`, REPEAT: `20`, LOW RANGE: `[]`, HIGH RANGE: `[]`
//! EXECUTION: Some(Wasm), WASM-EXECUTION: Compiled, CHAIN: Some("dev"), DB CACHE: 1024

// Executed Command:
// ./target/release/demiurge-node
// benchmark
// pallet
// --chain=dev
// --steps=50
// --repeat=20
// --pallet=pallet_session_keys
// --extrinsic=*
// --execution=wasm
// --wasm-execution=compiled
// --heap-pages=4096
// --output=./pallets/pallet-session-keys/src/weights.rs
// --template=./.maintain/frame-weight-template.hbs

#![cfg_attr(rustfmt, rustfmt_skip)]
#![allow(unused_parens)]
#![allow(unused_imports)]

use frame_support::{traits::Get, weights::Weight};
use sp_std::marker::PhantomData;

/// Weight functions for `pallet_session_keys`.
pub struct WeightInfo<T>(PhantomData<T>);
impl<T: frame_system::Config> crate::WeightInfo for WeightInfo<T> {
    /// Storage: SessionKeys SessionKeys (r:1 w:1)
    /// Storage: CreatorSessionKeys CreatorSessionKeys (r:1 w:1)
    /// The range of component `p` is `[1, 32]`.
    fn create_session_key() -> Weight {
        // Minimum execution time: 50_000 nanoseconds.
        Weight::from_parts(50_000, 0)
            .saturating_add(Weight::from_parts(0, 0))
    }
    /// Storage: SessionKeys SessionKeys (r:1 w:1)
    fn revoke_session_key() -> Weight {
        // Minimum execution time: 30_000 nanoseconds.
        Weight::from_parts(30_000, 0)
            .saturating_add(Weight::from_parts(0, 0))
    }
}
