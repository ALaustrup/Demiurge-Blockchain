use argon2::Argon2;
use base64::{engine::general_purpose, Engine as _};
use bip39::{Language, Mnemonic};
use chacha20poly1305::aead::{Aead, KeyInit};
use chacha20poly1305::{ChaCha20Poly1305, Key, Nonce};
use rand_core::{OsRng, RngCore};
use wasm_bindgen::prelude::*;

const SALT_LEN: usize = 16;
const NONCE_LEN: usize = 12;

#[wasm_bindgen]
pub fn generate_mnemonic() -> Result<String, JsValue> {
    let mut rng = OsRng;
    let mut entropy = [0u8; 16]; // 128-bit entropy for 12-word mnemonic
    rng.fill_bytes(&mut entropy);
    let mnemonic = Mnemonic::from_entropy_in(Language::English, &entropy)
        .map_err(|_| JsValue::from_str("Failed to generate mnemonic"))?;
    Ok(mnemonic.to_string())
}

#[wasm_bindgen]
pub fn validate_mnemonic(mnemonic: &str) -> bool {
    Mnemonic::parse_in_normalized(Language::English, mnemonic).is_ok()
}

#[wasm_bindgen]
pub fn encrypt_mnemonic(mnemonic: &str, password: &str) -> Result<String, JsValue> {
    if password.is_empty() {
        return Err(JsValue::from_str("Password is required"));
    }

    let mut salt = [0u8; SALT_LEN];
    OsRng.fill_bytes(&mut salt);

    let mut key_bytes = [0u8; 32];
    Argon2::default()
        .hash_password_into(password.as_bytes(), &salt, &mut key_bytes)
        .map_err(|_| JsValue::from_str("Failed to derive encryption key"))?;

    let cipher = ChaCha20Poly1305::new(Key::from_slice(&key_bytes));

    let mut nonce_bytes = [0u8; NONCE_LEN];
    OsRng.fill_bytes(&mut nonce_bytes);
    let nonce = Nonce::from_slice(&nonce_bytes);

    let ciphertext = cipher
        .encrypt(nonce, mnemonic.as_bytes())
        .map_err(|_| JsValue::from_str("Failed to encrypt mnemonic"))?;

    let mut payload = Vec::with_capacity(SALT_LEN + NONCE_LEN + ciphertext.len());
    payload.extend_from_slice(&salt);
    payload.extend_from_slice(&nonce_bytes);
    payload.extend_from_slice(&ciphertext);

    Ok(general_purpose::STANDARD.encode(payload))
}

#[wasm_bindgen]
pub fn decrypt_mnemonic(payload_b64: &str, password: &str) -> Result<String, JsValue> {
    if password.is_empty() {
        return Err(JsValue::from_str("Password is required"));
    }

    let payload = general_purpose::STANDARD
        .decode(payload_b64)
        .map_err(|_| JsValue::from_str("Invalid wallet payload"))?;

    if payload.len() <= SALT_LEN + NONCE_LEN {
        return Err(JsValue::from_str("Invalid wallet payload"));
    }

    let salt = &payload[..SALT_LEN];
    let nonce_bytes = &payload[SALT_LEN..SALT_LEN + NONCE_LEN];
    let ciphertext = &payload[SALT_LEN + NONCE_LEN..];

    let mut key_bytes = [0u8; 32];
    Argon2::default()
        .hash_password_into(password.as_bytes(), salt, &mut key_bytes)
        .map_err(|_| JsValue::from_str("Failed to derive encryption key"))?;

    let cipher = ChaCha20Poly1305::new(Key::from_slice(&key_bytes));
    let plaintext = cipher
        .decrypt(Nonce::from_slice(nonce_bytes), ciphertext)
        .map_err(|_| JsValue::from_str("Invalid password or corrupted wallet"))?;

    let mnemonic = String::from_utf8(plaintext)
        .map_err(|_| JsValue::from_str("Invalid wallet payload"))?;

    if !validate_mnemonic(&mnemonic) {
        return Err(JsValue::from_str("Invalid wallet payload"));
    }

    Ok(mnemonic)
}
