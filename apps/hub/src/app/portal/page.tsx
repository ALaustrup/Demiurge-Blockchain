'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { GameMetadata } from '@/lib/game-registry';

export default function PortalPage() {
  const [games, setGames] = useState<GameMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    try {
      console.log('[Portal] Fetching games from /api/games');
      const response = await fetch('/api/games');
      console.log('[Portal] Response status:', response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Portal] Response error:', errorText);
        throw new Error(`Failed to fetch games: ${response.status}`);
      }
      const data = await response.json();
      console.log('[Portal] Received data:', data);
      console.log('[Portal] Games count:', data.games?.length || 0);
      setGames(data.games || []);
      if (!data.games || data.games.length === 0) {
        console.warn('[Portal] No games returned from API');
      }
    } catch (err: any) {
      console.error('[Portal] Failed to fetch games:', err);
      setError(err.message || 'Failed to load games');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-demiurge-cyan via-demiurge-violet to-demiurge-gold bg-clip-text text-transparent">
          Casino Portal
        </h1>
        <p className="text-xl text-gray-300 mb-12">
          Choose your reality. Enter the games.
        </p>

        {loading ? (
          <div className="text-center py-20">
            <div className="text-demiurge-cyan text-xl">Loading games...</div>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <div className="text-red-400 text-xl mb-4">{error}</div>
            <button
              onClick={fetchGames}
              className="glass-panel px-6 py-2 rounded hover:chroma-glow transition-all"
            >
              Retry
            </button>
          </div>
        ) : games.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-gray-400 text-xl mb-4">No games available</div>
            <p className="text-gray-500">Games will appear here once registered.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {games.map((game) => (
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
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <span className="text-gray-400">No Thumbnail</span>
                  )}
                </div>
                <h3 className="text-2xl font-bold mb-2 text-white group-hover:text-demiurge-cyan transition-colors">
                  {game.title}
                </h3>
                <p className="text-gray-400 mb-4 text-sm line-clamp-2">{game.description}</p>
                <div className="flex justify-between items-center mb-4 text-xs">
                  <span className="text-demiurge-cyan">
                    Pool: {(game.cgtPool || 0).toLocaleString()} CGT
                  </span>
                  <span className="text-demiurge-violet">
                    {game.activeUsers || 0} Active
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
                  </div>
                )}
                <div className="w-full glass-panel py-2 rounded text-center group-hover:chroma-glow transition-all font-bold uppercase text-demiurge-cyan">
                  Enter Reality →
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
