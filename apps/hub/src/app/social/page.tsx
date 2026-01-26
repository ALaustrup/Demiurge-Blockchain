'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useVYB } from '@/contexts/VYBContext';
import { useEffect, useState } from 'react';
import { 
  Feed, 
  ProfileCard, 
  ProfileCustomizer, 
  NotificationsPanel,
  MediaGallery,
  Messages,
  ServiceMarketplace,
} from '@/components/vyb';
import { WelcomeModal } from '@/components/onboarding/WelcomeModal';

type TabType = 'feed' | 'messages' | 'gallery' | 'services' | 'notifications';

export default function SocialPage() {
  const router = useRouter();
  const { user, loading, isAuthenticated } = useAuth();
  const { profile, unreadMessageCount, unreadNotificationCount } = useVYB();
  const [activeTab, setActiveTab] = useState<TabType>('feed');
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    // Redirect to login if not authenticated (after loading completes)
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

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

  // Show loading state while checking auth
  if (loading) {
    return (
      <main className="min-h-screen p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-neon-cyan mx-auto mb-4"></div>
          <p className="text-gray-400">Loading VYB...</p>
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  const tabs: { id: TabType; label: string; icon: string; badge?: number }[] = [
    { id: 'feed', label: 'Feed', icon: '🌐' },
    { id: 'messages', label: 'Messages', icon: '💬', badge: unreadMessageCount },
    { id: 'gallery', label: 'Gallery', icon: '📸' },
    { id: 'services', label: 'Services', icon: '🛠️' },
    { id: 'notifications', label: 'Notifications', icon: '🔔', badge: unreadNotificationCount },
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
              <p className="text-gray-400 font-body">On-Chain Creator Economy</p>
            </div>
            <div className="flex items-center gap-3">
              <ProfileCustomizer />
              <button className="glass-panel p-3 rounded-lg hover:border-neon-cyan/50 transition-colors">
                ⚙️
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-6 overflow-x-auto">
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
            {/* Main Feed */}
            <div className="lg:col-span-3">
              <Feed />
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <ProfileCard />
              
              {/* Quick Stats */}
              <div className="glass-panel p-4 rounded-xl">
                <h3 className="font-grunge-alt text-lg text-neon-cyan mb-4">📊 This Week</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">CGT Earned</span>
                    <span className="text-green-400 font-grunge">+42</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">New Followers</span>
                    <span className="text-blue-400 font-grunge">+12</span>
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

              {/* Suggested Creators */}
              <div className="glass-panel p-4 rounded-xl">
                <h3 className="font-grunge-alt text-lg text-neon-cyan mb-4">✨ Suggested</h3>
                <div className="space-y-3">
                  {[
                    { name: 'CryptoArtist', role: 'artist', icon: '🎨' },
                    { name: 'BlockDev', role: 'developer', icon: '💻' },
                    { name: 'SynthMaster', role: 'musician', icon: '🎵' },
                  ].map((creator, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-cyan/50 to-neon-purple/50 flex items-center justify-center text-sm">
                          {creator.icon}
                        </div>
                        <div>
                          <p className="text-white text-sm">{creator.name}</p>
                          <p className="text-gray-500 text-xs capitalize">{creator.role}</p>
                        </div>
                      </div>
                      <button className="text-neon-cyan text-sm hover:text-neon-cyan/80 transition-colors">
                        Follow
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
