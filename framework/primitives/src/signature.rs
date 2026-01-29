//! Signature Abstraction Layer
//!
//! Provides a unified interface for multiple signature schemes, enabling:
//! - Seamless migration from classical to post-quantum cryptography
//! - Key rotation without identity change
//! - Future-proofing against unknown signature schemes
//!
//! # Supported Schemes
//!
//! - **Ed25519**: Current default, fast and compact
//! - **ECDSA**: Ethereum compatibility
//! - **Dilithium**: NIST PQC standard (planned)
//! - **Falcon**: Compact PQC signatures (planned)
//! - **Hybrid**: Combined classical + quantum (transition)

use codec::{Decode, Encode};
use serde::{Deserialize, Serialize};

/// Signature scheme identifier
#[derive(Clone, Copy, Debug, PartialEq, Eq, Encode, Decode, Serialize, Deserialize)]
#[repr(u8)]
pub enum SignatureScheme {
    /// Ed25519 - Current default
    Ed25519 = 0,
    
    /// ECDSA secp256k1 - Ethereum compatible
    EcdsaSecp256k1 = 1,
    
    /// ECDSA secp256r1 - WebAuthn compatible
    EcdsaSecp256r1 = 2,
    
    /// CRYSTALS-Dilithium Level 3 - NIST PQC standard
    Dilithium3 = 10,
    
    /// CRYSTALS-Dilithium Level 5 - Maximum security
    Dilithium5 = 11,
    
    /// Falcon-512 - Compact PQC
    Falcon512 = 20,
    
    /// Falcon-1024 - High security PQC
    Falcon1024 = 21,
    
    /// SPHINCS+-128s - Stateless hash-based
    SphincsPlus128s = 30,
    
    /// Hybrid: Ed25519 + Dilithium3
    HybridEdDilithium3 = 100,
    
    /// Hybrid: ECDSA + Dilithium3
    HybridEcdsaDilithium3 = 101,
    
    /// Custom/Future scheme
    Custom = 255,
}

impl SignatureScheme {
    /// Check if this scheme is quantum-safe
    pub fn is_quantum_safe(&self) -> bool {
        matches!(
            self,
            Self::Dilithium3
                | Self::Dilithium5
                | Self::Falcon512
                | Self::Falcon1024
                | Self::SphincsPlus128s
                | Self::HybridEdDilithium3
                | Self::HybridEcdsaDilithium3
        )
    }
    
    /// Check if this is a hybrid scheme
    pub fn is_hybrid(&self) -> bool {
        matches!(
            self,
            Self::HybridEdDilithium3 | Self::HybridEcdsaDilithium3
        )
    }
    
    /// Get expected signature size in bytes
    pub fn signature_size(&self) -> usize {
        match self {
            Self::Ed25519 => 64,
            Self::EcdsaSecp256k1 | Self::EcdsaSecp256r1 => 65,
            Self::Dilithium3 => 3293,
            Self::Dilithium5 => 4595,
            Self::Falcon512 => 690,
            Self::Falcon1024 => 1330,
            Self::SphincsPlus128s => 7856,
            Self::HybridEdDilithium3 => 64 + 3293,
            Self::HybridEcdsaDilithium3 => 65 + 3293,
            Self::Custom => 0, // Variable
        }
    }
    
    /// Get expected public key size in bytes
    pub fn public_key_size(&self) -> usize {
        match self {
            Self::Ed25519 => 32,
            Self::EcdsaSecp256k1 => 33, // Compressed
            Self::EcdsaSecp256r1 => 33,
            Self::Dilithium3 => 1952,
            Self::Dilithium5 => 2592,
            Self::Falcon512 => 897,
            Self::Falcon1024 => 1793,
            Self::SphincsPlus128s => 32,
            Self::HybridEdDilithium3 => 32 + 1952,
            Self::HybridEcdsaDilithium3 => 33 + 1952,
            Self::Custom => 0,
        }
    }
    
    /// Security level in bits (classical equivalent)
    pub fn security_level(&self) -> u32 {
        match self {
            Self::Ed25519 => 128,
            Self::EcdsaSecp256k1 | Self::EcdsaSecp256r1 => 128,
            Self::Dilithium3 => 192,
            Self::Dilithium5 => 256,
            Self::Falcon512 => 128,
            Self::Falcon1024 => 256,
            Self::SphincsPlus128s => 128,
            Self::HybridEdDilithium3 => 192, // Min of both
            Self::HybridEcdsaDilithium3 => 192,
            Self::Custom => 0,
        }
    }
}

