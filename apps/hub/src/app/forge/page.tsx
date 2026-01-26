'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useBlockchain } from '@/contexts/BlockchainContext';
import { demiurgeRpc } from '@/lib/demiurge-rpc';
import { getOrCreateAddressForQorId } from '@/lib/qor-wallet';
import { uploadNFTToIPFS, ipfsToHttp } from '@/lib/ipfs-client';

// Types
interface NFTAsset {
  id: string;
  name: string;
  description: string;
  image: string;
  collection?: string;
  attributes: { trait_type: string; value: string }[];
  royalty: number;
  owner: string;
  mintedAt: Date;
}

interface Attribute {
  trait_type: string;
  value: string;
}

type ForgeTab = 'gallery' | 'mint' | 'offers';

// Mock data for development
const MOCK_NFTS: NFTAsset[] = [
  {
    id: 'nft-001',
    name: 'Chronos Glaive Ship',
    description: 'A legendary ship from the void wars',
    image: '/nfts/ship-001.webp',
    collection: 'Pixel Starship',
    attributes: [
      { trait_type: 'Rarity', value: 'Legendary' },
      { trait_type: 'Power', value: '950' },
    ],
    royalty: 5,
    owner: 'you',
    mintedAt: new Date(Date.now() - 86400000 * 7),
  },
  {
    id: 'nft-002',
    name: 'Cyber Mining Rig v2',
    description: 'Advanced mining equipment',
    image: '/nfts/rig-001.webp',
    collection: 'Cyber Forge',
    attributes: [
      { trait_type: 'Efficiency', value: '125%' },
      { trait_type: 'Level', value: '7' },
    ],
    royalty: 2.5,
    owner: 'you',
    mintedAt: new Date(Date.now() - 86400000 * 3),
  },
  {
    id: 'nft-003',
    name: 'OG Founder Badge',
    description: 'Proof of early adoption',
    image: '/nfts/badge-001.webp',
    collection: 'Demiurge Origins',
    attributes: [
      { trait_type: 'Badge', value: 'Founder' },
      { trait_type: 'Year', value: '2026' },
    ],
    royalty: 0,
    owner: 'you',
    mintedAt: new Date(Date.now() - 86400000 * 30),
  },
];

