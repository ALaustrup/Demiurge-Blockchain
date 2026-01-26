'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

type TabType = 'upcoming' | 'attending' | 'past';

interface Event {
  id: string;
  title: string;
  description: string;
  icon: string;
  coverGradient: [string, string];
  type: 'tournament' | 'drop' | 'ama' | 'meetup' | 'stream' | 'launch';
  date: Date;
  location: string;
  isVirtual: boolean;
  attendeeCount: number;
  maxAttendees?: number;
  isAttending: boolean;
  hostName: string;
  hostAvatar?: string;
  groupName?: string;
}

export default function EventsPage() {
  const { loading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('upcoming');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const now = new Date();

  // Mock data
  const mockEvents: Event[] = [
    {
      id: '1',
      title: 'Genesis NFT Collection Drop',
      description: 'The first official Demiurge NFT collection. 1000 unique pieces with on-chain perks and governance rights.',
      icon: '💎',
      coverGradient: ['#bf00ff', '#00f5ff'],
      type: 'drop',
      date: new Date(now.getTime() + 3600000 * 4), // 4 hours from now
      location: 'Demiurge Marketplace',
      isVirtual: true,
      attendeeCount: 847,
      isAttending: true,
      hostName: 'Demiurge Official',
      groupName: 'Demiurge Community'
    },
    {
      id: '2',
      title: 'Cosmic Drift Weekly Tournament',
      description: 'Compete against the best players for CGT prizes and exclusive NFT rewards. Top 10 qualify for the monthly championship.',
      icon: '🏆',
      coverGradient: ['#ffd700', '#ff8c00'],
      type: 'tournament',
      date: new Date(now.getTime() + 86400000), // Tomorrow
      location: 'Cosmic Drift Arena',
      isVirtual: true,
      attendeeCount: 128,
      maxAttendees: 256,
      isAttending: true,
      hostName: 'PixelKing',
      groupName: 'Cosmic Drift Players'
    },
    {
      id: '3',
      title: 'Developer AMA: Roadmap 2026',
      description: 'Join the core team as we discuss upcoming features, partnerships, and the future of the Demiurge ecosystem.',
      icon: '💬',
      coverGradient: ['#00ff41', '#008f11'],
      type: 'ama',
      date: new Date(now.getTime() + 86400000 * 3), // 3 days
      location: 'VYB Voice Room',
      isVirtual: true,
      attendeeCount: 312,
      isAttending: false,
      hostName: 'BlockDev',
      groupName: 'Demiurge Developers'
    },
    {
      id: '4',
      title: 'NFT Artists Showcase Night',
      description: 'A virtual gallery walk featuring the best NFT art from our community. Live minting and collector meetup.',
      icon: '🎨',
      coverGradient: ['#ff6b35', '#f7c59f'],
      type: 'stream',
      date: new Date(now.getTime() + 86400000 * 5), // 5 days
      location: 'Virtual Gallery',
      isVirtual: true,
      attendeeCount: 156,
      isAttending: false,
      hostName: 'CryptoArtist',
      groupName: 'NFT Artists Collective'
    },
    {
      id: '5',
      title: 'New Game Launch: Block Legends',
      description: 'The official launch of Block Legends - a blockchain-powered strategy RPG. Early players receive exclusive founder NFTs.',
      icon: '🚀',
      coverGradient: ['#7b2cbf', '#c77dff'],
      type: 'launch',
      date: new Date(now.getTime() + 86400000 * 7), // 1 week
      location: 'Games Hub',
      isVirtual: true,
      attendeeCount: 2341,
      isAttending: true,
      hostName: 'Demiurge Games',
    }
  ];

  const pastEvents: Event[] = [
    {
      id: '6',
      title: 'Testnet Launch Party',
      description: 'Celebrated the launch of Demiurge testnet with the community.',
      icon: '🎉',
      coverGradient: ['#0096c7', '#90e0ef'],
      type: 'meetup',
      date: new Date(now.getTime() - 86400000 * 7), // 1 week ago
      location: 'VYB Main Stage',
      isVirtual: true,
      attendeeCount: 542,
      isAttending: true,
      hostName: 'Demiurge Official',
    }
  ];

  const getTypeLabel = (type: Event['type']) => {
    switch (type) {
      case 'tournament': return { label: 'Tournament', color: 'text-yellow-400', bg: 'bg-yellow-500/10' };
      case 'drop': return { label: 'NFT Drop', color: 'text-purple-400', bg: 'bg-purple-500/10' };
      case 'ama': return { label: 'AMA', color: 'text-green-400', bg: 'bg-green-500/10' };
      case 'meetup': return { label: 'Meetup', color: 'text-blue-400', bg: 'bg-blue-500/10' };
      case 'stream': return { label: 'Live Stream', color: 'text-red-400', bg: 'bg-red-500/10' };
      case 'launch': return { label: 'Launch', color: 'text-neon-cyan', bg: 'bg-neon-cyan/10' };
      default: return { label: 'Event', color: 'text-gray-400', bg: 'bg-gray-500/10' };
    }
  };

  const formatDate = (date: Date) => {
    const diff = date.getTime() - now.getTime();
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    
    if (diff < 0) {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    if (days === 0) {
      if (hours === 0) return 'Starting soon';
      return `In ${hours} hour${hours > 1 ? 's' : ''}`;
    }
    if (days === 1) return 'Tomorrow';
    if (days < 7) return `In ${days} days`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatFullDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const attendingEvents = mockEvents.filter(e => e.isAttending);
  const currentList = activeTab === 'upcoming' ? mockEvents 
    : activeTab === 'attending' ? attendingEvents
    : pastEvents;

  if (loading) {
    return (
      <main className="min-h-screen p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-neon-cyan"></div>
      </main>
    );
  }

  const tabs = [
    { id: 'upcoming' as TabType, label: 'Upcoming', icon: '📅', count: mockEvents.length },
    { id: 'attending' as TabType, label: 'Attending', icon: '✓', count: attendingEvents.length },
    { id: 'past' as TabType, label: 'Past', icon: '📜', count: pastEvents.length },
  ];

  return (
    <main className="min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-b border-gray-800">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <Link href="/social" className="text-gray-500 hover:text-neon-cyan transition-colors text-sm mb-2 inline-block">
                ← Back to VYB
              </Link>
              <h1 className="text-3xl font-grunge bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                📅 Events
              </h1>
              <p className="text-gray-400 text-sm mt-1">Tournaments, drops, AMAs, and more</p>
            </div>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="neon-button px-4 py-2 rounded-lg"
            >
              + Create Event
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg font-body transition-all ${
                  activeTab === tab.id
                    ? 'bg-yellow-500/20 border border-yellow-400 text-yellow-400'
                    : 'text-gray-500 hover:text-gray-300 border border-transparent'
                }`}
              >
                {tab.icon} {tab.label}
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
        {currentList.length === 0 ? (
          <div className="glass-panel p-12 rounded-xl text-center">
            <p className="text-4xl mb-4">📅</p>
            <p className="text-gray-400">
              {activeTab === 'attending' 
                ? "You're not attending any events yet"
                : activeTab === 'past'
                ? 'No past events'
                : 'No upcoming events'}
            </p>
            {activeTab !== 'past' && (
              <button 
                onClick={() => setShowCreateModal(true)}
                className="mt-4 text-neon-cyan hover:underline"
              >
                Create an event →
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {currentList.map((event) => {
              const typeInfo = getTypeLabel(event.type);
              const isPast = event.date.getTime() < now.getTime();
              
              return (
                <div
                  key={event.id}
                  className={`glass-panel rounded-xl overflow-hidden hover:border-yellow-400/30 transition-all ${
                    isPast ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex flex-col md:flex-row">
                    {/* Cover */}
                    <div 
                      className="w-full md:w-64 h-32 md:h-auto flex-shrink-0 relative"
                      style={{
                        background: `linear-gradient(135deg, ${event.coverGradient[0]}, ${event.coverGradient[1]})`
                      }}
                    >
                      <div className="absolute inset-0 flex items-center justify-center text-5xl">
                        {event.icon}
                      </div>
                      {/* Type Badge */}
                      <div className={`absolute top-3 left-3 px-2 py-1 rounded text-xs ${typeInfo.bg} ${typeInfo.color}`}>
                        {typeInfo.label}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-4 md:p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-grunge-alt text-xl text-white">{event.title}</h3>
                          <p className="text-gray-400 text-sm mt-1 line-clamp-2">{event.description}</p>
                        </div>
                        {/* Date */}
                        <div className="text-right flex-shrink-0">
                          <p className={`font-grunge text-lg ${isPast ? 'text-gray-500' : 'text-yellow-400'}`}>
                            {formatDate(event.date)}
                          </p>
                          <p className="text-gray-500 text-xs mt-1">
                            {formatFullDate(event.date)}
                          </p>
                        </div>
                      </div>

                      {/* Meta */}
                      <div className="flex flex-wrap items-center gap-4 mt-4 text-sm">
                        <span className="text-gray-400">
                          📍 {event.location}
                        </span>
                        <span className="text-gray-400">
                          👥 {event.attendeeCount} attending
                          {event.maxAttendees && ` / ${event.maxAttendees} max`}
                        </span>
                        {event.groupName && (
                          <Link 
                            href={`/social/groups/${event.id}`}
                            className="text-neon-purple hover:underline"
                          >
                            🏛️ {event.groupName}
                          </Link>
                        )}
                      </div>

                      {/* Host & Actions */}
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-800">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-cyan/50 to-neon-purple/50 flex items-center justify-center text-sm">
                            👤
                          </div>
                          <span className="text-gray-400 text-sm">
                            Hosted by <span className="text-white">{event.hostName}</span>
                          </span>
                        </div>

                        {!isPast && (
                          <div className="flex items-center gap-2">
                            {event.isAttending ? (
                              <>
                                <span className="px-4 py-2 rounded-lg bg-green-500/10 text-green-400 text-sm border border-green-500/30">
                                  ✓ Attending
                                </span>
                                <button className="glass-panel px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white transition-colors">
                                  Add to Calendar
                                </button>
                              </>
                            ) : (
                              <button className="neon-button px-6 py-2 rounded-lg text-sm">
                                RSVP
                              </button>
                            )}
                            <button className="glass-panel px-3 py-2 rounded-lg text-gray-400 hover:text-neon-cyan transition-colors">
                              📤
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Event Modal */}
      {showCreateModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setShowCreateModal(false)}
        >
          <div 
            className="glass-panel liquid-border w-full max-w-lg rounded-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-800">
              <h2 className="font-grunge text-2xl text-yellow-400">📅 Create Event</h2>
              <p className="text-gray-400 text-sm mt-1">Host a tournament, drop, or meetup</p>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="text-gray-400 text-sm mb-2 block">Event Title</label>
                <input
                  type="text"
                  placeholder="My Awesome Event"
                  className="w-full bg-blockchain-light/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-yellow-400/50 focus:outline-none"
                />
              </div>
              
              <div>
                <label className="text-gray-400 text-sm mb-2 block">Description</label>
                <textarea
                  placeholder="What's this event about?"
                  rows={3}
                  className="w-full bg-blockchain-light/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-yellow-400/50 focus:outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 text-sm mb-2 block">Date</label>
                  <input
                    type="date"
                    className="w-full bg-blockchain-light/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-yellow-400/50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-sm mb-2 block">Time</label>
                  <input
                    type="time"
                    className="w-full bg-blockchain-light/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-yellow-400/50 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-gray-400 text-sm mb-2 block">Event Type</label>
                <select className="w-full bg-blockchain-light/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-yellow-400/50 focus:outline-none">
                  <option value="tournament">🏆 Tournament</option>
                  <option value="drop">💎 NFT Drop</option>
                  <option value="ama">💬 AMA</option>
                  <option value="meetup">👋 Meetup</option>
                  <option value="stream">📺 Live Stream</option>
                  <option value="launch">🚀 Launch</option>
                </select>
              </div>
            </div>

            <div className="p-6 border-t border-gray-800 flex gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 glass-panel py-2 rounded-lg"
              >
                Cancel
              </button>
              <button className="flex-1 neon-button py-2 rounded-lg">
                Create Event
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