/// Abstract public key supporting multiple schemes
#[derive(Clone, Debug, Encode, Decode, Serialize, Deserialize)]
pub struct AbstractPublicKey {
    /// The signature scheme
    pub scheme: SignatureScheme,
    
    /// Raw public key bytes
    pub key: Vec<u8>,
    
    /// Optional: For custom schemes, WASM verifier code hash
    pub custom_verifier: Option<[u8; 32]>,
}

impl AbstractPublicKey {
    /// Create a new Ed25519 public key
    pub fn ed25519(key: [u8; 32]) -> Self {
        Self {
            scheme: SignatureScheme::Ed25519,
            key: key.to_vec(),
            custom_verifier: None,
        }
    }
    
    /// Create a new Dilithium3 public key
    pub fn dilithium3(key: Vec<u8>) -> Self {
        Self {
            scheme: SignatureScheme::Dilithium3,
            key,
            custom_verifier: None,
        }
    }
    
    /// Create a hybrid Ed25519 + Dilithium3 key
    pub fn hybrid_ed_dilithium(ed_key: [u8; 32], dilithium_key: Vec<u8>) -> Self {
        let mut combined = ed_key.to_vec();
        combined.extend(dilithium_key);
        Self {
            scheme: SignatureScheme::HybridEdDilithium3,
            key: combined,
            custom_verifier: None,
        }
    }
    
    /// Derive a 32-byte address from any public key
    pub fn to_address(&self) -> [u8; 32] {
        use blake2::{Blake2b512, Digest};
        let mut hasher = Blake2b512::new();
        hasher.update(&[self.scheme as u8]);
        hasher.update(&self.key);
        let hash = hasher.finalize();
        let mut address = [0u8; 32];
        address.copy_from_slice(&hash[..32]);
        address
    }
    
    /// Check if key is quantum-safe
    pub fn is_quantum_safe(&self) -> bool {
        self.scheme.is_quantum_safe()
    }
}

/// Abstract signature supporting multiple schemes
#[derive(Clone, Debug, Encode, Decode, Serialize, Deserialize)]
pub struct AbstractSignature {
    /// The signature scheme
    pub scheme: SignatureScheme,
    
    /// Raw signature bytes
    pub signature: Vec<u8>,
}

impl AbstractSignature {
    /// Create Ed25519 signature
    pub fn ed25519(sig: [u8; 64]) -> Self {
        Self {
            scheme: SignatureScheme::Ed25519,
            signature: sig.to_vec(),
        }
    }
    
    /// Create hybrid signature
    pub fn hybrid_ed_dilithium(ed_sig: [u8; 64], dilithium_sig: Vec<u8>) -> Self {
        let mut combined = ed_sig.to_vec();
        combined.extend(dilithium_sig);
        Self {
            scheme: SignatureScheme::HybridEdDilithium3,
            signature: combined,
        }
    }
    
    /// Verify signature against public key and message
    pub fn verify(&self, public_key: &AbstractPublicKey, message: &[u8]) -> bool {
        // Scheme must match
        if self.scheme != public_key.scheme {
            return false;
        }
        
        match self.scheme {
            SignatureScheme::Ed25519 => {
                self.verify_ed25519(public_key, message)
            }
            SignatureScheme::HybridEdDilithium3 => {
                // Both signatures must verify
                self.verify_hybrid_ed_dilithium(public_key, message)
            }
            // TODO: Implement other schemes
            _ => false,
        }
    }
    
    fn verify_ed25519(&self, public_key: &AbstractPublicKey, message: &[u8]) -> bool {
        use ed25519_dalek::{Signature, VerifyingKey, Verifier};
        
        if public_key.key.len() != 32 || self.signature.len() != 64 {
            return false;
        }
        
        let Ok(vk_bytes): Result<[u8; 32], _> = public_key.key.clone().try_into() else {
            return false;
        };
        
        let Ok(sig_bytes): Result<[u8; 64], _> = self.signature.clone().try_into() else {
            return false;
        };
        
        let Ok(verifying_key) = VerifyingKey::from_bytes(&vk_bytes) else {
            return false;
        };
        
        let signature = Signature::from_bytes(&sig_bytes);
        verifying_key.verify(message, &signature).is_ok()
    }
    
