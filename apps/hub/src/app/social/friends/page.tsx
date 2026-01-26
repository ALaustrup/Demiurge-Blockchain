'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

type TabType = 'all' | 'online' | 'requests' | 'suggestions';

interface Friend {
  id: string;
  qorId: string;
  displayName: string;
  avatar?: string;
  role: string;
  isOnline: boolean;
  mutualFriends: number;
  isFriend: boolean;
  isPending?: boolean;
  lastSeen?: Date;
}

export default function FriendsPage() {
  const router = useRouter();
  const { loading, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data
  const mockFriends: Friend[] = [
    { id: '1', qorId: 'cryptoartist#1234', displayName: 'CryptoArtist', role: 'artist', isOnline: true, mutualFriends: 12, isFriend: true },
    { id: '2', qorId: 'blockdev#5678', displayName: 'BlockDev', role: 'developer', isOnline: true, mutualFriends: 8, isFriend: true },
    { id: '3', qorId: 'synthmaster#9012', displayName: 'SynthMaster', role: 'musician', isOnline: false, mutualFriends: 5, isFriend: true, lastSeen: new Date(Date.now() - 3600000) },
    { id: '4', qorId: 'pixelking#3456', displayName: 'PixelKing', role: 'gamer', isOnline: true, mutualFriends: 15, isFriend: true },
    { id: '5', qorId: 'nftqueen#7890', displayName: 'NFTQueen', role: 'collector', isOnline: false, mutualFriends: 3, isFriend: true, lastSeen: new Date(Date.now() - 86400000) },
    { id: '6', qorId: 'cosmicwolf#2345', displayName: 'CosmicWolf', role: 'creator', isOnline: true, mutualFriends: 7, isFriend: true },
    { id: '7', qorId: 'stargazer#6789', displayName: 'Stargazer', role: 'designer', isOnline: false, mutualFriends: 4, isFriend: true, lastSeen: new Date(Date.now() - 172800000) },
    { id: '8', qorId: 'moonrider#0123', displayName: 'MoonRider', role: 'gamer', isOnline: true, mutualFriends: 9, isFriend: true },
  ];

  const mockRequests: Friend[] = [
    { id: '9', qorId: 'newhero#4567', displayName: 'NewHero', role: 'gamer', isOnline: true, mutualFriends: 3, isFriend: false, isPending: true },
    { id: '10', qorId: 'artlover#8901', displayName: 'ArtLover', role: 'collector', isOnline: false, mutualFriends: 6, isFriend: false, isPending: true },
  ];

  const mockSuggestions: Friend[] = [
    { id: '11', qorId: 'techguru#2345', displayName: 'TechGuru', role: 'developer', isOnline: true, mutualFriends: 15, isFriend: false },
    { id: '12', qorId: 'soundwave#6789', displayName: 'SoundWave', role: 'musician', isOnline: false, mutualFriends: 8, isFriend: false },
    { id: '13', qorId: 'pixelart#0123', displayName: 'PixelArt', role: 'artist', isOnline: true, mutualFriends: 12, isFriend: false },
    { id: '14', qorId: 'gamerpro#4567', displayName: 'GamerPro', role: 'gamer', isOnline: true, mutualFriends: 20, isFriend: false },
  ];

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'artist': return '🎨';
      case 'musician': return '🎵';
      case 'developer': return '💻';
      case 'designer': return '✨';
      case 'gamer': return '🎮';
      case 'creator': return '🎬';
      case 'collector': return '💎';
      default: return '👤';
    }
  };

  const formatLastSeen = (date?: Date) => {
    if (!date) return '';
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const filteredFriends = mockFriends.filter(f => 
    f.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.qorId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const onlineFriends = filteredFriends.filter(f => f.isOnline);

  if (loading) {
    return (
      <main className="min-h-screen p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-neon-cyan"></div>
      </main>
    );
  }

  const tabs = [
    { id: 'all' as TabType, label: 'All Friends', count: mockFriends.length },
    { id: 'online' as TabType, label: 'Online', count: onlineFriends.length },
    { id: 'requests' as TabType, label: 'Requests', count: mockRequests.length },
    { id: 'suggestions' as TabType, label: 'Suggestions', count: mockSuggestions.length },
  ];

  const currentList = activeTab === 'all' ? filteredFriends 
    : activeTab === 'online' ? onlineFriends
    : activeTab === 'requests' ? mockRequests
    : mockSuggestions;

  return (
    <main className="min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-neon-cyan/10 to-neon-purple/10 border-b border-gray-800">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <Link href="/social" className="text-gray-500 hover:text-neon-cyan transition-colors text-sm mb-2 inline-block">
                ← Back to VYB
              </Link>
              <h1 className="text-3xl font-grunge bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent">
                👥 Friends
              </h1>
            </div>
            <button className="neon-button px-4 py-2 rounded-lg">
              🔍 Find Friends
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search friends by name or Qor ID..."
              className="w-full bg-blockchain-light/50 border border-gray-700 rounded-lg px-4 py-3 pl-10 text-white focus:border-neon-cyan/50 focus:outline-none"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg font-body transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-neon-cyan/20 border border-neon-cyan text-neon-cyan'
                    : 'text-gray-500 hover:text-gray-300 border border-transparent'
                }`}
              >
                {tab.label}
                <span className="ml-2 px-2 py-0.5 rounded-full bg-blockchain-dark text-xs">
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Friend List */}
        {currentList.length === 0 ? (
          <div className="glass-panel p-12 rounded-xl text-center">
            <p className="text-4xl mb-4">
              {activeTab === 'requests' ? '📭' : activeTab === 'suggestions' ? '🔍' : '👥'}
            </p>
            <p className="text-gray-400">
              {activeTab === 'requests' 
                ? 'No pending friend requests'
                : activeTab === 'suggestions'
                ? 'No suggestions right now'
                : searchQuery 
                ? 'No friends match your search'
                : 'No friends yet'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {currentList.map((friend) => (
              <div
                key={friend.id}
                className="glass-panel rounded-xl p-4 hover:border-neon-cyan/30 transition-colors"
              >
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <Link href={`/social/profile/${friend.qorId}`}>
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-neon-cyan/50 to-neon-purple/50 flex items-center justify-center text-2xl hover:scale-105 transition-transform cursor-pointer">
                        {friend.avatar ? (
                          <img src={friend.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          getRoleIcon(friend.role)
                        )}
                      </div>
                      {friend.isOnline && (
                        <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-blockchain-dark" />
                      )}
                    </div>
                  </Link>

                  {/* Info */}
                  <div className="flex-1">
                    <Link 
                      href={`/social/profile/${friend.qorId}`}
                      className="font-grunge-alt text-lg text-white hover:text-neon-cyan transition-colors"
                    >
                      {friend.displayName}
                    </Link>
                    <p className="text-gray-500 text-sm">@{friend.qorId}</p>
                    <div className="flex items-center gap-3 mt-1 text-sm">
                      <span className="text-gray-400">{getRoleIcon(friend.role)} {friend.role}</span>
                      <span className="text-gray-600">•</span>
                      <span className="text-gray-400">{friend.mutualFriends} mutual friends</span>
                      {!friend.isOnline && friend.lastSeen && (
                        <>
                          <span className="text-gray-600">•</span>
                          <span className="text-gray-500">Last seen {formatLastSeen(friend.lastSeen)}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {friend.isFriend ? (
                      <>
                        <Link 
                          href={`/social/messages/${friend.id}`}
                          className="glass-panel px-4 py-2 rounded-lg text-sm hover:border-neon-cyan/50 transition-colors"
                        >
                          💬 Message
                        </Link>
                        <button className="glass-panel px-3 py-2 rounded-lg text-gray-500 hover:text-red-400 transition-colors">
                          •••
                        </button>
                      </>
                    ) : friend.isPending ? (
                      <>
                        <button className="neon-button px-4 py-2 rounded-lg text-sm">
                          ✓ Accept
                        </button>
                        <button className="glass-panel px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-red-400 transition-colors">
                          ✕ Decline
                        </button>
                      </>
                    ) : (
                      <button className="neon-button px-4 py-2 rounded-lg text-sm">
                        + Add Friend
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* People You May Know Section */}
        {activeTab === 'all' && mockSuggestions.length > 0 && (
          <div className="mt-8">
            <h2 className="font-grunge-alt text-xl text-neon-purple mb-4">👋 People You May Know</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {mockSuggestions.slice(0, 4).map((suggestion) => (
                <div
                  key={suggestion.id}
                  className="glass-panel rounded-xl p-4 text-center hover:border-neon-purple/30 transition-colors"
                >
                  <Link href={`/social/profile/${suggestion.qorId}`}>
                    <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-neon-purple/50 to-neon-cyan/50 flex items-center justify-center text-3xl mb-3 hover:scale-105 transition-transform">
                      {getRoleIcon(suggestion.role)}
                    </div>
                  </Link>
                  <Link 
                    href={`/social/profile/${suggestion.qorId}`}
                    className="font-grunge-alt text-white hover:text-neon-purple transition-colors block"
                  >
                    {suggestion.displayName}
                  </Link>
                  <p className="text-gray-500 text-xs mt-1">{suggestion.mutualFriends} mutual friends</p>
                  <button className="mt-3 w-full glass-panel py-2 rounded-lg text-sm text-neon-cyan hover:bg-neon-cyan/10 transition-colors">
                    + Add Friend
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
