'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { GameWrapper } from '@/components/GameWrapper';
import { gameRegistry, GameMetadata } from '@/lib/game-registry';

export default function PlayGamePage() {
  const params = useParams();
  const gameId = params.gameId as string;
  const [gameMetadata, setGameMetadata] = useState<GameMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    fetchGameMetadata();
  }, [gameId]);

  const fetchGameMetadata = async () => {
    try {
      // Try fetching from API first
      const response = await fetch(`/api/games`);
      if (response.ok) {
        const data = await response.json();
        const game = data.games?.find((g: GameMetadata) => g.id === gameId);
        if (game) {
          setGameMetadata(game);
          setLoading(false);
          return;
        }
      }
      
      // Fallback to registry
      const game = gameRegistry.getById(gameId);
      if (game) {
        setGameMetadata(game);
      } else {
        setError(`Game "${gameId}" not found`);
      }
    } catch (err: any) {
      console.error('Failed to fetch game metadata:', err);
      // Fallback to registry
      const game = gameRegistry.getById(gameId);
      if (game) {
        setGameMetadata(game);
      } else {
        setError(err.message || 'Failed to load game');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black">
        <div className="glass-panel p-8 rounded-lg">
          <div className="text-demiurge-cyan text-xl">Loading game...</div>
        </div>
      </div>
    );
  }

  if (error || !gameMetadata) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black">
        <div className="glass-panel p-8 rounded-lg border border-red-500">
          <div className="text-red-400 text-xl mb-4">{error || 'Game not found'}</div>
          <a
            href="/portal"
            className="glass-panel px-4 py-2 rounded hover:chroma-glow transition-all inline-block"
          >
            Return to Portal
          </a>
        </div>
      </div>
    );
  }
  
  const gameUrl = `/games/${gameId}/${gameMetadata.entryPoint || 'index.html'}`;
  
  return <GameWrapper gameId={gameId} gameUrl={gameUrl} />;
}
