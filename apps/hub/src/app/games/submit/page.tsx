'use client';

import { useState, useEffect, useRef } from 'react';
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
const MAX_FILE_SIZE = 50 * 1024 * 1024 * 1024; // 50GB in bytes
const MAX_FILE_SIZE_DISPLAY = '50GB';

interface SubmissionForm {
  title: string;
  description: string;
  gameFile: File | null;
  gameUrl: string;
  thumbnailFile: File | null;
  thumbnailUrl: string;
  category: GameCategory | '';
  engine: GameEngine | '';
  engineVersion: string;
  stake: number;
  agreeTerms: boolean;
  uploadMethod: 'file' | 'url';
}

export default function GameSubmitPage() {
  const router = useRouter();
  const { isConnected, getBalance } = useBlockchain();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [balance, setBalance] = useState<number>(0);
  const [step, setStep] = useState(1);
  
  const gameFileRef = useRef<HTMLInputElement>(null);
  const thumbnailFileRef = useRef<HTMLInputElement>(null);
  
  const [form, setForm] = useState<SubmissionForm>({
    title: '',
    description: '',
    gameFile: null,
    gameUrl: '',
    thumbnailFile: null,
    thumbnailUrl: '',
    category: '',
    engine: '',
    engineVersion: '',
    stake: MINIMUM_STAKE,
    agreeTerms: false,
    uploadMethod: 'file',
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
          setBalance(parseInt(bal || '0') / 100);
        }
      } catch (err) {
        console.error('Failed to load balance:', err);
      }
    }
  };

  const handleGameFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        setError(`File size exceeds ${MAX_FILE_SIZE_DISPLAY} limit`);
        return;
      }
      if (!file.name.endsWith('.zip')) {
        setError('Please upload a .zip archive');
        return;
      }
      setForm(prev => ({ ...prev, gameFile: file }));
      setError(null);
    }
  };

  const handleThumbnailFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB max for thumbnail
        setError('Thumbnail must be less than 10MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file');
        return;
      }
      setForm(prev => ({ ...prev, thumbnailFile: file }));
      setError(null);
    }
  };

  const uploadFile = async (file: File, type: 'game' | 'thumbnail'): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    const xhr = new XMLHttpRequest();
    
    return new Promise((resolve, reject) => {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(percent);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const response = JSON.parse(xhr.responseText);
          resolve(response.url || response.ipfsHash);
        } else {
          reject(new Error('Upload failed'));
        }
      });

      xhr.addEventListener('error', () => reject(new Error('Upload failed')));
      
      xhr.open('POST', '/api/ipfs/upload');
      xhr.setRequestHeader('Authorization', `Bearer ${qorAuth.getToken()}`);
      xhr.send(formData);
    });
  };

  const handleSubmit = async () => {
    if (!form.title || !form.description || !form.category || !form.engine) {
      setError('Please fill in all required fields');
      return;
    }

    if (form.uploadMethod === 'file' && !form.gameFile) {
      setError('Please upload your game archive');
      return;
    }

    if (form.uploadMethod === 'url' && !form.gameUrl) {
      setError('Please provide a game URL');
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

      let gameUrl = form.gameUrl;
      let thumbnailUrl = form.thumbnailUrl;

      // Upload game file if using file upload
      if (form.uploadMethod === 'file' && form.gameFile) {
        setUploading(true);
        gameUrl = await uploadFile(form.gameFile, 'game');
      }

      // Upload thumbnail if provided
      if (form.thumbnailFile) {
        thumbnailUrl = await uploadFile(form.thumbnailFile, 'thumbnail');
      }

      setUploading(false);
      setUploadProgress(0);

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
          gameUrl,
          thumbnailUrl,
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
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  };

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen p-8">
        <div className="max-w-2xl mx-auto text-center py-20">
          <h1 className="text-4xl font-bold mb-4 text-holo-gradient">Submit Your Game</h1>
          <p className="text-lavender mb-8">You need to be logged in to submit a game.</p>
          <Link
            href="/login"
            className="launcher-button-primary px-8 py-3 rounded-lg inline-block"
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
          <h1 className="text-4xl font-bold mb-4 text-data-cyan">Game Submitted!</h1>
          <p className="text-lavender mb-8">
            Your game has been submitted for review. You will be notified when it's approved.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/games" className="launcher-button px-6 py-3 rounded-lg">
              Browse Games
            </Link>
            <Link href="/dashboard" className="launcher-button-primary px-6 py-3 rounded-lg">
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
          <Link href="/games" className="text-data-cyan hover:underline mb-4 inline-block">
            ← Back to Games
          </Link>
          <h1 className="text-5xl font-bold mb-4 text-holo-gradient">
            Submit Your Game
          </h1>
          <p className="text-xl text-holographic">
            Register your game on the Demiurge blockchain and reach millions of players.
          </p>
        </div>

        {/* Developer Documentation Banner */}
        <div className="holo-panel p-6 mb-8 border-data-cyan/30">
          <div className="flex items-start gap-4">
            <div className="text-4xl">📚</div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-data-cyan mb-2">Game Developer Documentation</h3>
              <p className="text-lavender mb-4">
                Before submitting, ensure your game is set up for on-chain service integration.
                Our SDK enables DRC-369 NFT assets, wallet inventories, achievements, and player XP towards QOR levels.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link 
                  href="/docs/developers/PHASER_INTEGRATION" 
                  className="launcher-button px-4 py-2 text-sm rounded-lg"
                  style={{ textShadow: '0 0 8px rgba(0, 212, 255, 0.5)' }}
                >
                  📖 Phaser Integration Guide
                </Link>
                <Link 
                  href="/docs/developers/DRC_SDK" 
                  className="launcher-button px-4 py-2 text-sm rounded-lg"
                  style={{ textShadow: '0 0 8px rgba(0, 212, 255, 0.5)' }}
                >
                  🔗 DRC-369 SDK
                </Link>
                <Link 
                  href="/docs/developers/game-achievements" 
                  className="launcher-button px-4 py-2 text-sm rounded-lg"
                  style={{ textShadow: '0 0 8px rgba(0, 212, 255, 0.5)' }}
                >
                  🏆 Achievements API
                </Link>
                <Link 
                  href="/docs/developers/player-xp" 
                  className="launcher-button px-4 py-2 text-sm rounded-lg"
                  style={{ textShadow: '0 0 8px rgba(0, 212, 255, 0.5)' }}
                >
                  ⚡ Player XP System
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`flex-1 h-2 rounded-full transition-all ${
                s <= step ? 'bg-gradient-to-r from-holographic to-data-cyan' : 'bg-ultraviolet/50'
              }`}
            />
          ))}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {/* Upload Progress */}
        {uploading && (
          <div className="mb-6 p-4 holo-panel rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-holographic">Uploading game archive...</span>
              <span className="text-data-cyan font-mono">{uploadProgress}%</span>
            </div>
            <div className="h-2 bg-ultraviolet/50 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-holographic to-data-cyan transition-all"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Step 1: Game Details & Upload */}
        {step === 1 && (
          <div className="holo-panel p-8 rounded-xl">
            <h2 className="text-2xl font-bold mb-6 text-holographic">Game Details & Upload</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm text-lavender mb-2">Game Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full bg-void/80 border border-lavender/30 rounded-lg px-4 py-3 text-white focus:border-data-cyan focus:outline-none"
                  placeholder="Enter your game's title"
                />
              </div>

              <div>
                <label className="block text-sm text-lavender mb-2">Description *</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-void/80 border border-lavender/30 rounded-lg px-4 py-3 text-white focus:border-data-cyan focus:outline-none h-32 resize-none"
                  placeholder="Describe your game, its features, and how players can earn rewards..."
                />
              </div>

              {/* Upload Method Toggle */}
              <div>
                <label className="block text-sm text-lavender mb-3">Game Files *</label>
                <div className="flex gap-4 mb-4">
                  <button
                    onClick={() => setForm(prev => ({ ...prev, uploadMethod: 'file' }))}
                    className={`flex-1 p-4 rounded-lg border transition-all ${
                      form.uploadMethod === 'file' 
                        ? 'border-data-cyan bg-ultraviolet/30' 
                        : 'border-lavender/30 hover:border-lavender/50'
                    }`}
                  >
                    <div className="text-2xl mb-2">📦</div>
                    <div className="font-bold text-holographic">Upload Archive</div>
                    <div className="text-xs text-lavender mt-1">Max {MAX_FILE_SIZE_DISPLAY} .zip file</div>
                  </button>
                  <button
                    onClick={() => setForm(prev => ({ ...prev, uploadMethod: 'url' }))}
                    className={`flex-1 p-4 rounded-lg border transition-all ${
                      form.uploadMethod === 'url' 
                        ? 'border-data-cyan bg-ultraviolet/30' 
                        : 'border-lavender/30 hover:border-lavender/50'
                    }`}
                  >
                    <div className="text-2xl mb-2">🔗</div>
                    <div className="font-bold text-holographic">External URL</div>
                    <div className="text-xs text-lavender mt-1">IPFS or hosted URL</div>
                  </button>
                </div>

                {form.uploadMethod === 'file' ? (
                  <div
                    onClick={() => gameFileRef.current?.click()}
                    className="border-2 border-dashed border-lavender/30 hover:border-data-cyan/50 rounded-lg p-8 text-center cursor-pointer transition-all"
                  >
                    <input
                      ref={gameFileRef}
                      type="file"
                      accept=".zip"
                      onChange={handleGameFileChange}
                      className="hidden"
                    />
                    {form.gameFile ? (
                      <div>
                        <div className="text-4xl mb-3">✅</div>
                        <div className="text-holographic font-bold">{form.gameFile.name}</div>
                        <div className="text-lavender text-sm mt-1">{formatFileSize(form.gameFile.size)}</div>
                        <div className="text-data-cyan text-sm mt-2">Click to change file</div>
                      </div>
                    ) : (
                      <div>
                        <div className="text-4xl mb-3">📤</div>
                        <div className="text-holographic font-bold">Click to upload game archive</div>
                        <div className="text-lavender text-sm mt-2">
                          .zip file containing your game (index.html at root)
                        </div>
                        <div className="text-lavender/60 text-xs mt-1">Maximum file size: {MAX_FILE_SIZE_DISPLAY}</div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <input
                      type="url"
                      value={form.gameUrl}
                      onChange={(e) => setForm(prev => ({ ...prev, gameUrl: e.target.value }))}
                      className="w-full bg-void/80 border border-lavender/30 rounded-lg px-4 py-3 text-white focus:border-data-cyan focus:outline-none"
                      placeholder="https://ipfs.io/ipfs/... or https://yourdomain.com/game/"
                    />
                    <p className="text-xs text-lavender/60 mt-1">
                      Must contain an index.html file at the root
                    </p>
                  </div>
                )}
              </div>

              {/* Thumbnail Upload */}
              <div>
                <label className="block text-sm text-lavender mb-2">Thumbnail Image</label>
                <div className="flex gap-4">
                  <div
                    onClick={() => thumbnailFileRef.current?.click()}
                    className="w-40 h-24 border border-lavender/30 hover:border-data-cyan/50 rounded-lg flex items-center justify-center cursor-pointer transition-all overflow-hidden"
                  >
                    <input
                      ref={thumbnailFileRef}
                      type="file"
                      accept="image/*"
                      onChange={handleThumbnailFileChange}
                      className="hidden"
                    />
                    {form.thumbnailFile ? (
                      <img 
                        src={URL.createObjectURL(form.thumbnailFile)} 
                        alt="Thumbnail preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-lavender/60 text-sm">+ Add thumbnail</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="url"
                      value={form.thumbnailUrl}
                      onChange={(e) => setForm(prev => ({ ...prev, thumbnailUrl: e.target.value }))}
                      className="w-full bg-void/80 border border-lavender/30 rounded-lg px-4 py-3 text-white focus:border-data-cyan focus:outline-none"
                      placeholder="Or enter thumbnail URL"
                      disabled={!!form.thumbnailFile}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                onClick={() => setStep(2)}
                disabled={!form.title || !form.description || (form.uploadMethod === 'file' ? !form.gameFile : !form.gameUrl)}
                className="launcher-button-primary px-8 py-3 rounded-lg disabled:opacity-50"
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Category & Engine */}
        {step === 2 && (
          <div className="holo-panel p-8 rounded-xl">
            <h2 className="text-2xl font-bold mb-6 text-holographic">Category & Engine</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm text-lavender mb-3">Game Category *</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setForm(prev => ({ ...prev, category: cat.id }))}
                      className={`p-4 rounded-lg text-left transition-all border ${
                        form.category === cat.id
                          ? 'bg-ultraviolet/40 border-data-cyan'
                          : 'border-lavender/30 hover:border-lavender/50 hover:bg-ultraviolet/20'
                      }`}
                    >
                      <div className="font-bold text-holographic">{cat.label}</div>
                      <div className="text-sm text-lavender">{cat.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-lavender mb-3">Game Engine *</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {ENGINES.map((engine) => (
                    <button
                      key={engine.id}
                      onClick={() => setForm(prev => ({ ...prev, engine: engine.id }))}
                      className={`p-4 rounded-lg text-center transition-all border ${
                        form.engine === engine.id
                          ? 'bg-ultraviolet/40 border-data-cyan'
                          : 'border-lavender/30 hover:border-lavender/50 hover:bg-ultraviolet/20'
                      }`}
                    >
                      <div className="font-bold text-holographic">{engine.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-lavender mb-2">Engine Version (optional)</label>
                <input
                  type="text"
                  value={form.engineVersion}
                  onChange={(e) => setForm(prev => ({ ...prev, engineVersion: e.target.value }))}
                  className="w-full bg-void/80 border border-lavender/30 rounded-lg px-4 py-3 text-white focus:border-data-cyan focus:outline-none"
                  placeholder="e.g., 3.70.0"
                />
              </div>
            </div>

            <div className="mt-8 flex justify-between">
              <button onClick={() => setStep(1)} className="launcher-button px-8 py-3 rounded-lg">
                ← Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!form.category || !form.engine}
                className="launcher-button-primary px-8 py-3 rounded-lg disabled:opacity-50"
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Stake & Submit */}
        {step === 3 && (
          <div className="holo-panel p-8 rounded-xl">
            <h2 className="text-2xl font-bold mb-6 text-holographic">Stake & Submit</h2>
            
            <div className="space-y-6">
              <div className="p-4 bg-data-gold/10 border border-data-gold/30 rounded-lg">
                <h3 className="font-bold text-data-gold mb-2">Stake Requirement</h3>
                <p className="text-lavender text-sm">
                  A minimum stake of {MINIMUM_STAKE} CGT is required to register your game.
                  This stake is returned when you remove your game from the registry.
                  It helps prevent spam and ensures quality.
                </p>
              </div>

              <div>
                <label className="block text-sm text-lavender mb-2">Stake Amount (CGT) *</label>
                <div className="flex items-center gap-4">
                  <input
                    type="number"
                    value={form.stake}
                    onChange={(e) => setForm(prev => ({ ...prev, stake: parseInt(e.target.value) || 0 }))}
                    min={MINIMUM_STAKE}
                    className="flex-1 bg-void/80 border border-lavender/30 rounded-lg px-4 py-3 text-white focus:border-data-cyan focus:outline-none"
                  />
                  <div className="text-lavender">
                    Balance: <span className="text-data-cyan font-bold">{balance.toLocaleString()} CGT</span>
                  </div>
                </div>
                <p className="text-xs text-lavender/60 mt-1">
                  Minimum: {MINIMUM_STAKE} CGT. Higher stakes may lead to faster approval.
                </p>
              </div>

              <div className="p-6 bg-ultraviolet/20 rounded-lg">
                <h3 className="font-bold text-holographic mb-4">Submission Summary</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-lavender">Title:</span>
                    <span className="ml-2 text-white">{form.title}</span>
                  </div>
                  <div>
                    <span className="text-lavender">Category:</span>
                    <span className="ml-2 text-white">{CATEGORIES.find(c => c.id === form.category)?.label}</span>
                  </div>
                  <div>
                    <span className="text-lavender">Engine:</span>
                    <span className="ml-2 text-white">{ENGINES.find(e => e.id === form.engine)?.label}</span>
                  </div>
                  <div>
                    <span className="text-lavender">Stake:</span>
                    <span className="ml-2 text-data-cyan font-bold">{form.stake} CGT</span>
                  </div>
                  {form.gameFile && (
                    <div className="col-span-2">
                      <span className="text-lavender">Game File:</span>
                      <span className="ml-2 text-white">{form.gameFile.name} ({formatFileSize(form.gameFile.size)})</span>
                    </div>
                  )}
                </div>
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.agreeTerms}
                  onChange={(e) => setForm(prev => ({ ...prev, agreeTerms: e.target.checked }))}
                  className="mt-1 accent-data-cyan"
                />
                <span className="text-sm text-lavender">
                  I confirm that I own the rights to this game, it does not contain malicious code,
                  and I agree to the{' '}
                  <Link href="/docs/terms" className="text-data-cyan hover:underline">
                    Terms of Service
                  </Link>
                  {' '}and{' '}
                  <Link href="/docs/game-guidelines" className="text-data-cyan hover:underline">
                    Game Submission Guidelines
                  </Link>.
                </span>
              </label>
            </div>

            <div className="mt-8 flex justify-between">
              <button onClick={() => setStep(2)} className="launcher-button px-8 py-3 rounded-lg">
                ← Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || !form.agreeTerms || form.stake < MINIMUM_STAKE}
                className="launcher-button-primary px-8 py-3 rounded-lg disabled:opacity-50"
              >
                {loading ? 'Submitting...' : `Submit Game (Stake ${form.stake} CGT)`}
              </button>
            </div>
          </div>
        )}

        {/* On-Chain Integration Guide */}
        <div className="mt-8 holo-panel p-6 rounded-xl">
          <h3 className="font-bold text-holographic text-xl mb-4">🔗 On-Chain Integration Features</h3>
          <p className="text-lavender mb-6">
            Integrate these features into your game to provide players with blockchain-powered experiences:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-ultraviolet/20 rounded-lg border border-lavender/20">
              <div className="text-2xl mb-2">🎨</div>
              <div className="font-bold text-data-cyan">DRC-369 NFT Assets</div>
              <p className="text-sm text-lavender mt-1">
                Let players earn, trade, and use NFT items in your game. Swords, skins, collectibles.
              </p>
              <Link href="/docs/developers/drc-sdk" className="text-xs text-data-cyan hover:underline mt-2 inline-block">
                View SDK Documentation →
              </Link>
            </div>
            <div className="p-4 bg-ultraviolet/20 rounded-lg border border-lavender/20">
              <div className="text-2xl mb-2">💼</div>
              <div className="font-bold text-data-cyan">Wallet Inventories</div>
              <p className="text-sm text-lavender mt-1">
                Connect player wallets to sync game inventories with their on-chain assets.
              </p>
              <Link href="/docs/developers/wallet-integration" className="text-xs text-data-cyan hover:underline mt-2 inline-block">
                View Integration Guide →
              </Link>
            </div>
            <div className="p-4 bg-ultraviolet/20 rounded-lg border border-lavender/20">
              <div className="text-2xl mb-2">🏆</div>
              <div className="font-bold text-data-cyan">Achievements System</div>
              <p className="text-sm text-lavender mt-1">
                Award permanent on-chain achievements that players can show off across the ecosystem.
              </p>
              <Link href="/docs/developers/achievements" className="text-xs text-data-cyan hover:underline mt-2 inline-block">
                View Achievements API →
              </Link>
            </div>
            <div className="p-4 bg-ultraviolet/20 rounded-lg border border-lavender/20">
              <div className="text-2xl mb-2">⚡</div>
              <div className="font-bold text-data-cyan">QOR Level XP</div>
              <p className="text-sm text-lavender mt-1">
                Players earn XP towards their QOR Level by playing your game. Higher levels unlock perks.
              </p>
              <Link href="/docs/developers/qor-xp" className="text-xs text-data-cyan hover:underline mt-2 inline-block">
                View XP System →
              </Link>
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-8 holo-panel p-6 rounded-xl">
          <h3 className="font-bold text-holographic mb-4">Need Help?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/docs/developers"
              className="p-4 bg-ultraviolet/20 rounded-lg hover:bg-ultraviolet/40 transition-all border border-lavender/20"
            >
              <div className="font-bold text-data-cyan">Developer Guide</div>
              <div className="text-sm text-lavender">Learn how to build games for Demiurge</div>
            </Link>
            <Link
              href="/docs/developers/PHASER_INTEGRATION"
              className="p-4 bg-ultraviolet/20 rounded-lg hover:bg-ultraviolet/40 transition-all border border-lavender/20"
            >
              <div className="font-bold text-data-cyan">Phaser.js Guide</div>
              <div className="text-sm text-lavender">Add blockchain features to Phaser games</div>
            </Link>
            <Link
              href="/development"
              className="p-4 bg-ultraviolet/20 rounded-lg hover:bg-ultraviolet/40 transition-all border border-lavender/20"
            >
              <div className="font-bold text-data-cyan">Developer Hub</div>
              <div className="text-sm text-lavender">Access all developer resources</div>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
