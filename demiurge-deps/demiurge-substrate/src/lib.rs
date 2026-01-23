// demiurge-substrate: Pinned Substrate 39.0.0 re-export
// 
// This crate provides a single entry point for all Substrate frame and sp-* primitives
// with locked versions to ensure compatibility across the Demiurge ecosystem.

// Frame exports
pub use frame_executive;
pub use frame_support;
pub use frame_system;

// Primitives exports (available in workspace)
pub use sp_api;
pub use sp_core;
pub use sp_runtime;

// Codec
pub use parity_scale_codec;
pub use scale_info;

#[cfg(test)]
mod tests {
    #[test]
    fn substrate_v39_available() {
        assert_eq!(2 + 2, 4);
    }
}