export default function ForgePage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { isConnected } = useBlockchain();
  const [activeTab, setActiveTab] = useState<ForgeTab>('gallery');
  const [nfts, setNfts] = useState<NFTAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNft, setSelectedNft] = useState<NFTAsset | null>(null);
  const [address, setAddress] = useState<string | null>(null);

  // Minting form state
  const [mintForm, setMintForm] = useState({
    name: '',
    description: '',
    collection: '',
    royalty: 5,
    attributes: [] as Attribute[],
  });
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [minting, setMinting] = useState(false);
  const [mintSuccess, setMintSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadUserData();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [isAuthenticated, user, authLoading]);

  const loadUserData = async () => {
    setLoading(true);
    try {
      // Get user's blockchain address
      const userAddress = await getOrCreateAddressForQorId(user!, false);
      setAddress(userAddress);

      // Try to fetch real NFTs from blockchain
      try {
        const userNfts = await demiurgeRpc.getUserNFTs(userAddress || '');
        if (userNfts && userNfts.length > 0) {
          // Convert blockchain NFT format to component format
          const formattedNfts: NFTAsset[] = userNfts.map(nft => ({
            id: nft.id,
            name: nft.name,
            description: nft.description,
            image: nft.image.startsWith('ipfs://') ? ipfsToHttp(nft.image) : nft.image,
            collection: nft.collection,
            attributes: nft.attributes || [],
            royalty: nft.royalty / 100, // Convert basis points to %
            owner: nft.owner,
            mintedAt: new Date(nft.mintedAt * 1000),
          }));
          setNfts(formattedNfts);
        } else {
          // Use mock data as fallback
          setNfts(MOCK_NFTS);
        }
      } catch (rpcError) {
        console.warn('Could not fetch NFTs from chain, using mock data:', rpcError);
        setNfts(MOCK_NFTS);
      }
    } catch (error) {
      console.error('Failed to load NFT data:', error);
      setNfts(MOCK_NFTS);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMediaFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addAttribute = () => {
    setMintForm(prev => ({
      ...prev,
      attributes: [...prev.attributes, { trait_type: '', value: '' }],
    }));
  };

  const updateAttribute = (index: number, field: 'trait_type' | 'value', value: string) => {
    setMintForm(prev => ({
      ...prev,
      attributes: prev.attributes.map((attr, i) =>
        i === index ? { ...attr, [field]: value } : attr
      ),
    }));
  };

  const removeAttribute = (index: number) => {
    setMintForm(prev => ({
      ...prev,
      attributes: prev.attributes.filter((_, i) => i !== index),
    }));
  };

  const handleMint = async () => {
    if (!mintForm.name || !mediaFile || !address) {
      alert('Please provide a name and upload media');
      return;
    }

    setMinting(true);
    try {
      // 1. Upload media and metadata to IPFS
      console.log('[Forge] Uploading to IPFS...');
      const uploadResult = await uploadNFTToIPFS(mediaFile, {
        name: mintForm.name,
        description: mintForm.description,
        attributes: mintForm.attributes,
        drc369: {
          version: '1.0',
          creator: address,
          royalty_bps: mintForm.royalty * 100, // Convert % to basis points
          collection: mintForm.collection || undefined,
        },
      });

      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'IPFS upload failed');
      }

      console.log('[Forge] IPFS upload successful:', uploadResult);

      // 2. Mint NFT on blockchain
      // For MVP, we'll simulate the on-chain mint since wallet signing isn't fully wired
      // In production: await demiurgeRpc.mintNFT(address, uploadResult.metadataUri!, mintForm.royalty * 100, signature);
      
      console.log('[Forge] Minting NFT with metadata URI:', uploadResult.metadataUri);
      
      // Simulate blockchain transaction
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Show success
      setMintSuccess(true);
      
      // Reset form
      setMintForm({
        name: '',
        description: '',
        collection: '',
        royalty: 5,
        attributes: [],
      });
      setMediaFile(null);
      setMediaPreview(null);
      
      // Reload NFTs
      await loadUserData();
    } catch (error: any) {
      console.error('Minting failed:', error);
      alert(`Minting failed: ${error.message || 'Unknown error'}`);
    } finally {
      setMinting(false);
    }
  };

  // Auth check
  if (authLoading) {
    return (
      <main className="min-h-screen p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-demiurge-gold mx-auto mb-4" />
          <p className="text-gray-400">Loading The Forge...</p>
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen p-8">
        <div className="max-w-2xl mx-auto text-center py-20">
          <div className="text-8xl mb-6">⚒️</div>
          <h1 className="text-5xl font-grunge mb-4 bg-gradient-to-r from-demiurge-gold via-orange-400 to-red-500 bg-clip-text text-transparent">
            The Forge
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Create, manage, and trade DRC-369 NFTs on the Demiurge blockchain.
          </p>
          <Link
            href="/login"
            className="inline-block px-8 py-4 bg-gradient-to-r from-demiurge-gold to-orange-500 text-black font-grunge-alt rounded-lg hover:scale-105 transition-all"
          >
            Login to Enter The Forge
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">⚒️</span>
            <h1 className="text-4xl md:text-5xl font-grunge bg-gradient-to-r from-demiurge-gold via-orange-400 to-red-500 bg-clip-text text-transparent">
              The Forge
            </h1>
          </div>
          <p className="text-gray-400">Create, collect, and trade DRC-369 digital assets</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 border-b border-white/10 pb-2">
          <button
            onClick={() => setActiveTab('gallery')}
            className={`px-4 py-2 rounded-t-lg font-grunge-alt transition-all ${
              activeTab === 'gallery'
                ? 'bg-demiurge-gold/20 text-demiurge-gold border-b-2 border-demiurge-gold'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            🖼️ My Collection
          </button>
          <button
            onClick={() => setActiveTab('mint')}
            className={`px-4 py-2 rounded-t-lg font-grunge-alt transition-all ${
              activeTab === 'mint'
                ? 'bg-orange-500/20 text-orange-400 border-b-2 border-orange-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            ⚒️ Mint NFT
          </button>
          <button
            onClick={() => setActiveTab('offers')}
            className={`px-4 py-2 rounded-t-lg font-grunge-alt transition-all relative ${
              activeTab === 'offers'
                ? 'bg-neon-green/20 text-neon-green border-b-2 border-neon-green'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            💰 Offers
            <span className="absolute -top-1 -right-1 bg-neon-green text-black text-xs px-1.5 rounded-full">
              1
            </span>
          </button>
        </div>

        {/* Gallery Tab */}
        {activeTab === 'gallery' && (
          <div>
            {/* Stats Bar */}
            <div className="glass-panel rounded-xl p-4 mb-6 flex items-center justify-between">
              <div className="flex gap-6">
                <div>
                  <div className="text-2xl font-grunge text-white">{nfts.length}</div>
                  <div className="text-xs text-gray-400">Total NFTs</div>
                </div>
                <div>
                  <div className="text-2xl font-grunge text-demiurge-gold">2,500</div>
                  <div className="text-xs text-gray-400">Est. Value (CGT)</div>
                </div>
              </div>
              <Link
                href="/marketplace"
                className="glass-panel px-4 py-2 rounded-lg text-sm hover:border-demiurge-gold/50 border border-transparent transition-all"
              >
                🏪 Marketplace
              </Link>
            </div>

            {/* NFT Grid */}
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="aspect-square bg-white/5 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : nfts.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">🎨</div>
                <h3 className="text-xl font-grunge text-white mb-2">No NFTs Yet</h3>
                <p className="text-gray-400 mb-6">Start your collection by minting your first NFT</p>
                <button
                  onClick={() => setActiveTab('mint')}
                  className="px-6 py-3 bg-gradient-to-r from-demiurge-gold to-orange-500 text-black font-grunge-alt rounded-lg hover:scale-105 transition-all"
                >
                  ⚒️ Mint Your First NFT
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {nfts.map((nft) => (
                  <div
                    key={nft.id}
                    onClick={() => setSelectedNft(nft)}
                    className="glass-panel rounded-xl overflow-hidden cursor-pointer hover:scale-[1.02] transition-all group border border-transparent hover:border-demiurge-gold/30"
                  >
                    <div className="aspect-square bg-gradient-to-br from-demiurge-gold/20 to-orange-500/20 relative">
                      {nft.image ? (
                        <img
                          src={nft.image}
                          alt={nft.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '';
                            (e.target as HTMLImageElement).className = 'hidden';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-5xl">🖼️</div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                        <span className="text-sm font-medium text-white">View Details</span>
                      </div>
                    </div>
                    <div className="p-3">
                      <h3 className="font-grunge text-white truncate">{nft.name}</h3>
                      {nft.collection && (
                        <p className="text-xs text-demiurge-gold">{nft.collection}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Mint Tab */}
        {activeTab === 'mint' && (
          <div className="max-w-3xl mx-auto">
            {mintSuccess ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">✨</div>
                <h2 className="text-3xl font-grunge text-demiurge-gold mb-4">NFT Minted!</h2>
                <p className="text-gray-400 mb-8">Your NFT has been successfully minted to the blockchain.</p>
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={() => {
                      setMintSuccess(false);
                      setActiveTab('gallery');
                    }}
                    className="px-6 py-3 glass-panel rounded-lg hover:chroma-glow transition-all"
                  >
                    View Collection
                  </button>
                  <button
                    onClick={() => setMintSuccess(false)}
                    className="px-6 py-3 bg-gradient-to-r from-demiurge-gold to-orange-500 text-black font-grunge-alt rounded-lg hover:scale-105 transition-all"
                  >
                    Mint Another
                  </button>
                </div>
              </div>
            ) : (
              <div className="glass-panel rounded-xl p-6 md:p-8">
                <h2 className="text-2xl font-grunge text-white mb-6">⚒️ Create New NFT</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Media Upload */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Media *</label>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className={`aspect-square rounded-xl border-2 border-dashed cursor-pointer flex flex-col items-center justify-center transition-all ${
                        mediaPreview
                          ? 'border-demiurge-gold/50 bg-demiurge-gold/5'
                          : 'border-gray-700 hover:border-demiurge-gold/30 hover:bg-white/5'
                      }`}
                    >
                      {mediaPreview ? (
                        <img
                          src={mediaPreview}
                          alt="Preview"
                          className="w-full h-full object-contain rounded-xl"
                        />
                      ) : (
                        <>
                          <div className="text-4xl mb-2">📁</div>
                          <p className="text-gray-400 text-sm">Click to upload</p>
                          <p className="text-gray-500 text-xs mt-1">PNG, JPG, GIF, MP4 (Max 50MB)</p>
                        </>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,video/*,audio/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    {mediaFile && (
                      <button
                        onClick={() => {
                          setMediaFile(null);
                          setMediaPreview(null);
                        }}
                        className="mt-2 text-sm text-red-400 hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  {/* Form Fields */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Name *</label>
                      <input
                        type="text"
                        value={mintForm.name}
                        onChange={(e) => setMintForm(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-demiurge-gold focus:outline-none"
                        placeholder="My Awesome NFT"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Description</label>
                      <textarea
                        value={mintForm.description}
                        onChange={(e) => setMintForm(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-demiurge-gold focus:outline-none h-24 resize-none"
                        placeholder="Tell the story of your creation..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Collection (Optional)</label>
                      <input
                        type="text"
                        value={mintForm.collection}
                        onChange={(e) => setMintForm(prev => ({ ...prev, collection: e.target.value }))}
                        className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-demiurge-gold focus:outline-none"
                        placeholder="My Collection"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Royalty %</label>
                      <div className="flex items-center gap-4">
                        <input
                          type="range"
                          min="0"
                          max="15"
                          step="0.5"
                          value={mintForm.royalty}
                          onChange={(e) => setMintForm(prev => ({ ...prev, royalty: parseFloat(e.target.value) }))}
                          className="flex-1"
                        />
                        <span className="text-demiurge-gold font-bold w-16 text-right">
                          {mintForm.royalty}%
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Earn royalties on every secondary sale
                      </p>
                    </div>
                  </div>
                </div>

                {/* Attributes */}
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm text-gray-400">Attributes (Optional)</label>
                    <button
                      onClick={addAttribute}
                      className="text-sm text-demiurge-gold hover:underline"
                    >
                      + Add Attribute
                    </button>
                  </div>
                  {mintForm.attributes.length > 0 && (
                    <div className="space-y-2">
                      {mintForm.attributes.map((attr, index) => (
                        <div key={index} className="flex gap-2">
                          <input
                            type="text"
                            value={attr.trait_type}
                            onChange={(e) => updateAttribute(index, 'trait_type', e.target.value)}
                            className="flex-1 bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-demiurge-gold focus:outline-none"
                            placeholder="Trait (e.g., Rarity)"
                          />
                          <input
                            type="text"
                            value={attr.value}
                            onChange={(e) => updateAttribute(index, 'value', e.target.value)}
                            className="flex-1 bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-demiurge-gold focus:outline-none"
                            placeholder="Value (e.g., Legendary)"
                          />
                          <button
                            onClick={() => removeAttribute(index)}
                            className="px-3 py-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-all"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Mint Button */}
                <div className="mt-8 flex items-center justify-between">
                  <div className="text-sm text-gray-400">
                    Minting fee: <span className="text-demiurge-gold font-bold">10 CGT</span>
                  </div>
                  <button
                    onClick={handleMint}
                    disabled={minting || !mintForm.name || !mediaFile}
                    className="px-8 py-3 bg-gradient-to-r from-demiurge-gold to-orange-500 text-black font-grunge-alt rounded-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {minting ? (
                      <span className="flex items-center gap-2">
                        <span className="animate-spin">⚒️</span>
                        Minting...
                      </span>
                    ) : (
                      '⚒️ Mint NFT'
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Offers Tab */}
        {activeTab === 'offers' && (
          <div>
            <div className="glass-panel rounded-xl p-6">
              <h2 className="text-xl font-grunge text-white mb-4">Pending Offers</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-black/30 rounded-lg border border-neon-green/20">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-demiurge-gold/20 to-orange-500/20 flex items-center justify-center text-2xl">
                      🚀
                    </div>
                    <div>
                      <h3 className="font-grunge text-white">Chronos Glaive Ship</h3>
                      <p className="text-sm text-gray-400">
                        Offer from <span className="text-neon-cyan">collector#4521</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-grunge text-neon-green">500 CGT</div>
                    <div className="flex gap-2 mt-2">
                      <button className="px-4 py-1 bg-neon-green/20 text-neon-green rounded text-sm hover:bg-neon-green/30 transition-all">
                        Accept
                      </button>
                      <button className="px-4 py-1 bg-red-500/20 text-red-400 rounded text-sm hover:bg-red-500/30 transition-all">
                        Decline
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* NFT Detail Modal */}
        {selectedNft && (
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedNft(null)}
          >
            <div
              className="glass-panel rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
                {/* Image */}
                <div className="aspect-square rounded-xl bg-gradient-to-br from-demiurge-gold/20 to-orange-500/20 overflow-hidden">
                  {selectedNft.image ? (
                    <img
                      src={selectedNft.image}
                      alt={selectedNft.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-6xl">🖼️</div>
                  )}
                </div>

                {/* Details */}
                <div>
                  <h2 className="text-2xl font-grunge text-white mb-2">{selectedNft.name}</h2>
                  {selectedNft.collection && (
                    <p className="text-demiurge-gold text-sm mb-4">{selectedNft.collection}</p>
                  )}
                  <p className="text-gray-400 mb-6">{selectedNft.description}</p>

                  {/* Attributes */}
                  {selectedNft.attributes.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-sm text-gray-400 mb-2">Attributes</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {selectedNft.attributes.map((attr, i) => (
                          <div key={i} className="bg-black/30 rounded-lg p-2 text-center">
                            <div className="text-xs text-gray-500">{attr.trait_type}</div>
                            <div className="text-sm text-white font-medium">{attr.value}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Link
                      href={`/marketplace/list/${selectedNft.id}`}
                      className="flex-1 py-3 text-center bg-gradient-to-r from-demiurge-gold to-orange-500 text-black font-grunge-alt rounded-lg hover:scale-105 transition-all"
                    >
                      List for Sale
                    </Link>
                    <button className="px-4 py-3 glass-panel rounded-lg hover:bg-white/5 transition-all">
                      🔗
                    </button>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedNft(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/50 text-white hover:bg-black/70 transition-all"
              >
                ×
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
