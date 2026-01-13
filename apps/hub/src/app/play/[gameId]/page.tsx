'use client';

import { useParams } from 'next/navigation';
import { GameWrapper } from '@/components/GameWrapper';

export default function PlayGamePage() {
  const params = useParams();
  const gameId = params.gameId as string;
  
  // TODO: Fetch game metadata from API
  // For now, construct URL from gameId
  const gameUrl = `/games/${gameId}/index.html`;
  
  return <GameWrapper gameId={gameId} gameUrl={gameUrl} />;
}
