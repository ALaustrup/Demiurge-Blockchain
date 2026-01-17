'use client';

import { useEffect, useState } from 'react';
import { useBlockchain } from '@/contexts/BlockchainContext';
import { Keyring } from '@polkadot/keyring';
import { cryptoWaitReady } from '@polkadot/util-crypto';
import { createStoredWallet, hasStoredWallet, loadStoredWalletMnemonic } from '@/lib/wallet';

interface SendCGTModalProps {
  isOpen: boolean;
  onClose: () => void;
  fromAddress: string;
  currentBalance: string;
}

export function SendCGTModal({ isOpen, onClose, fromAddress, currentBalance }: SendCGTModalProps) {
  const { transfer } = useBlockchain();
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [walletExists, setWalletExists] = useState<boolean | null>(null);
  const [generatedMnemonic, setGeneratedMnemonic] = useState<string | null>(null);
  const [acknowledgedBackup, setAcknowledgedBackup] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setWalletExists(hasStoredWallet());
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSend = async () => {
    if (!toAddress || !amount) {
      setError('Please fill in all fields');
      return;
    }

    // Validate amount
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Invalid amount');
      return;
    }

    // Convert amount to smallest units (2 decimals, 100 Sparks = 1 CGT)
    const CGT_UNIT = 100;
    const amountInSmallestUnits = Math.floor(amountNum * CGT_UNIT).toString();
    const balanceUnits = Number.parseFloat(currentBalance);
    if (amountNum * CGT_UNIT > balanceUnits) {
      setError('Insufficient balance');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (!password) {
        throw new Error('Wallet password is required');
      }

      if (generatedMnemonic && !acknowledgedBackup) {
        throw new Error('Please confirm you saved your recovery phrase');
      }

      const mnemonic = await loadStoredWalletMnemonic(password);

      await cryptoWaitReady();
      const keyring = new Keyring({ type: 'sr25519' });
      const pair = keyring.addFromUri(mnemonic);

      if (pair.address !== fromAddress) {
        throw new Error('Wallet address does not match your profile address');
      }

      const hash = await transfer(pair, toAddress, amountInSmallestUnits);
      setTxHash(hash);
    } catch (err: any) {
      setError(err.message || 'Failed to send transaction');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateWallet = async () => {
    if (password.length < 8) {
      setError('Use a password with at least 8 characters');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const mnemonic = await createStoredWallet(password);
      setGeneratedMnemonic(mnemonic);
      setAcknowledgedBackup(false);
      setWalletExists(true);
    } catch (err: any) {
      setError(err.message || 'Failed to create wallet');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900/95 backdrop-blur-xl border border-demiurge-cyan/30 rounded-lg p-6 w-full max-w-md glass-panel">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-demiurge-cyan">Send CGT</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {txHash ? (
          <div className="space-y-4">
            <div className="text-green-400 text-center">
              ✅ Transaction sent successfully!
            </div>
            <div className="bg-gray-800/50 rounded p-3 break-all text-sm">
              <div className="text-gray-400 mb-1">Transaction Hash:</div>
              <div className="text-demiurge-cyan font-mono">{txHash}</div>
            </div>
            <button
              onClick={onClose}
              className="w-full bg-demiurge-cyan text-black font-bold py-2 rounded hover:bg-demiurge-cyan/80 transition-colors"
            >
              Close
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">From</label>
              <div className="bg-gray-800/50 rounded p-2 text-sm font-mono break-all">
                {fromAddress}
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">To Address</label>
              <input
                type="text"
                value={toAddress}
                onChange={(e) => setToAddress(e.target.value)}
                placeholder="Enter recipient address"
                className="w-full bg-gray-800/50 border border-gray-700 rounded p-2 text-white placeholder-gray-500 focus:border-demiurge-cyan focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Amount (CGT)
              </label>
              <input
                type="number"
                step="0.00000001"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-gray-800/50 border border-gray-700 rounded p-2 text-white placeholder-gray-500 focus:border-demiurge-cyan focus:outline-none"
              />
              <div className="text-xs text-gray-500 mt-1">
                Available: {parseFloat(currentBalance) / 100} CGT
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Wallet Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter wallet password"
                className="w-full bg-gray-800/50 border border-gray-700 rounded p-2 text-white placeholder-gray-500 focus:border-demiurge-cyan focus:outline-none"
              />
              <div className="text-xs text-gray-500 mt-1">
                Used to unlock your local encrypted wallet.
              </div>
            </div>

            {walletExists === false && (
              <div className="bg-gray-800/40 border border-gray-700 rounded p-3 text-sm text-gray-300 space-y-3">
                <div className="text-demiurge-cyan font-semibold">Wallet not found</div>
                <p>
                  Create a wallet to send CGT. Your recovery phrase will be shown once.
                </p>
                <button
                  onClick={handleCreateWallet}
                  className="w-full bg-demiurge-cyan text-black font-bold py-2 rounded hover:bg-demiurge-cyan/80 transition-colors"
                  disabled={isLoading}
                >
                  {isLoading ? 'Creating...' : 'Create Wallet'}
                </button>
              </div>
            )}

            {generatedMnemonic && (
              <div className="bg-gray-900/60 border border-demiurge-cyan/30 rounded p-3 text-sm text-gray-200 space-y-2">
                <div className="text-demiurge-cyan font-semibold">Recovery Phrase</div>
                <div className="font-mono text-xs break-all">{generatedMnemonic}</div>
                <label className="flex items-center gap-2 text-xs text-gray-300">
                  <input
                    type="checkbox"
                    checked={acknowledgedBackup}
                    onChange={(e) => setAcknowledgedBackup(e.target.checked)}
                  />
                  I have saved this recovery phrase securely
                </label>
              </div>
            )}

            {error && (
              <div className="bg-red-900/30 border border-red-500/50 rounded p-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 bg-gray-800 text-white font-bold py-2 rounded hover:bg-gray-700 transition-colors"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={isLoading || !toAddress || !amount || !password}
                className="flex-1 bg-demiurge-cyan text-black font-bold py-2 rounded hover:bg-demiurge-cyan/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
