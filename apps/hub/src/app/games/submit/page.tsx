'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { qorAuth } from '@demiurge/qor-sdk';
import { useBlockchain } from '@/contexts/BlockchainContext';
import { GameCategory, GameEngine } from '@/lib/game-registry';

// Category and engine options
const CATEGORIES: { id: GameCategory; label: string; description: string }[] = [
  { id: 'miner', label: 'Miner Game', description: 'Games focused on mining/earning CGT or Sparks' },
  { id: 'drc369', label: 'NFT Game', description: 'Games with DRC-369 NFT integration' },
  { id: 'casual', label: 'Casual', description: 'Fun games without blockchain rewards' },
  { id: 'multiplayer', label: 'Multiplayer', description: 'Games with real-time multiplayer' },
  { id: 'adventure', label: 'Adventure', description: 'RPG and adventure games' },
];

const ENGINES: { id: GameEngine; label: string; docs: string }[] = [
  { id: 'phaser', label: 'Phaser.js', docs: '/docs/developers/phaser' },
  { id: 'scattertxt', label: 'ScatterTXT', docs: '/docs/developers/scattertxt' },
  { id: 'rosebud', label: 'Rosebud.ai', docs: '/docs/developers/rosebud' },
  { id: 'unity-webgl', label: 'Unity WebGL', docs: '/docs/developers/unity' },
  { id: 'unreal-webgl', label: 'Unreal Engine', docs: '/docs/developers/unreal' },
  { id: 'custom', label: 'Custom/Other', docs: '/docs/developers/custom' },
];

const MINIMUM_STAKE = 1000; // 1000 CGT minimum

interface SubmissionForm {
  title: string;
  description: string;
  gameUrl: string;
  thumbnailUrl: string;
  category: GameCategory | '';
  engine: GameEngine | '';
  engineVersion: string;
  stake: number;
  agreeTerms: boolean;
}

