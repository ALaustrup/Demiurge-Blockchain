'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { GameMetadata } from '@/lib/game-registry';

export default function GamesPage() {
  const [games, setGames] = useState<GameMetadata[]>([]);
  const [filteredGames, setFilteredGames] = useState<GameMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  useEffect(() => {
    fetchGames();
  }, []);

  useEffect(() => {
    filterGames();
  }, [games, searchQuery, selectedTag]);

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

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-demiurge-cyan via-demiurge-violet to-demiurge-gold bg-clip-text text-transparent">
            Game Directory
          </h1>
          <p className="text-xl text-gray-300">
            Discover and play games in the Demiurge ecosystem
          </p>
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
                  All
                </button>
                {allTags.map((tag) => (
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
            <div className="text-gray-400 text-xl mb-4">
              {searchQuery || selectedTag ? 'No games match your filters' : 'No games available'}
            </div>
            {(searchQuery || selectedTag) && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedTag(null);
                }}
                className="glass-panel px-6 py-2 rounded hover:chroma-glow transition-all"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredGames.map((game) => (
              <Link
                key={game.id}
                href={`/play/${game.id}`}
                className="glass-panel p-6 rounded-lg hover:scale-105 transition-transform cursor-pointer group"
              >
                <div className="aspect-video bg-gradient-to-br from-demiurge-cyan/20 to-demiurge-violet/20 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                  {game.thumbnail && game.thumbnail !== `/games/${game.id}/thumb.jpg` ? (
                    <img
                      src={game.thumbnail}
                      alt={game.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <span className="text-gray-400">No Thumbnail</span>
                  )}
                </div>
                <h3 className="text-xl font-bold mb-2 text-white group-hover:text-demiurge-cyan transition-colors">
                  {game.title}
                </h3>
                <p className="text-gray-400 mb-4 text-sm line-clamp-2">{game.description}</p>
                <div className="flex justify-between items-center mb-4 text-xs">
                  <span className="text-demiurge-cyan">
                    {(game.cgtPool || 0).toLocaleString()} CGT
                  </span>
                  <span className="text-demiurge-violet">
                    {game.activeUsers || 0} Players
                  </span>
                </div>
                {game.tags && game.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {game.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-2 py-1 bg-demiurge-cyan/20 text-demiurge-cyan rounded"
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
                  <div className="text-xs text-gray-500 mb-2">by {game.author}</div>
                )}
                <div className="w-full glass-panel py-2 rounded text-center group-hover:chroma-glow transition-all font-bold uppercase text-demiurge-cyan">
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
