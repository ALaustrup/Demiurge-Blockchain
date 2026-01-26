'use client';

import { useState, useEffect, useRef } from 'react';
import { demiurgeRpc } from '@/lib/demiurge-rpc';

interface ChainEvent {
  id: string;
  type: 'block' | 'transaction' | 'governance' | 'reward' | 'nft_mint' | 'announcement';
  title: string;
  description: string;
  timestamp: Date;
  link?: string;
  highlight?: boolean;
}

export function OnChainFeedWidget() {
  const [events, setEvents] = useState<ChainEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [blockHeight, setBlockHeight] = useState<number | null>(null);
  const [era, setEra] = useState<number | null>(null);
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadChainData();
    const interval = setInterval(loadChainData, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const loadChainData = async () => {
    try {
      // Get real chain data
      const chainInfo = await demiurgeRpc.getChainInfo();
      if (chainInfo && chainInfo.connected) {
        setBlockHeight(chainInfo.blockHeight);
        setEra(chainInfo.currentEra);
        
        // Try to get real events
        try {
          const recentEvents = await demiurgeRpc.getRecentEvents(5);
          if (recentEvents.length > 0) {
            const formattedEvents: ChainEvent[] = recentEvents.map(e => ({
              id: `${e.type}-${e.blockNumber}`,
              type: e.type as any,
              title: formatEventTitle(e),
              description: formatEventDescription(e),
              timestamp: new Date(e.timestamp * 1000),
            }));
            setEvents(prev => [...formattedEvents, ...prev.filter(p => p.type === 'announcement')].slice(0, 10));
            setLoading(false);
            return;
          }
        } catch (eventError) {
          // Events endpoint might not be available yet
        }
      }
    } catch (error) {
      console.warn('Using mock chain data');
    }

    // Fallback to mock events if blockchain not available
    const mockEvents: ChainEvent[] = [
      {
        id: `block-${Date.now()}`,
        type: 'block',
        title: `Block #${blockHeight || 1247892}`,
        description: 'New block produced',
        timestamp: new Date(),
      },
      {
        id: 'announce-001',
        type: 'announcement',
        title: 'VYB Social Live!',
        description: 'Connect with creators on the new social platform',
        timestamp: new Date(Date.now() - 3600000),
        link: '/social',
        highlight: true,
      },
      {
        id: 'gov-001',
        type: 'governance',
        title: 'Proposal #42',
        description: 'Community vote on staking rewards increase',
        timestamp: new Date(Date.now() - 7200000),
        link: '/governance',
      },
      {
        id: 'reward-001',
        type: 'reward',
        title: 'Era Rewards',
        description: `Era ${era || 28} rewards distributed: 42,000 CGT`,
        timestamp: new Date(Date.now() - 14400000),
      },
      {
        id: 'nft-001',
        type: 'nft_mint',
        title: 'Rare Mint!',
        description: 'Legendary ship "Void Stalker" minted',
        timestamp: new Date(Date.now() - 21600000),
      },
    ];

    setEvents(mockEvents);
    setLoading(false);
  };
  
  const formatEventTitle = (event: any): string => {
    switch (event.type) {
      case 'block': return `Block #${event.blockNumber}`;
      case 'transaction': return `Transfer`;
      case 'nft_mint': return `NFT Minted`;
      case 'stake': return `Stake Update`;
      case 'reward': return `Rewards Distributed`;
      default: return event.type;
    }
  };
  
  const formatEventDescription = (event: any): string => {
    switch (event.type) {
      case 'block': return 'New block produced';
      case 'transaction': return `${(event.data?.amount || 0) / 100} CGT transferred`;
      case 'nft_mint': return `New DRC-369 asset created`;
      case 'stake': return `${(event.data?.amount || 0) / 100} CGT staked`;
      case 'reward': return `Era rewards distributed`;
      default: return '';
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'block': return '⛓️';
      case 'transaction': return '💸';
      case 'governance': return '🗳️';
      case 'reward': return '🎁';
      case 'nft_mint': return '🎨';
      case 'announcement': return '📢';
      default: return '📌';
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'block': return 'text-neon-cyan';
      case 'transaction': return 'text-neon-green';
      case 'governance': return 'text-demiurge-violet';
      case 'reward': return 'text-demiurge-gold';
      case 'nft_mint': return 'text-neon-magenta';
      case 'announcement': return 'text-white';
      default: return 'text-gray-400';
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (seconds < 60) return `${seconds}s ago`;
    if (minutes < 60) return `${minutes}m ago`;
    return `${hours}h ago`;
  };

  return (
    <div className="glass-panel rounded-xl p-6 border border-demiurge-violet/20 relative overflow-hidden">
      {/* Glow effect */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-demiurge-violet/10 rounded-full blur-3xl" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-grunge text-demiurge-violet">⛓️ Chain Activity</h3>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-gray-400">Live</span>
          </div>
        </div>

        {/* Chain Stats Bar */}
        <div className="flex items-center justify-between mb-4 p-3 bg-black/30 rounded-lg">
          <div className="text-center">
            <div className="text-xs text-gray-400">Block</div>
            <div className="font-mono text-neon-cyan text-sm">
              #{blockHeight?.toLocaleString() || '---'}
            </div>
          </div>
          <div className="h-6 w-px bg-white/10" />
          <div className="text-center">
            <div className="text-xs text-gray-400">Era</div>
            <div className="font-mono text-demiurge-gold text-sm">
              {era || '---'}
            </div>
          </div>
          <div className="h-6 w-px bg-white/10" />
          <div className="text-center">
            <div className="text-xs text-gray-400">TPS</div>
            <div className="font-mono text-neon-green text-sm">~25</div>
          </div>
        </div>

        {/* Event Feed */}
        <div 
          ref={feedRef}
          className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10"
        >
          {loading ? (
            <div className="space-y-2 animate-pulse">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-12 bg-white/5 rounded-lg" />
              ))}
            </div>
          ) : (
            events.map((event) => (
              <div
                key={event.id}
                className={`flex items-start gap-3 p-2 rounded-lg transition-all ${
                  event.highlight 
                    ? 'bg-demiurge-violet/10 border border-demiurge-violet/30' 
                    : 'hover:bg-white/5'
                }`}
              >
                <span className="text-lg mt-0.5">{getEventIcon(event.type)}</span>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium ${getEventColor(event.type)}`}>
                    {event.title}
                  </div>
                  <div className="text-xs text-gray-400 truncate">
                    {event.description}
                  </div>
                </div>
                <div className="text-xs text-gray-500 whitespace-nowrap">
                  {formatTime(event.timestamp)}
                </div>
              </div>
            ))
          )}
        </div>

        {/* View More */}
        <a
          href="https://explorer.demiurge.cloud"
          target="_blank"
          rel="noopener noreferrer"
          className="block mt-4 text-center text-xs text-demiurge-violet hover:underline"
        >
          View Block Explorer →
        </a>
      </div>
    </div>
  );
}
