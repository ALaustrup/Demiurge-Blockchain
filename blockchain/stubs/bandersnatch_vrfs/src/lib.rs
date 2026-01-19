// Stub crate for bandersnatch_vrfs - we don't use this feature
// This prevents Cargo from trying to fetch the broken git dependency

#[cfg(feature = "getrandom")]
pub mod keys {
    use getrandom::getrandom;
    
    pub struct MiniSecretKey([u8; 32]);
    
    impl MiniSecretKey {
        pub fn from_bytes(_bytes: &[u8; 32]) -> Self {
            Self([0; 32])
        }
    }
}

pub struct VrfOutput([u8; 32]);

impl VrfOutput {
    pub fn new() -> Self {
        Self([0; 32])
    }
}
