'use client';

import { useEffect, useState } from 'react';
import { qorAuth } from '@demiurge/qor-sdk';
import { getKeypairForQorId, generateAddressFromQorId } from '@/lib/qor-wallet';

interface SessionKey {
  id: string;
  sessionKeyAddress: string;
  expiryBlock: number;
  createdAt: number;
  isActive: boolean;
}

interface SessionKeyManagerProps {
  qorId: string;
  primaryAddress: string;
}

export function SessionKeyManager({ qorId, primaryAddress }: SessionKeyManagerProps) {
  const [sessionKeys, setSessionKeys] = useState<SessionKey[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [duration, setDuration] = useState(1000); // blocks
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSessionKeys();
  }, [primaryAddress]);

  const loadSessionKeys = async () => {
    // TODO: Query blockchain for active session keys
    // For now, use mock data
    setSessionKeys([]);
  };

  const createSessionKey = async () => {
    setLoading(true);
    setError(null);

    try {
      // Generate a temporary session key account
      const sessionKeySeed = `${qorId}:session:${Date.now()}`;
      const sessionKeyAddress = generateAddressFromQorId(sessionKeySeed);

      // TODO: Call blockchain to authorize session key
      // await blockchainClient.authorizeSessionKey(primaryAddress, sessionKeyAddress, duration);

      // Add to local state (temporary)
      const newKey: SessionKey = {
        id: Date.now().toString(),
        sessionKeyAddress,
        expiryBlock: 0, // TODO: Calculate from current block + duration
        createdAt: Date.now(),
        isActive: true,
      };

      setSessionKeys([...sessionKeys, newKey]);
      setShowCreateModal(false);
      setDuration(1000);
    } catch (err: any) {
      setError(err.message || 'Failed to create session key');
    } finally {
      setLoading(false);
    }
  };

  const revokeSessionKey = async (keyId: string) => {
    setLoading(true);
    try {
      // TODO: Call blockchain to revoke session key
      // await blockchainClient.revokeSessionKey(primaryAddress, sessionKeyAddress);

      setSessionKeys(sessionKeys.filter(k => k.id !== keyId));
    } catch (err: any) {
      setError(err.message || 'Failed to revoke session key');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (blocks: number) => {
    // Assuming 6 seconds per block
    const seconds = blocks * 6;
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div className="glass-panel rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-demiurge-cyan">Session Keys</h2>
          <p className="text-sm text-gray-400 mt-1">
            Temporary authorization keys for seamless gaming
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-demiurge-cyan text-black font-bold py-2 px-4 rounded hover:bg-demiurge-cyan/80 transition-colors"
        >
          Create Session Key
        </button>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500 rounded p-3 mb-4 text-red-400">
          {error}
        </div>
      )}

      {sessionKeys.length === 0 ? (
        <div className="text-center text-gray-400 py-8">
          <p>No active session keys</p>
          <p className="text-sm mt-2">Create one to enable seamless in-game transactions</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessionKeys.map((key) => (
            <div
              key={key.id}
              className="bg-gray-800/50 p-4 rounded-lg flex items-center justify-between"
            >
              <div className="flex-1">
                <div className="font-mono text-sm text-white mb-1">
                  {key.sessionKeyAddress.slice(0, 12)}...{key.sessionKeyAddress.slice(-8)}
                </div>
                <div className="text-xs text-gray-500">
                  Expires in: {formatDuration(key.expiryBlock)} • Created: {new Date(key.createdAt).toLocaleDateString()}
                </div>
              </div>
              <button
                onClick={() => revokeSessionKey(key.id)}
                className="glass-panel px-4 py-2 rounded hover:chroma-glow transition-all text-sm text-red-400"
                disabled={loading}
              >
                Revoke
              </button>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900/95 backdrop-blur-xl border border-demiurge-cyan/30 rounded-lg p-6 w-full max-w-md glass-panel">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-demiurge-cyan">Create Session Key</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Duration (blocks)
                </label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value) || 1000)}
                  min={1}
                  max={100800} // 7 days max
                  className="w-full glass-panel px-4 py-2 rounded text-white focus:outline-none focus:ring-2 focus:ring-demiurge-cyan"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formatDuration(duration)} (max 7 days)
                </p>
              </div>

              <div className="bg-blue-500/20 border border-blue-500 rounded p-3 text-sm text-blue-400">
                <p className="font-semibold mb-1">What are Session Keys?</p>
                <p>
                  Session keys allow temporary authorization for in-game transactions
                  without wallet popups. They automatically expire after the duration.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 glass-panel py-2 rounded hover:chroma-glow transition-all"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={createSessionKey}
                  className="flex-1 bg-demiurge-cyan text-black font-bold py-2 rounded hover:bg-demiurge-cyan/80 transition-colors"
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
