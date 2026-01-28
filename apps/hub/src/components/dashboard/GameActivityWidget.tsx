'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

interface RecentGame {
  id: string;
  title: string;
  thumbnail: string;
  lastPlayed: Date;
  totalSparksEarned: number;
  highScore?: number;
}

interface GameStats {
  totalGamesPlayed: number;
  totalSparksEarned: number;
  totalPlayTime: number; // minutes
  favoriteGame?: string;
}

export function GameActivityWidget() {
  const { user, isAuthenticated } = useAuth();
  const [recentGames, setRecentGames] = useState<RecentGame[]>([]);
  const [stats, setStats] = useState<GameStats>({
    totalGamesPlayed: 0,
    totalSparksEarned: 0,
    totalPlayTime: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      loadGameActivity();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const loadGameActivity = async () => {
    // TODO: Fetch from actual game stats API
    // For now, use localStorage or mock data
    setLoading(true);
    try {
      // Mock data - replace with actual API call
      const mockRecent: RecentGame[] = [
        {
          id: 'galaga-creator',
          title: 'Pixel Starship Genesis',
          thumbnail: '/games/galaga-creator/assets/player_ship.webp',
          lastPlayed: new Date(Date.now() - 3600000), // 1 hour ago
          totalSparksEarned: 2500,
          highScore: 15420,
        },
        {
          id: 'killBot-clicker',
          title: 'Cyber Forge Miner',
          thumbnail: '/games/killBot-clicker/assets/mining_core.webp',
          lastPlayed: new Date(Date.now() - 86400000), // 1 day ago
          totalSparksEarned: 1200,
        },
      ];

      const mockStats: GameStats = {
        totalGamesPlayed: 47,
        totalSparksEarned: 12500,
        totalPlayTime: 320,
        favoriteGame: 'Pixel Starship Genesis',
      };

      setRecentGames(mockRecent);
      setStats(mockStats);
    } catch (error) {
      console.error('Failed to load game activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPlayTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  if (!isAuthenticated) {
    return (
      <div className="glass-panel rounded-xl p-6 border border-neon-green/20">
        <h3 className="text-lg font-grunge text-neon-green mb-4">🎮 Game Activity</h3>
        <p className="text-gray-400 text-sm">Login to track your gaming stats</p>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-xl p-6 border border-neon-green/20 relative overflow-hidden">
      {/* Glow effect */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-neon-green/10 rounded-full blur-3xl" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-grunge text-neon-green">🎮 Game Activity</h3>
          <Link href="/dashboard" className="text-xs text-neon-green hover:underline">
            All Games →
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-16 bg-white/5 rounded-lg" />
            <div className="h-16 bg-white/5 rounded-lg" />
          </div>
        ) : (
          <>
            {/* Stats Summary */}
            <div className="grid grid-cols-3 gap-2 mb-4 text-center">
              <div className="bg-black/30 rounded-lg p-2">
                <div className="text-xl font-grunge text-white">{stats.totalGamesPlayed}</div>
                <div className="text-xs text-gray-400">Sessions</div>
              </div>
              <div className="bg-black/30 rounded-lg p-2">
                <div className="text-xl font-grunge text-neon-green">
                  {stats.totalSparksEarned.toLocaleString()}
                </div>
                <div className="text-xs text-gray-400">Sparks</div>
              </div>
              <div className="bg-black/30 rounded-lg p-2">
                <div className="text-xl font-grunge text-white">
                  {formatPlayTime(stats.totalPlayTime)}
                </div>
                <div className="text-xs text-gray-400">Play Time</div>
              </div>
            </div>

            {/* Recently Played */}
            <div className="text-xs text-gray-400 mb-2">Recently Played</div>
            <div className="space-y-2">
              {recentGames.map((game) => (
                <Link
                  key={game.id}
                  href={`/play/${game.id}`}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-all group"
                >
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-gradient-to-br from-neon-green/20 to-neon-cyan/20 flex items-center justify-center">
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
                      <span className="text-2xl">🎮</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white group-hover:text-neon-green transition-colors truncate">
                      {game.title}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span>{formatTimeAgo(game.lastPlayed)}</span>
                      {game.highScore && (
                        <>
                          <span>•</span>
                          <span className="text-neon-green">
                            High: {game.highScore.toLocaleString()}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-neon-green">
                      +{game.totalSparksEarned}
                    </div>
                    <div className="text-xs text-gray-500">Sparks</div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Quick Play */}
            <Link
              href="/dashboard"
              className="mt-4 block w-full text-center py-3 bg-gradient-to-r from-neon-green/20 to-neon-cyan/20 rounded-lg border border-neon-green/30 hover:border-neon-green/50 transition-all font-grunge text-neon-green"
            >
              🕹️ PLAY NOW
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