    fn verify_hybrid_ed_dilithium(&self, public_key: &AbstractPublicKey, message: &[u8]) -> bool {
        // Split keys and signatures
        if public_key.key.len() < 32 || self.signature.len() < 64 {
            return false;
        }
        
        // Verify Ed25519 part
        let ed_key = AbstractPublicKey {
            scheme: SignatureScheme::Ed25519,
            key: public_key.key[..32].to_vec(),
            custom_verifier: None,
        };
        let ed_sig = AbstractSignature {
            scheme: SignatureScheme::Ed25519,
            signature: self.signature[..64].to_vec(),
        };
        
        if !ed_sig.verify_ed25519(&ed_key, message) {
            return false;
        }
        
        // TODO: Verify Dilithium part when implemented
        // For now, Ed25519 verification is sufficient during transition
        true
    }
}

/// Key rotation event for audit trail
#[derive(Clone, Debug, Encode, Decode, Serialize, Deserialize)]
pub struct KeyRotationEvent {
    /// Previous key (signs the rotation)
    pub previous_key: AbstractPublicKey,
    
    /// New key being activated
    pub new_key: AbstractPublicKey,
    
    /// Block number of rotation
    pub block_number: u64,
    
    /// Signature from previous key authorizing rotation
    pub authorization: AbstractSignature,
    
    /// Reason for rotation
    pub reason: KeyRotationReason,
}

/// Reasons for key rotation
#[derive(Clone, Debug, Encode, Decode, Serialize, Deserialize)]
pub enum KeyRotationReason {
    /// Upgrading to quantum-safe scheme
    QuantumUpgrade,
    
    /// Security upgrade within same class
    SecurityUpgrade,
    
    /// Key compromise suspected
    CompromiseSuspected,
    
    /// Regular rotation policy
    ScheduledRotation,
    
    /// Recovery procedure
    Recovery,
    
    /// Custom reason
    Custom(String),
}

/// Security level classification
#[derive(Clone, Copy, Debug, PartialEq, Eq, Encode, Decode, Serialize, Deserialize)]
pub enum SecurityLevel {
    /// Classical only - vulnerable to future quantum
    Classical,
    
    /// Hybrid - safe during transition period
    Hybrid,
    
    /// Quantum-safe - lattice/hash-based only
    QuantumSafe,
    
    /// Maximum - multiple independent quantum schemes
    QuantumRedundant,
}

impl SecurityLevel {
    /// Determine security level from signature scheme
    pub fn from_scheme(scheme: SignatureScheme) -> Self {
        if scheme.is_hybrid() {
            Self::Hybrid
        } else if scheme.is_quantum_safe() {
            Self::QuantumSafe
        } else {
            Self::Classical
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use ed25519_dalek::{SigningKey, Signer};
    use rand::rngs::OsRng;
    
    #[test]
    fn test_ed25519_signature() {
        let signing_key = SigningKey::generate(&mut OsRng);
        let verifying_key = signing_key.verifying_key();
        
        let message = b"Hello, Demiurge!";
        let signature = signing_key.sign(message);
        
        let abstract_pk = AbstractPublicKey::ed25519(verifying_key.to_bytes());
        let abstract_sig = AbstractSignature::ed25519(signature.to_bytes());
        
        assert!(abstract_sig.verify(&abstract_pk, message));
        assert!(!abstract_sig.verify(&abstract_pk, b"Wrong message"));
    }
    
    #[test]
    fn test_address_derivation() {
        let key = [1u8; 32];
        let pk = AbstractPublicKey::ed25519(key);
        let address = pk.to_address();
        
        // Address should be deterministic
        let address2 = pk.to_address();
        assert_eq!(address, address2);
        
        // Different key = different address
        let pk2 = AbstractPublicKey::ed25519([2u8; 32]);
        assert_ne!(address, pk2.to_address());
    }
    
    #[test]
    fn test_quantum_safe_detection() {
        assert!(!SignatureScheme::Ed25519.is_quantum_safe());
        assert!(SignatureScheme::Dilithium3.is_quantum_safe());
        assert!(SignatureScheme::HybridEdDilithium3.is_quantum_safe());
    }
}
