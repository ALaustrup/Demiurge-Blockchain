'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { 
  UserIdentityHeader,
  WalletWidget,
  VYBNotificationWidget,
  GameActivityWidget,
  NFTSnapshotWidget,
  OnChainFeedWidget,
} from '@/components/dashboard';
import { GameMetadata } from '@/lib/game-registry';

type DashboardTab = 'overview' | 'games';

export default function PortalPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [games, setGames] = useState<GameMetadata[]>([]);
  const [gamesLoading, setGamesLoading] = useState(true);

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    try {
      const response = await fetch('/api/games');
      if (response.ok) {
        const data = await response.json();
        setGames(data.games || []);
      }
    } catch (err) {
      console.error('Failed to fetch games:', err);
    } finally {
      setGamesLoading(false);
    }
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <main className="min-h-screen p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-neon-cyan mx-auto mb-4" />
          <p className="text-gray-400">Loading Dashboard...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* User Identity Header */}
        <UserIdentityHeader />

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-white/10 pb-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-t-lg font-grunge-alt transition-all ${
              activeTab === 'overview'
                ? 'bg-neon-cyan/20 text-neon-cyan border-b-2 border-neon-cyan'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            📊 Dashboard
          </button>
          <button
            onClick={() => setActiveTab('games')}
            className={`px-4 py-2 rounded-t-lg font-grunge-alt transition-all ${
              activeTab === 'games'
                ? 'bg-neon-green/20 text-neon-green border-b-2 border-neon-green'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            🎮 Games
          </button>
        </div>

        {activeTab === 'overview' ? (
          /* Dashboard Overview */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Primary Actions */}
            <div className="lg:col-span-2 space-y-6">
              {/* Top Row - Wallet & VYB */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <WalletWidget />
                <VYBNotificationWidget />
              </div>
              
              {/* Game Activity */}
              <GameActivityWidget />
              
              {/* Quick Games Grid */}
              <div className="glass-panel rounded-xl p-6 border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-grunge text-white">🕹️ Quick Play</h3>
                  <button 
                    onClick={() => setActiveTab('games')}
                    className="text-xs text-neon-cyan hover:underline"
                  >
                    All Games →
                  </button>
                </div>
                
                {gamesLoading ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 animate-pulse">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="aspect-video bg-white/5 rounded-lg" />
                    ))}
                  </div>
                ) : games.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {games.slice(0, 4).map((game) => (
                      <Link
                        key={game.id}
                        href={`/play/${game.id}`}
                        className="group relative aspect-video rounded-lg overflow-hidden bg-gradient-to-br from-neon-cyan/20 to-neon-magenta/20 hover:scale-105 transition-transform"
                      >
                        {game.thumbnail ? (
                          <img
                            src={game.thumbnail}
                            alt={game.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-3xl">🎮</div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex items-end p-2">
                          <span className="text-xs font-medium text-white truncate">{game.title}</span>
                        </div>
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-neon-cyan/10 flex items-center justify-center transition-opacity">
                          <span className="text-white font-grunge text-sm">PLAY</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-center py-4">No games available</p>
                )}
              </div>
            </div>

            {/* Right Column - Info & Activity */}
            <div className="space-y-6">
              <NFTSnapshotWidget />
              <OnChainFeedWidget />
            </div>
          </div>
        ) : (
          /* Games Tab */
          <div className="space-y-6">
            {/* Games Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-grunge bg-gradient-to-r from-neon-green via-neon-cyan to-neon-magenta bg-clip-text text-transparent">
                  Game Arcade
                </h2>
                <p className="text-gray-400 mt-1">Play games, earn CGT, collect NFTs</p>
              </div>
              <Link
                href="/games/submit"
                className="glass-panel border border-neon-green/30 text-neon-green px-4 py-2 rounded-lg hover:border-neon-green transition-all text-sm"
              >
                + Submit Game
              </Link>
            </div>

            {/* Games Grid */}
            {gamesLoading ? (
              <div className="text-center py-20">
                <div className="text-neon-cyan text-xl">Loading games...</div>
              </div>
            ) : games.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">🎮</div>
                <div className="text-gray-400 text-xl mb-4">No games available yet</div>
                <p className="text-gray-500 mb-6">Be the first to submit a game!</p>
                <Link
                  href="/games/submit"
                  className="inline-block bg-gradient-to-r from-neon-green to-neon-cyan text-black font-grunge-alt py-3 px-8 rounded-lg hover:scale-105 transition-all"
                >
                  Submit Your Game
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {games.map((game) => (
                  <Link
                    key={game.id}
                    href={`/play/${game.id}`}
                    className="glass-panel p-6 rounded-xl hover:scale-[1.02] transition-all cursor-pointer group border border-transparent hover:border-neon-cyan/30"
                  >
                    <div className="aspect-video bg-gradient-to-br from-neon-cyan/20 to-neon-magenta/20 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                      {game.thumbnail ? (
                        <img
                          src={game.thumbnail}
                          alt={game.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <span className="text-gray-400 text-4xl">🎮</span>
                      )}
                    </div>
                    
                    <h3 className="text-xl font-grunge mb-2 text-white group-hover:text-neon-cyan transition-colors">
                      {game.title}
                    </h3>
                    
                    <p className="text-gray-400 mb-4 text-sm line-clamp-2">{game.description}</p>
                    
                    <div className="flex justify-between items-center mb-4 text-xs">
                      <span className="text-neon-cyan">
                        💎 {(game.cgtPool || 0).toLocaleString()} CGT Pool
                      </span>
                      <span className="text-neon-green">
                        👥 {game.activeUsers || 0} playing
                      </span>
                    </div>
                    
                    {game.tags && game.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {game.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="text-xs px-2 py-1 bg-white/5 text-gray-400 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    <div className="w-full py-3 rounded-lg text-center bg-gradient-to-r from-neon-cyan/20 to-neon-magenta/20 group-hover:from-neon-cyan/30 group-hover:to-neon-magenta/30 transition-all font-grunge text-white">
                      🎮 PLAY NOW
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