export default function GameSubmitPage() {
  const router = useRouter();
  const { isConnected, getBalance } = useBlockchain();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [balance, setBalance] = useState<number>(0);
  const [step, setStep] = useState(1);
  
  const [form, setForm] = useState<SubmissionForm>({
    title: '',
    description: '',
    gameUrl: '',
    thumbnailUrl: '',
    category: '',
    engine: '',
    engineVersion: '',
    stake: MINIMUM_STAKE,
    agreeTerms: false,
  });

  const isAuthenticated = qorAuth.isAuthenticated();

  useEffect(() => {
    loadBalance();
  }, [isConnected]);

  const loadBalance = async () => {
    if (isConnected && isAuthenticated) {
      try {
        const profile = await qorAuth.getProfile();
        const address = profile.on_chain_address || profile.on_chain?.address;
        if (address) {
          const bal = await getBalance(address);
          setBalance(parseInt(bal || '0') / 100); // Convert from smallest units
        }
      } catch (err) {
        console.error('Failed to load balance:', err);
      }
    }
  };

  const handleSubmit = async () => {
    if (!form.title || !form.description || !form.gameUrl || !form.category || !form.engine) {
      setError('Please fill in all required fields');
      return;
    }

    if (form.stake < MINIMUM_STAKE) {
      setError(`Minimum stake is ${MINIMUM_STAKE} CGT`);
      return;
    }

    if (form.stake > balance) {
      setError('Insufficient CGT balance');
      return;
    }

    if (!form.agreeTerms) {
      setError('You must agree to the terms and conditions');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Submit to API
      const response = await fetch('/api/games/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${qorAuth.getToken()}`,
        },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          gameUrl: form.gameUrl,
          thumbnailUrl: form.thumbnailUrl,
          category: form.category,
          engine: form.engine,
          engineVersion: form.engineVersion,
          stake: form.stake,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit game');
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to submit game');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen p-8">
        <div className="max-w-2xl mx-auto text-center py-20">
          <h1 className="text-4xl font-bold mb-4 text-white">Submit Your Game</h1>
          <p className="text-gray-400 mb-8">You need to be logged in to submit a game.</p>
          <Link
            href="/social"
            className="inline-block px-8 py-3 bg-gradient-to-r from-demiurge-cyan to-demiurge-violet text-black font-bold rounded-lg hover:opacity-80 transition-all"
          >
            Login with QOR ID
          </Link>
        </div>
      </main>
    );
  }

  if (success) {
    return (
      <main className="min-h-screen p-8">
        <div className="max-w-2xl mx-auto text-center py-20">
          <div className="text-6xl mb-6">🎮</div>
          <h1 className="text-4xl font-bold mb-4 text-demiurge-cyan">Game Submitted!</h1>
          <p className="text-gray-400 mb-8">
            Your game has been submitted for review. You will be notified when it's approved.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/games"
              className="px-6 py-3 glass-panel rounded-lg hover:chroma-glow transition-all"
            >
              Browse Games
            </Link>
            <Link
              href="/dashboard"
              className="px-6 py-3 bg-gradient-to-r from-demiurge-cyan to-demiurge-violet text-black font-bold rounded-lg hover:opacity-80 transition-all"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/games" className="text-demiurge-cyan hover:underline mb-4 inline-block">
            ← Back to Games
          </Link>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-demiurge-cyan via-demiurge-violet to-demiurge-gold bg-clip-text text-transparent">
            Submit Your Game
          </h1>
          <p className="text-xl text-gray-300">
            Register your game on the Demiurge blockchain and reach millions of players.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`flex-1 h-2 rounded-full transition-all ${
                s <= step ? 'bg-gradient-to-r from-demiurge-cyan to-demiurge-violet' : 'bg-gray-700'
              }`}
            />
          ))}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {/* Step 1: Game Details */}
        {step === 1 && (
          <div className="glass-panel p-8 rounded-lg">
            <h2 className="text-2xl font-bold mb-6">Game Details</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Game Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-demiurge-cyan focus:outline-none"
                  placeholder="Enter your game's title"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Description *</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-demiurge-cyan focus:outline-none h-32 resize-none"
                  placeholder="Describe your game, its features, and how players can earn rewards..."
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Game URL *</label>
                <input
                  type="url"
                  value={form.gameUrl}
                  onChange={(e) => setForm(prev => ({ ...prev, gameUrl: e.target.value }))}
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-demiurge-cyan focus:outline-none"
                  placeholder="https://ipfs.io/ipfs/... or https://yourdomain.com/game/"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Upload your game to IPFS or a hosting service. Must contain an index.html file.
                </p>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Thumbnail URL</label>
                <input
                  type="url"
                  value={form.thumbnailUrl}
                  onChange={(e) => setForm(prev => ({ ...prev, thumbnailUrl: e.target.value }))}
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-demiurge-cyan focus:outline-none"
                  placeholder="https://example.com/thumbnail.png"
                />
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                onClick={() => setStep(2)}
                disabled={!form.title || !form.description || !form.gameUrl}
                className="px-8 py-3 bg-gradient-to-r from-demiurge-cyan to-demiurge-violet text-black font-bold rounded-lg hover:opacity-80 transition-all disabled:opacity-50"
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Category & Engine */}
        {step === 2 && (
          <div className="glass-panel p-8 rounded-lg">
            <h2 className="text-2xl font-bold mb-6">Category & Engine</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm text-gray-400 mb-3">Game Category *</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setForm(prev => ({ ...prev, category: cat.id }))}
                      className={`p-4 rounded-lg text-left transition-all ${
                        form.category === cat.id
                          ? 'bg-demiurge-cyan/20 border-2 border-demiurge-cyan'
                          : 'glass-panel hover:bg-gray-800/50'
                      }`}
                    >
                      <div className="font-bold text-white">{cat.label}</div>
                      <div className="text-sm text-gray-400">{cat.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-3">Game Engine *</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {ENGINES.map((engine) => (
                    <button
                      key={engine.id}
                      onClick={() => setForm(prev => ({ ...prev, engine: engine.id }))}
                      className={`p-4 rounded-lg text-center transition-all ${
                        form.engine === engine.id
                          ? 'bg-demiurge-cyan/20 border-2 border-demiurge-cyan'
                          : 'glass-panel hover:bg-gray-800/50'
                      }`}
                    >
                      <div className="font-bold text-white">{engine.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Engine Version (optional)</label>
                <input
                  type="text"
                  value={form.engineVersion}
                  onChange={(e) => setForm(prev => ({ ...prev, engineVersion: e.target.value }))}
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-demiurge-cyan focus:outline-none"
                  placeholder="e.g., 3.70.0"
                />
              </div>
            </div>

            <div className="mt-8 flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="px-8 py-3 glass-panel rounded-lg hover:chroma-glow transition-all"
              >
                ← Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!form.category || !form.engine}
                className="px-8 py-3 bg-gradient-to-r from-demiurge-cyan to-demiurge-violet text-black font-bold rounded-lg hover:opacity-80 transition-all disabled:opacity-50"
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Stake & Submit */}
        {step === 3 && (
          <div className="glass-panel p-8 rounded-lg">
            <h2 className="text-2xl font-bold mb-6">Stake & Submit</h2>
            
            <div className="space-y-6">
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <h3 className="font-bold text-yellow-400 mb-2">Stake Requirement</h3>
                <p className="text-gray-400 text-sm">
                  A minimum stake of {MINIMUM_STAKE} CGT is required to register your game.
                  This stake is returned when you remove your game from the registry.
                  It helps prevent spam and ensures quality.
                </p>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Stake Amount (CGT) *</label>
                <div className="flex items-center gap-4">
                  <input
                    type="number"
                    value={form.stake}
                    onChange={(e) => setForm(prev => ({ ...prev, stake: parseInt(e.target.value) || 0 }))}
                    min={MINIMUM_STAKE}
                    className="flex-1 bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-demiurge-cyan focus:outline-none"
                  />
                  <div className="text-gray-400">
                    Balance: <span className="text-demiurge-cyan font-bold">{balance.toLocaleString()} CGT</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Minimum: {MINIMUM_STAKE} CGT. Higher stakes may lead to faster approval.
                </p>
              </div>

              <div className="p-6 bg-gray-800/30 rounded-lg">
                <h3 className="font-bold text-white mb-4">Submission Summary</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Title:</span>
                    <span className="ml-2 text-white">{form.title}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Category:</span>
                    <span className="ml-2 text-white">{CATEGORIES.find(c => c.id === form.category)?.label}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Engine:</span>
                    <span className="ml-2 text-white">{ENGINES.find(e => e.id === form.engine)?.label}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Stake:</span>
                    <span className="ml-2 text-demiurge-cyan font-bold">{form.stake} CGT</span>
                  </div>
                </div>
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.agreeTerms}
                  onChange={(e) => setForm(prev => ({ ...prev, agreeTerms: e.target.checked }))}
                  className="mt-1"
                />
                <span className="text-sm text-gray-400">
                  I confirm that I own the rights to this game, it does not contain malicious code,
                  and I agree to the{' '}
                  <Link href="/docs/terms" className="text-demiurge-cyan hover:underline">
                    Terms of Service
                  </Link>
                  {' '}and{' '}
                  <Link href="/docs/game-guidelines" className="text-demiurge-cyan hover:underline">
                    Game Submission Guidelines
                  </Link>.
                </span>
              </label>
            </div>

            <div className="mt-8 flex justify-between">
              <button
                onClick={() => setStep(2)}
                className="px-8 py-3 glass-panel rounded-lg hover:chroma-glow transition-all"
              >
                ← Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || !form.agreeTerms || form.stake < MINIMUM_STAKE}
                className="px-8 py-3 bg-gradient-to-r from-demiurge-cyan to-demiurge-violet text-black font-bold rounded-lg hover:opacity-80 transition-all disabled:opacity-50"
              >
                {loading ? 'Submitting...' : `Submit Game (Stake ${form.stake} CGT)`}
              </button>
            </div>
          </div>
        )}

        {/* Help Section */}
        <div className="mt-8 glass-panel p-6 rounded-lg">
          <h3 className="font-bold text-white mb-4">Need Help?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/docs/developers/getting-started"
              className="p-4 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 transition-all"
            >
              <div className="font-bold text-demiurge-cyan">Developer Guide</div>
              <div className="text-sm text-gray-400">Learn how to build games for Demiurge</div>
            </Link>
            <Link
              href="/docs/game-integration-guide"
              className="p-4 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 transition-all"
            >
              <div className="font-bold text-demiurge-cyan">Integration Guide</div>
              <div className="text-sm text-gray-400">Add blockchain features to your game</div>
            </Link>
            <Link
              href="/scattertxt"
              className="p-4 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 transition-all"
            >
              <div className="font-bold text-demiurge-cyan">ScatterTXT Engine</div>
              <div className="text-sm text-gray-400">Build games with our native engine</div>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
