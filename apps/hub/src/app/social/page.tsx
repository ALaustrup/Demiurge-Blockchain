'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useVYB } from '@/contexts/VYBContext';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Feed, 
  ProfileCard, 
  ProfileCustomizer, 
  NotificationsPanel,
  MediaGallery,
  Messages,
  ServiceMarketplace,
  TopFriends,
} from '@/components/vyb';
import { WelcomeModal } from '@/components/onboarding/WelcomeModal';

type TabType = 'feed' | 'messages' | 'gallery' | 'services' | 'notifications';

export default function SocialPage() {
  const { user } = useAuth();
  const { profile, unreadMessageCount, unreadNotificationCount } = useVYB();
  const [activeTab, setActiveTab] = useState<TabType>('feed');
  const [showWelcome, setShowWelcome] = useState(false);

  // NOTE: No redirect needed - AuthGate ensures users are authenticated before reaching this page

  // Check if user is new and should see welcome modal
  useEffect(() => {
    if (profile && profile.stats.cgtEarned === 0 && profile.stats.posts === 0) {
      // New user - show welcome
      const hasSeenWelcome = localStorage.getItem('vyb-welcome-seen');
      if (!hasSeenWelcome) {
        setShowWelcome(true);
      }
    }
  }, [profile]);

  const handleWelcomeClose = () => {
    localStorage.setItem('vyb-welcome-seen', 'true');
    setShowWelcome(false);
  };

  // NOTE: No loading/auth checks needed - AuthGate handles authentication before this page loads

  const tabs: { id: TabType; label: string; icon: string; badge?: number }[] = [
    { id: 'feed', label: 'Feed', icon: '🌐' },
    { id: 'messages', label: 'Messages', icon: '💬', badge: unreadMessageCount },
    { id: 'gallery', label: 'Gallery', icon: '📸' },
    { id: 'services', label: 'Services', icon: '🛠️' },
    { id: 'notifications', label: 'Notifications', icon: '🔔', badge: unreadNotificationCount },
  ];

  // Quick navigation items
  const quickNav = [
    { href: '/social/friends', icon: '👥', label: 'Friends', count: 142 },
    { href: '/social/groups', icon: '🏛️', label: 'Groups', count: 8 },
    { href: '/social/events', icon: '📅', label: 'Events', count: 3 },
    { href: '/games', icon: '🎮', label: 'Games' },
    { href: '/music', icon: '🎵', label: 'Music' },
    { href: '/marketplace', icon: '🛒', label: 'Market' },
  ];

  // Online friends mock
  const onlineFriends = [
    { id: '1', name: 'CryptoArtist', icon: '🎨', status: 'Playing Cosmic Drift' },
    { id: '2', name: 'BlockDev', icon: '💻', status: 'Online' },
    { id: '3', name: 'PixelKing', icon: '🎮', status: 'In Voice Room' },
    { id: '4', name: 'SynthMaster', icon: '🎵', status: 'Listening to music' },
  ];

  return (
    <main className="min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-neon-cyan/10 to-neon-purple/10 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-grunge bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent">
                VYB
              </h1>
              <p className="text-gray-400 font-body">Your On-Chain Social Network</p>
            </div>
            <div className="flex items-center gap-3">
              <ProfileCustomizer />
              <Link 
                href="/settings" 
                className="glass-panel p-3 rounded-lg hover:border-neon-cyan/50 transition-colors"
              >
                ⚙️
              </Link>
            </div>
          </div>

          {/* Quick Navigation Bar */}
          <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-2">
            {quickNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blockchain-light/30 border border-gray-700 hover:border-neon-cyan/50 hover:bg-neon-cyan/10 transition-all whitespace-nowrap group"
              >
                <span className="group-hover:scale-110 transition-transform">{item.icon}</span>
                <span className="text-gray-300 text-sm group-hover:text-white">{item.label}</span>
                {item.count !== undefined && (
                  <span className="text-xs bg-neon-cyan/20 text-neon-cyan px-2 py-0.5 rounded-full">
                    {item.count}
                  </span>
                )}
              </Link>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-4 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 rounded-t-lg font-body transition-all ${
                  activeTab === tab.id
                    ? 'bg-blockchain-dark border border-b-0 border-gray-800 text-white -mb-px'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.badge && tab.badge > 0 && (
                  <span className="bg-pink-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Feed Tab */}
        {activeTab === 'feed' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Sidebar */}
            <div className="hidden lg:block space-y-6">
              <ProfileCard />
              
              {/* Online Friends */}
              <div className="glass-panel p-4 rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-grunge-alt text-lg text-green-400 flex items-center gap-2">
                    🟢 Online
                  </h3>
                  <span className="text-gray-500 text-xs">{onlineFriends.length} friends</span>
                </div>
                <div className="space-y-3">
                  {onlineFriends.map((friend) => (
                    <Link
                      key={friend.id}
                      href={`/social/profile/${friend.id}`}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-blockchain-light/50 transition-colors group"
                    >
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-cyan/50 to-neon-purple/50 flex items-center justify-center text-lg">
                          {friend.icon}
                        </div>
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-blockchain-dark" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm group-hover:text-neon-cyan transition-colors truncate">
                          {friend.name}
                        </p>
                        <p className="text-gray-500 text-xs truncate">{friend.status}</p>
                      </div>
                    </Link>
                  ))}
                </div>
                <Link 
                  href="/social/friends"
                  className="block text-center text-neon-cyan text-sm mt-4 hover:underline"
                >
                  See all friends →
                </Link>
              </div>

              {/* My Groups */}
              <div className="glass-panel p-4 rounded-xl">
                <h3 className="font-grunge-alt text-lg text-neon-purple mb-4 flex items-center gap-2">
                  🏛️ My Groups
                </h3>
                <div className="space-y-2">
                  {[
                    { name: 'Cosmic Drift Players', icon: '🌌', members: 1247 },
                    { name: 'NFT Artists Collective', icon: '🎨', members: 892 },
                    { name: 'Demiurge Developers', icon: '💻', members: 456 },
                  ].map((group, i) => (
                    <Link
                      key={i}
                      href={`/social/groups/${i+1}`}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-blockchain-light/50 transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-purple/50 to-neon-cyan/50 flex items-center justify-center">
                        {group.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm group-hover:text-neon-purple transition-colors truncate">
                          {group.name}
                        </p>
                        <p className="text-gray-500 text-xs">{group.members} members</p>
                      </div>
                    </Link>
                  ))}
                </div>
                <Link 
                  href="/social/groups"
                  className="block text-center text-neon-purple text-sm mt-4 hover:underline"
                >
                  Browse groups →
                </Link>
              </div>
            </div>

            {/* Main Feed */}
            <div className="lg:col-span-2">
              <Feed />
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="glass-panel p-4 rounded-xl">
                <h3 className="font-grunge-alt text-lg text-neon-cyan mb-4">📊 This Week</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">CGT Earned</span>
                    <span className="text-green-400 font-grunge">+42</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">New Friends</span>
                    <span className="text-blue-400 font-grunge">+8</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Post Likes</span>
                    <span className="text-pink-400 font-grunge">+86</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Tips Received</span>
                    <span className="text-yellow-400 font-grunge">+15 CGT</span>
                  </div>
                </div>
              </div>

              {/* Trending */}
              <div className="glass-panel p-4 rounded-xl">
                <h3 className="font-grunge-alt text-lg text-neon-cyan mb-4">🔥 Trending</h3>
                <div className="space-y-2">
                  <button className="w-full text-left p-2 rounded-lg hover:bg-blockchain-light/50 transition-colors">
                    <span className="text-gray-500 text-xs">#1</span>
                    <p className="text-white text-sm">#CosmicDrift</p>
                    <p className="text-gray-500 text-xs">1.2K posts</p>
                  </button>
                  <button className="w-full text-left p-2 rounded-lg hover:bg-blockchain-light/50 transition-colors">
                    <span className="text-gray-500 text-xs">#2</span>
                    <p className="text-white text-sm">#NFTArt</p>
                    <p className="text-gray-500 text-xs">856 posts</p>
                  </button>
                  <button className="w-full text-left p-2 rounded-lg hover:bg-blockchain-light/50 transition-colors">
                    <span className="text-gray-500 text-xs">#3</span>
                    <p className="text-white text-sm">#StakingRewards</p>
                    <p className="text-gray-500 text-xs">642 posts</p>
                  </button>
                </div>
              </div>

              {/* Upcoming Events */}
              <div className="glass-panel p-4 rounded-xl">
                <h3 className="font-grunge-alt text-lg text-yellow-400 mb-4">📅 Upcoming</h3>
                <div className="space-y-3">
                  {[
                    { name: 'NFT Drop: Genesis Collection', time: 'Today 8PM', type: 'drop' },
                    { name: 'Cosmic Drift Tournament', time: 'Tomorrow 3PM', type: 'tournament' },
                    { name: 'Dev AMA with Core Team', time: 'Sat 6PM', type: 'ama' },
                  ].map((event, i) => (
                    <div key={i} className="p-2 rounded-lg bg-blockchain-light/30">
                      <p className="text-white text-sm">{event.name}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-yellow-400 text-xs">🕐 {event.time}</span>
                        <button className="text-neon-cyan text-xs hover:underline">RSVP</button>
                      </div>
                    </div>
                  ))}
                </div>
                <Link 
                  href="/social/events"
                  className="block text-center text-yellow-400 text-sm mt-4 hover:underline"
                >
                  View all events →
                </Link>
              </div>

              {/* Suggested Creators */}
              <div className="glass-panel p-4 rounded-xl">
                <h3 className="font-grunge-alt text-lg text-neon-cyan mb-4">✨ People to Follow</h3>
                <div className="space-y-3">
                  {[
                    { name: 'CryptoArtist', role: 'artist', icon: '🎨', mutuals: 12 },
                    { name: 'BlockDev', role: 'developer', icon: '💻', mutuals: 8 },
                    { name: 'SynthMaster', role: 'musician', icon: '🎵', mutuals: 5 },
                  ].map((creator, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <Link 
                        href={`/social/profile/${creator.name.toLowerCase()}`}
                        className="flex items-center gap-2 group"
                      >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-cyan/50 to-neon-purple/50 flex items-center justify-center text-sm">
                          {creator.icon}
                        </div>
                        <div>
                          <p className="text-white text-sm group-hover:text-neon-cyan transition-colors">
                            {creator.name}
                          </p>
                          <p className="text-gray-500 text-xs">{creator.mutuals} mutual friends</p>
                        </div>
                      </Link>
                      <button className="text-neon-cyan text-sm hover:bg-neon-cyan/10 px-3 py-1 rounded-full transition-colors">
                        + Add
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Messages Tab */}
        {activeTab === 'messages' && <Messages />}

        {/* Gallery Tab */}
        {activeTab === 'gallery' && <MediaGallery />}

        {/* Services Tab */}
        {activeTab === 'services' && <ServiceMarketplace />}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="max-w-2xl mx-auto">
            <NotificationsPanel />
          </div>
        )}
      </div>

      {/* Welcome Modal for new users */}
      <WelcomeModal
        isOpen={showWelcome}
        onClose={handleWelcomeClose}
        walletAddress={user?.id ? `0x${user.id.slice(0, 40)}` : undefined}
        qorId={user?.qor_id}
      />
    </main>
  );
}
