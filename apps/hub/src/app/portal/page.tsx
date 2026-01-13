'use client';

import { useState, useEffect } from 'react';
import { qorAuth } from '@demiurge/qor-sdk';

interface Game {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  cgtPool: number;
  activeUsers: number;
}

export default function PortalPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch games from API
    // For now, use mock data
    setGames([
      {
        id: 'game-one',
        title: 'Game One',
        description: 'An epic adventure awaits...',
        thumbnail: '/placeholder-game.jpg',
        cgtPool: 5000,
        activeUsers: 42,
      },
      {
        id: 'game-two',
        title: 'Game Two',
        description: 'Battle for supremacy...',
        thumbnail: '/placeholder-game.jpg',
        cgtPool: 3200,
        activeUsers: 28,
      },
    ]);
    setLoading(false);
  }, []);

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
            <div className="text-demiurge-cyan">Loading games...</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {games.map((game) => (
              <div
                key={game.id}
                className="glass-panel p-6 rounded-lg hover:scale-105 transition-transform cursor-pointer group"
              >
                <div className="aspect-video bg-gradient-to-br from-demiurge-cyan/20 to-demiurge-violet/20 rounded-lg mb-4 flex items-center justify-center">
                  <span className="text-gray-400">Game Thumbnail</span>
                </div>
                <h3 className="text-2xl font-bold mb-2 text-white">{game.title}</h3>
                <p className="text-gray-400 mb-4 text-sm">{game.description}</p>
                <div className="flex justify-between items-center mb-4 text-xs">
                  <span className="text-demiurge-cyan">Pool: {game.cgtPool} CGT</span>
                  <span className="text-demiurge-violet">{game.activeUsers} Active</span>
                </div>
                <a
                  href={`/play/${game.id}`}
                  className="block w-full glass-panel py-2 rounded text-center hover:chroma-glow transition-all font-bold uppercase"
                >
                  Enter Reality
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
