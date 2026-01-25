'use client';

import { useState, useEffect } from 'react';

interface Update {
  id: string;
  type: 'announcement' | 'maintenance' | 'feature' | 'event';
  title: string;
  content: string;
  timestamp: string;
  priority: 'low' | 'medium' | 'high';
}

// In production, these would come from an on-chain announcements pallet
const MOCK_UPDATES: Update[] = [
  {
    id: '1',
    type: 'announcement',
    title: 'Dashboard Launched!',
    content: 'The new user dashboard is now live. Earn Sparks by completing daily tasks.',
    timestamp: new Date().toISOString(),
    priority: 'high',
  },
  {
    id: '2',
    type: 'feature',
    title: 'ScatterTXT Engine Available',
    content: 'Build 3D games with ASCII rendering. Check out the new ScatterTXT page.',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    priority: 'medium',
  },
  {
    id: '3',
    type: 'event',
    title: 'Weekend CGT Boost',
    content: 'Earn 2x CGT from all games this weekend. Play more, earn more!',
    timestamp: new Date(Date.now() - 172800000).toISOString(),
    priority: 'medium',
  },
];

export function UpdatesPanel() {
  const [updates, setUpdates] = useState<Update[]>(MOCK_UPDATES);

  const getTypeIcon = (type: Update['type']) => {
    switch (type) {
      case 'announcement': return '📢';
      case 'maintenance': return '🔧';
      case 'feature': return '✨';
      case 'event': return '🎉';
      default: return '📌';
    }
  };

  const getTypeColor = (type: Update['type']) => {
    switch (type) {
      case 'announcement': return 'text-neon-cyan';
      case 'maintenance': return 'text-yellow-400';
      case 'feature': return 'text-neon-magenta';
      case 'event': return 'text-neon-green';
      default: return 'text-gray-400';
    }
  };

  const getPriorityStyle = (priority: Update['priority']) => {
    switch (priority) {
      case 'high': return 'border-l-neon-cyan';
      case 'medium': return 'border-l-neon-magenta/50';
      case 'low': return 'border-l-dark-600';
      default: return 'border-l-dark-600';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 3600000) {
      const mins = Math.floor(diff / 60000);
      return `${mins}m ago`;
    } else if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(diff / 86400000);
      return `${days}d ago`;
    }
  };

  return (
    <div className="glass-panel rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white">Updates</h3>
        <span className="text-xs text-gray-400">On-Chain Announcements</span>
      </div>

      <div className="space-y-3">
        {updates.map((update) => (
          <div 
            key={update.id}
            className={`glass-panel p-3 rounded-lg border-l-4 ${getPriorityStyle(update.priority)}`}
          >
            <div className="flex items-start gap-3">
              <span className="text-xl">{getTypeIcon(update.type)}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`font-semibold ${getTypeColor(update.type)}`}>
                    {update.title}
                  </span>
                </div>
                <p className="text-sm text-gray-400 line-clamp-2">
                  {update.content}
                </p>
                <span className="text-xs text-gray-500 mt-1 block">
                  {formatTime(update.timestamp)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button className="w-full mt-4 glass-panel py-2 rounded text-sm text-gray-400 hover:text-white transition-colors">
        View All Updates
      </button>
    </div>
  );
}
