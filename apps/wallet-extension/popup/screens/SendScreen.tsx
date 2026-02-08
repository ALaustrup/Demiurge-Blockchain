// Demiurge Wallet Extension - Send Screen
import React, { useState } from 'react';
import { useStore } from '../store';
import { Button } from '../components/Button';

export function SendScreen() {
  const { sendTransaction, setView, isLoading, formattedBalance } = useStore();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  const validateAddress = (address: string): boolean => {
    // Basic validation for Demiurge addresses (hex string of correct length)
    return /^[0-9a-fA-F]{64}$/.test(address);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate recipient address
    if (!validateAddress(recipient)) {
      setError('Invalid recipient address');
      return;
    }

    // Validate amount
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    // Convert to base units (assuming 18 decimals like most chains)
    const amountInBaseUnits = (BigInt(Math.floor(amountNum * 1e6)) * BigInt(1e12)).toString();

    try {
      await sendTransaction(recipient, amountInBaseUnits);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const handleMaxAmount = () => {
    if (formattedBalance) {
      setAmount(formattedBalance);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => setView('main')}
          className="p-2 text-gray-400 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-bold text-white">Send CGT</h1>
      </div>

      <form onSubmit={handleSend} className="flex-1 flex flex-col">
        <div className="space-y-4 flex-1">
          {/* Recipient */}
          <div>
            <label className="block text-gray-300 text-sm mb-2">Recipient Address</label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="Enter recipient address (64 hex characters)"
              className="input font-mono text-sm"
            />
          </div>

          {/* Amount */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-gray-300 text-sm">Amount</label>
              <button
                type="button"
                onClick={handleMaxAmount}
                className="text-demiurge-400 text-sm hover:text-demiurge-300 transition-colors"
              >
                Max: {formattedBalance ?? '0'} CGT
              </button>
            </div>
            <div className="relative">
              <input
                type="number"
                step="0.000001"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="input pr-16"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
                CGT
              </span>
            </div>
          </div>

          {/* Transaction Preview */}
          {amount && recipient && (
            <div className="card">
              <h3 className="text-gray-400 text-sm mb-3">Transaction Preview</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Amount</span>
                  <span className="text-white font-medium">{amount} CGT</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Network Fee</span>
                  <span className="text-white">~0.001 CGT</span>
                </div>
                <div className="border-t border-gray-700 pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total</span>
                    <span className="text-white font-bold">
                      {(parseFloat(amount || '0') + 0.001).toFixed(6)} CGT
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {error && (
          <p className="text-red-500 text-sm mb-4">{error}</p>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant="secondary"
            fullWidth
            onClick={() => setView('main')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            fullWidth
            loading={isLoading}
            disabled={!recipient || !amount}
          >
            Send
          </Button>
        </div>
      </form>
    </div>
  );
}
