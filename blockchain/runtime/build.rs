//! Build script for the Demiurge runtime.
//! Compiles the WASM binary.

fn main() {
    #[cfg(feature = "std")]
    {
        substrate_wasm_builder::WasmBuilder::build_using_defaults();
    }
}
