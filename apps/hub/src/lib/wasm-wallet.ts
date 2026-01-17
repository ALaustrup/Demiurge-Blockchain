/**
 * WASM Wallet Service
 * 
 * Provides browser-based wallet signing using WebAssembly
 * Integrates with QOR ID for deterministic keypair generation
 */

import { hexToU8a, u8aToHex } from '@polkadot/util';

// Dynamic imports for WASM module
let init: any;
let generate_keypair_from_seed: any;
let sign_message: any;
let get_address_from_keypair: any;

let wasmInitialized = false;
let wasmModule: any = null;

/**
 * Load WASM module functions dynamically
 */
async function loadWasmModule() {
  if (init && generate_keypair_from_seed && sign_message && get_address_from_keypair) {
    return; // Already loaded
  }

  try {
    // Try importing from the built package
    const wasmModule = await import('@demiurge/wallet-wasm');
    init = wasmModule.default;
    generate_keypair_from_seed = wasmModule.generate_keypair_from_seed;
    sign_message = wasmModule.sign_message;
    get_address_from_keypair = wasmModule.get_address_from_keypair;
  } catch (error) {
    // Fallback: try loading from relative path (for development)
    try {
      const wasmModule = await import('../../packages/wallet-wasm/pkg/wallet_wasm');
      init = wasmModule.default;
      generate_keypair_from_seed = wasmModule.generate_keypair_from_seed;
      sign_message = wasmModule.sign_message;
      get_address_from_keypair = wasmModule.get_address_from_keypair;
    } catch (fallbackError) {
      console.error('Failed to load WASM module:', fallbackError);
      throw new Error('WASM wallet module not found. Please ensure the wallet-wasm package is built.');
    }
  }
}

/**
 * Initialize WASM module
 */
export async function initWasm(): Promise<void> {
  if (wasmInitialized && wasmModule) {
    return;
  }

  try {
    // Load WASM module functions first
    await loadWasmModule();
    
    // Try to load WASM binary from public directory
    try {
      const wasmModulePath = '/pkg/wallet_wasm_bg.wasm';
      const wasmModuleResponse = await fetch(wasmModulePath);
      
      if (wasmModuleResponse.ok) {
        const wasmBytes = await wasmModuleResponse.arrayBuffer();
        wasmModule = await init(wasmBytes);
      } else {
        // Fallback: try direct initialization
        wasmModule = await init();
      }
    } catch (fetchError) {
      // Final fallback: try direct initialization (may not work in all environments)
      try {
        wasmModule = await init();
      } catch (directError) {
        console.error('All WASM initialization methods failed:', directError);
        throw new Error('Failed to load WASM wallet. Please ensure the wallet-wasm package is built and copied to public/pkg/');
      }
    }
    
    wasmInitialized = true;
  } catch (error) {
    console.error('Failed to initialize WASM wallet:', error);
    throw new Error('WASM wallet initialization failed. Please ensure the wallet-wasm package is built.');
  }
}

/**
 * Generate keypair from QOR ID seed
 * 
 * @param qorId QOR ID (e.g., "username#0001")
 * @returns Keypair JSON string
 */
export async function generateKeypairFromQorId(qorId: string): Promise<string> {
  await initWasm();
  
  // Use same seed format as qor-wallet.ts
  const seed = `QOR_ID:${qorId}`;
  
  try {
    return generate_keypair_from_seed(seed);
  } catch (error) {
    console.error('Failed to generate keypair from QOR ID:', error);
    throw new Error('Failed to generate keypair');
  }
}

/**
 * Get public key hex from keypair JSON
 * 
 * @param keypairJson Keypair JSON string
 * @returns Public key as hex string
 */
export async function getPublicKeyHex(keypairJson: string): Promise<string> {
  await initWasm();
  
  try {
    return get_address_from_keypair(keypairJson);
  } catch (error) {
    console.error('Failed to get public key:', error);
    throw new Error('Failed to extract public key');
  }
}

/**
 * Sign a message with keypair
 * 
 * @param keypairJson Keypair JSON string
 * @param message Message bytes to sign
 * @returns Signature as hex string
 */
export async function signMessage(
  keypairJson: string,
  message: Uint8Array
): Promise<string> {
  await initWasm();
  
  try {
    return sign_message(keypairJson, message);
  } catch (error) {
    console.error('Failed to sign message:', error);
    throw new Error('Failed to sign message');
  }
}

/**
 * Sign a transaction payload for Polkadot.js API
 * 
 * This creates a signature compatible with Substrate transaction signing
 * 
 * @param keypairJson Keypair JSON string
 * @param payload Transaction payload bytes
 * @returns Signature as hex string (64 bytes)
 */
export async function signTransactionPayload(
  keypairJson: string,
  payload: Uint8Array
): Promise<string> {
  await initWasm();
  
  try {
    // Sign the payload
    const signatureHex = sign_message(keypairJson, payload);
    
    // Ensure signature is 64 bytes (128 hex chars)
    const signatureBytes = hexToU8a(signatureHex);
    if (signatureBytes.length !== 64) {
      throw new Error(`Invalid signature length: ${signatureBytes.length}, expected 64`);
    }
    
    return signatureHex;
  } catch (error) {
    console.error('Failed to sign transaction payload:', error);
    throw new Error('Failed to sign transaction');
  }
}

/**
 * Create a custom signer for Polkadot.js API
 * 
 * This allows using WASM signing with Polkadot.js API
 */
export function createWasmSigner(keypairJson: string) {
  return {
    sign: async (payload: { data: Uint8Array }): Promise<{ signature: string }> => {
      const signature = await signTransactionPayload(keypairJson, payload.data);
      return { signature };
    }
  };
}

/**
 * Store keypair securely in localStorage (encrypted)
 * 
 * @param qorId QOR ID
 * @param keypairJson Keypair JSON string
 * @param password Encryption password
 */
export async function storeKeypair(
  qorId: string,
  keypairJson: string,
  password: string
): Promise<void> {
  // TODO: Implement encryption using Web Crypto API
  // For now, store in localStorage (not secure - should encrypt)
  const storageKey = `wasm_keypair_${qorId}`;
  localStorage.setItem(storageKey, keypairJson);
}

/**
 * Load stored keypair from localStorage
 * 
 * @param qorId QOR ID
 * @param password Decryption password
 * @returns Keypair JSON string
 */
export async function loadKeypair(
  qorId: string,
  password: string
): Promise<string | null> {
  const storageKey = `wasm_keypair_${qorId}`;
  const stored = localStorage.getItem(storageKey);
  
  if (!stored) {
    // Generate new keypair if not found
    return await generateKeypairFromQorId(qorId);
  }
  
  // TODO: Decrypt if encryption is implemented
  return stored;
}

/**
 * Check if WASM wallet is initialized
 */
export function isWasmInitialized(): boolean {
  return wasmInitialized && wasmModule !== null;
}
