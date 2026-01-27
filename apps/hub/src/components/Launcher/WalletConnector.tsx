'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { initWasm, generateKeypairFromQorId, getPublicKeyHex, isWasmInitialized } from '@/lib/wasm-wallet';
import { generateAddressFromQorId } from '@/lib/qor-wallet';
import { demiurgeRpc } from '@/lib/demiurge-rpc';
import Link from 'next/link';

// ═══════════════════════════════════════════════════════════════════════════
// WALLET CONNECTOR - WASM-based wallet connection flow
// Ed25519 signing without browser extensions
// ═══════════════════════════════════════════════════════════════════════════

interface WalletState {
  address: string | null;
  publicKey: string | null;
  balance: string;
  isConnecting: boolean;
  isConnected: boolean;
  error: string | null;
}

interface WalletConnectorProps {
  variant?: 'button' | 'full';
  onConnect?: (address: string) => void;
  onDisconnect?: () => void;
}

export function WalletConnector({
  variant = 'button',
  onConnect,
  onDisconnect,
}: WalletConnectorProps) {
  const { user, isAuthenticated } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [wallet, setWallet] = useState<WalletState>({
    address: null,
    publicKey: null,
    balance: '0',
    isConnecting: false,
    isConnected: false,
    error: null,
  });
  const [initStep, setInitStep] = useState<'idle' | 'wasm' | 'keypair' | 'balance' | 'done'>('idle');

  const connectWallet = useCallback(async () => {
    if (!isAuthenticated || !user?.qor_id) {
      setWallet(prev => ({ ...prev, error: 'Please login first' }));
      return;
    }

    setWallet(prev => ({ ...prev, isConnecting: true, error: null }));
    setShowModal(true);

    try {
      // Step 1: Initialize WASM
      setInitStep('wasm');
      const wasmReady = await initWasm();
      
      let address: string;
      let publicKey: string | null = null;

      if (wasmReady) {
        // Step 2: Generate keypair from QOR ID (WASM path)
        setInitStep('keypair');
        const keypairJson = await generateKeypairFromQorId(user.qor_id);
        publicKey = await getPublicKeyHex(keypairJson);
        address = generateAddressFromQorId(user.qor_id);
      } else {
        // Fallback: Generate address without WASM (read-only mode)
        setInitStep('keypair');
        address = generateAddressFromQorId(user.qor_id);
        console.warn('WASM not available, running in read-only mode');
      }

      // Step 3: Fetch balance
      setInitStep('balance');
      let balance = '0';
      try {
        balance = await demiurgeRpc.getBalance(address);
      } catch (e) {
        // Blockchain may be offline, use 0
      }

      // Done
      setInitStep('done');
      setWallet({
        address,
        publicKey,
        balance,
        isConnecting: false,
        isConnected: true,
        error: null,
      });

      // Store connection state
      if (typeof window !== 'undefined') {
        localStorage.setItem('demiurge_wallet_connected', 'true');
        localStorage.setItem('demiurge_wallet_address', address);
      }

      onConnect?.(address);

      // Close modal after success
      setTimeout(() => setShowModal(false), 1500);

    } catch (error: any) {
      console.error('Wallet connection failed:', error);
      setWallet(prev => ({
        ...prev,
        isConnecting: false,
        error: error.message || 'Connection failed',
      }));
      setInitStep('idle');
    }
  }, [isAuthenticated, user, onConnect]);

  const disconnectWallet = useCallback(() => {
    setWallet({
      address: null,
      publicKey: null,
      balance: '0',
      isConnecting: false,
      isConnected: false,
      error: null,
    });
    setInitStep('idle');

    if (typeof window !== 'undefined') {
      localStorage.removeItem('demiurge_wallet_connected');
      localStorage.removeItem('demiurge_wallet_address');
    }

    onDisconnect?.();
  }, [onDisconnect]);

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatBalance = (bal: string) => {
    const num = parseFloat(bal) / 1e18;
    return num.toLocaleString(undefined, { maximumFractionDigits: 4 });
  };

  // Full variant - embedded wallet panel
  if (variant === 'full') {
    return (
      <div className="holo-panel p-6">
        <h3 className="font-grunge text-holographic text-lg mb-4">Wallet</h3>
        
        {wallet.isConnected ? (
          <div className="space-y-4">
            <div>
              <span className="text-xs text-lavender uppercase">Address</span>
              <p className="data-ticker font-mono">{formatAddress(wallet.address!)}</p>
            </div>
            <div>
              <span className="text-xs text-lavender uppercase">Balance</span>
              <p className="text-2xl font-bold text-holo-gradient">
                {formatBalance(wallet.balance)} CGT
              </p>
            </div>
            <button
              onClick={disconnectWallet}
              className="w-full py-2 text-sm text-lavender hover:text-red-400 transition-colors"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <div>
            {!isAuthenticated ? (
              <div className="text-center">
                <p className="text-lavender mb-4">Login to connect your wallet</p>
                <Link href="/login" className="launcher-button w-full">
                  Login with QOR ID
                </Link>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                disabled={wallet.isConnecting}
                className="launcher-button-primary w-full py-3"
              >
                {wallet.isConnecting ? 'Connecting...' : 'Connect Wallet'}
              </button>
            )}
            {wallet.error && (
              <p className="text-red-400 text-sm mt-2">{wallet.error}</p>
            )}
          </div>
        )}
      </div>
    );
  }

  // Button variant - header/navbar button
  return (
    <>
      {wallet.isConnected ? (
        <button
          onClick={() => setShowModal(true)}
          className="launcher-button flex items-center gap-2 px-4 py-2"
        >
          <div className="w-2 h-2 rounded-full bg-data-green" style={{ boxShadow: '0 0 8px #00FF88' }} />
          <span className="font-mono text-sm">{formatAddress(wallet.address!)}</span>
        </button>
      ) : (
        <button
          onClick={isAuthenticated ? connectWallet : () => window.location.href = '/login'}
          disabled={wallet.isConnecting}
          className="launcher-button px-5 py-2 text-sm"
        >
          {wallet.isConnecting ? 'Connecting...' : 'Connect'}
        </button>
      )}

      {/* Connection Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-void/80 backdrop-blur-sm"
              onClick={() => !wallet.isConnecting && setShowModal(false)}
            />

            {/* Modal */}
            <motion.div
              className="relative holo-panel p-8 w-full max-w-md mx-4"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
            >
              <h2 className="font-grunge text-2xl text-holo-gradient text-center mb-6">
                {wallet.isConnected ? 'Wallet Connected' : 'Connecting Wallet'}
              </h2>

              {/* Connection Steps */}
              <div className="space-y-4 mb-6">
                <StepIndicator
                  label="Initialize WASM Module"
                  status={initStep === 'wasm' ? 'active' : initStep === 'idle' ? 'pending' : 'complete'}
                />
                <StepIndicator
                  label="Generate Ed25519 Keypair"
                  status={initStep === 'keypair' ? 'active' : ['idle', 'wasm'].includes(initStep) ? 'pending' : 'complete'}
                />
                <StepIndicator
                  label="Fetch Balance"
                  status={initStep === 'balance' ? 'active' : ['idle', 'wasm', 'keypair'].includes(initStep) ? 'pending' : 'complete'}
                />
              </div>

              {/* Connected State */}
              {wallet.isConnected && (
                <div className="text-center space-y-4">
                  <div className="text-4xl">✓</div>
                  <p className="data-ticker font-mono">{formatAddress(wallet.address!)}</p>
                  <p className="text-2xl font-bold text-holo-gradient">
                    {formatBalance(wallet.balance)} CGT
                  </p>
                </div>
              )}

              {/* Error State */}
              {wallet.error && (
                <div className="text-center">
                  <p className="text-red-400 mb-4">{wallet.error}</p>
                  <button
                    onClick={connectWallet}
                    className="launcher-button"
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* Close button */}
              {!wallet.isConnecting && (
                <button
                  onClick={() => setShowModal(false)}
                  className="absolute top-4 right-4 text-lavender hover:text-holographic"
                >
                  ✕
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Step indicator component
function StepIndicator({ label, status }: { label: string; status: 'pending' | 'active' | 'complete' }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
        status === 'complete' ? 'bg-data-green text-void' :
        status === 'active' ? 'bg-data-cyan animate-pulse' :
        'bg-ultraviolet/50 text-lavender'
      }`}>
        {status === 'complete' ? '✓' : status === 'active' ? '...' : '○'}
      </div>
      <span className={`text-sm ${
        status === 'complete' ? 'text-data-green' :
        status === 'active' ? 'text-data-cyan' :
        'text-lavender'
      }`}>
        {label}
      </span>
    </div>
  );
}

export default WalletConnector;
