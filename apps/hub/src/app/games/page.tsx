'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { GameMetadata, GameCategory } from '@/lib/game-registry';

// Category display configuration
const CATEGORY_CONFIG: Record<GameCategory, { label: string; icon: string; color: string }> = {
  miner: { label: 'Miner Games', icon: '⛏️', color: 'text-yellow-400' },
  drc369: { label: 'NFT Games', icon: '🎮', color: 'text-purple-400' },
  casual: { label: 'Casual', icon: '🎲', color: 'text-green-400' },
  multiplayer: { label: 'Multiplayer', icon: '👥', color: 'text-blue-400' },
  adventure: { label: 'Adventure', icon: '🗡️', color: 'text-red-400' },
};

export default function GamesPage() {
  const [games, setGames] = useState<GameMetadata[]>([]);
  const [filteredGames, setFilteredGames] = useState<GameMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<GameCategory | null>(null);

  useEffect(() => {
    fetchGames();
  }, []);

  useEffect(() => {
    filterGames();
  }, [games, searchQuery, selectedTag, selectedCategory]);

  const fetchGames = async () => {
    try {
      const response = await fetch('/api/games');
      if (!response.ok) {
        throw new Error('Failed to fetch games');
      }
      const data = await response.json();
      setGames(data.games || []);
      setFilteredGames(data.games || []);
    } catch (err: any) {
      console.error('Failed to fetch games:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterGames = () => {
    let filtered = [...games];

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter((game) => game.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (game) =>
          game.title.toLowerCase().includes(query) ||
          game.description.toLowerCase().includes(query) ||
          game.tags?.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    // Filter by tag
    if (selectedTag) {
      filtered = filtered.filter((game) =>
        game.tags?.includes(selectedTag)
      );
    }

    setFilteredGames(filtered);
  };

  // Get all unique tags
  const allTags = Array.from(
    new Set(games.flatMap((game) => game.tags || []))
  ).sort();

  // Get category counts
  const categoryCounts = games.reduce((acc, game) => {
    const cat = game.category || 'casual';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Get unique categories that have games
  const activeCategories = Object.keys(CATEGORY_CONFIG).filter(
    (cat) => categoryCounts[cat] > 0
  ) as GameCategory[];

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header with Submit Button */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 gap-6">
          <div>
            <h1 className="text-5xl font-bold mb-4 gradient-text">
              Game Directory
            </h1>
            <p className="text-xl text-gray-300">
              Discover and play games in the Demiurge ecosystem
            </p>
          </div>
          <Link 
            href="/games/submit"
            className="btn-primary inline-flex items-center gap-2 whitespace-nowrap"
          >
            <span className="text-lg">+</span>
            Submit Your Game
          </Link>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-3 mb-6">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-6 py-3 rounded-xl text-lg font-bold transition-all flex items-center gap-2 ${
              selectedCategory === null
                ? 'bg-gradient-to-r from-demiurge-cyan to-demiurge-violet text-black shadow-lg shadow-demiurge-cyan/30'
                : 'glass-panel hover:chroma-glow text-white'
            }`}
          >
            <span>🎯</span>
            <span>All Games</span>
            <span className="text-xs opacity-70">({games.length})</span>
          </button>
          {activeCategories.map((category) => {
            const config = CATEGORY_CONFIG[category];
            return (
              <button
                key={category}
                onClick={() => setSelectedCategory(selectedCategory === category ? null : category)}
                className={`px-6 py-3 rounded-xl text-lg font-bold transition-all flex items-center gap-2 ${
                  selectedCategory === category
                    ? 'bg-gradient-to-r from-demiurge-cyan to-demiurge-violet text-black shadow-lg shadow-demiurge-cyan/30'
                    : 'glass-panel hover:chroma-glow text-white'
                }`}
              >
                <span>{config.icon}</span>
                <span>{config.label}</span>
                <span className="text-xs opacity-70">({categoryCounts[category] || 0})</span>
              </button>
            );
          })}
        </div>

        {/* Search and Filter Bar */}
        <div className="glass-panel p-6 rounded-lg mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search games..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:border-demiurge-cyan focus:outline-none"
              />
            </div>
            {allTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedTag(null)}
                  className={`px-4 py-2 rounded-lg text-sm transition-all ${
                    selectedTag === null
                      ? 'bg-demiurge-cyan text-black'
                      : 'glass-panel hover:chroma-glow'
                  }`}
                >
                  All Tags
                </button>
                {allTags.slice(0, 8).map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                    className={`px-4 py-2 rounded-lg text-sm transition-all ${
                      selectedTag === tag
                        ? 'bg-demiurge-cyan text-black'
                        : 'glass-panel hover:chroma-glow'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}
          </div>
          {filteredGames.length !== games.length && (
            <div className="mt-4 text-sm text-gray-400">
              Showing {filteredGames.length} of {games.length} games
              {selectedCategory && ` in ${CATEGORY_CONFIG[selectedCategory].label}`}
            </div>
          )}
        </div>

        {/* Games Grid */}
        {loading ? (
          <div className="text-center py-20">
            <div className="text-demiurge-cyan text-xl">Loading games...</div>
          </div>
        ) : filteredGames.length === 0 ? (
          <div className="text-center py-20">
            {searchQuery || selectedTag ? (
              <>
                <div className="text-gray-400 text-xl mb-4">No games match your filters</div>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedTag(null);
                  }}
                  className="glass-panel px-6 py-2 rounded hover:chroma-glow transition-all"
                >
                  Clear Filters
                </button>
              </>
            ) : (
              <div className="glass-panel p-12 rounded-2xl max-w-2xl mx-auto">
                <div className="text-6xl mb-6">🎮</div>
                <h2 className="text-3xl font-bold gradient-text mb-4">Games Coming Soon</h2>
                <p className="text-gray-400 text-lg mb-6">
                  We're preparing exciting games with DRC-369 NFT integration.
                  <br />
                  Play to earn account-bound NFTs and CGT rewards!
                </p>
                <div className="flex flex-wrap justify-center gap-4 text-sm">
                  <div className="glass-panel px-4 py-2 rounded-lg border border-purple-500/30">
                    <span className="text-purple-400">🎁 NFT Rewards</span>
                  </div>
                  <div className="glass-panel px-4 py-2 rounded-lg border border-yellow-500/30">
                    <span className="text-yellow-400">💰 CGT Earning</span>
                  </div>
                  <div className="glass-panel px-4 py-2 rounded-lg border border-cyan-500/30">
                    <span className="text-cyan-400">⚡ On-Chain Progress</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredGames.map((game, index) => (
              <Link
                key={game.id}
                href={`/play/${game.id}`}
                className="futuristic-card p-6 cursor-pointer group cascade-item scan-line-overlay"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="aspect-video bg-gradient-to-br from-demiurge-cyan/20 to-demiurge-violet/20 rounded-lg mb-4 flex items-center justify-center overflow-hidden relative">
                  {game.thumbnail && game.thumbnail !== `/games/${game.id}/thumb.jpg` ? (
                    <img
                      src={game.thumbnail}
                      alt={game.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="text-5xl opacity-50">🎮</div>
                  )}
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
                    <span className="text-white font-bold uppercase tracking-wider text-sm">Play Now</span>
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-2 text-white group-hover:text-demiurge-cyan transition-colors">
                  {game.title}
                </h3>
                <p className="text-gray-400 mb-4 text-sm line-clamp-2">{game.description}</p>
                <div className="flex justify-between items-center mb-4 text-xs">
                  <span className="stat-value text-base">{(game.cgtPool || 0).toLocaleString()}</span>
                  {game.category && CATEGORY_CONFIG[game.category] && (
                    <span className={`holo-badge ${CATEGORY_CONFIG[game.category].color} flex items-center gap-1`}>
                      <span>{CATEGORY_CONFIG[game.category].icon}</span>
                      <span>{CATEGORY_CONFIG[game.category].label}</span>
                    </span>
                  )}
                </div>
                {/* Rewards */}
                {game.rewards && game.rewards.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {game.rewards.map((reward, idx) => (
                      <span
                        key={idx}
                        className={`text-xs px-2 py-0.5 rounded-full border ${
                          reward.type === 'cgt' ? 'border-yellow-500/50 bg-yellow-500/10 text-yellow-400' :
                          reward.type === 'nft' ? 'border-purple-500/50 bg-purple-500/10 text-purple-400' :
                          reward.type === 'sparks' ? 'border-orange-500/50 bg-orange-500/10 text-orange-400' :
                          'border-blue-500/50 bg-blue-500/10 text-blue-400'
                        }`}
                        title={reward.description}
                      >
                        {reward.type.toUpperCase()}
                      </span>
                    ))}
                  </div>
                )}
                {game.tags && game.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {game.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-2 py-1 bg-demiurge-cyan/10 border border-demiurge-cyan/30 text-demiurge-cyan rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                    {game.tags.length > 3 && (
                      <span className="text-xs px-2 py-1 text-gray-500">
                        +{game.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}
                {game.author && (
                  <div className="text-xs text-gray-500 mb-3 flex items-center gap-1">
                    <span className="w-4 h-4 rounded-full bg-gradient-to-r from-demiurge-cyan to-demiurge-violet" />
                    {game.author}
                  </div>
                )}
                <div className="w-full btn-secondary py-2 rounded text-center transition-all font-bold uppercase text-sm">
                  Play →
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
