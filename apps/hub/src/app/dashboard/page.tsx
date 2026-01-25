'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ProfileCard, DailyTasksPanel, WalletWidget, UpdatesPanel, BlogPanel } from '@/components/dashboard';
import Link from 'next/link';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading, isAuthenticated } = useAuth();
  const [userXp, setUserXp] = useState(0);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!loading && !isAuthenticated) {
      router.push('/login?redirect=/dashboard');
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    // Fetch user XP from API
    if (user) {
      // TODO: Fetch from gamification API
      // For now, use mock data
      setUserXp(1250);
    }
  }, [user]);

  // Show loading state
  if (loading) {
    return (
      <main className="min-h-screen p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-neon-cyan mx-auto mb-4"></div>
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </main>
    );
  }

  // Will redirect if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome back, <span className="text-neon-cyan">{user?.qor_id}</span>
          </h1>
          <p className="text-gray-400">
            Your on-chain dashboard for the Demiurge ecosystem
          </p>
        </div>

        {/* Quick Actions Bar */}
        <div className="mb-6 flex flex-wrap gap-3">
          <Link
            href="/games"
            className="glass-panel px-4 py-2 rounded-lg text-sm hover:chroma-glow transition-all flex items-center gap-2"
          >
            <span>🎮</span>
            <span>Play Games</span>
          </Link>
          <Link
            href="/scattertxt"
            className="glass-panel px-4 py-2 rounded-lg text-sm hover:chroma-glow transition-all flex items-center gap-2"
          >
            <span>⌨️</span>
            <span>ScatterTXT</span>
          </Link>
          <Link
            href="/social"
            className="glass-panel px-4 py-2 rounded-lg text-sm hover:chroma-glow transition-all flex items-center gap-2"
          >
            <span>💬</span>
            <span>VYB Social</span>
          </Link>
          <Link
            href="/settings"
            className="glass-panel px-4 py-2 rounded-lg text-sm hover:chroma-glow transition-all flex items-center gap-2"
          >
            <span>⚙️</span>
            <span>Settings</span>
          </Link>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile & Wallet */}
          <div className="space-y-6">
            <ProfileCard xp={userXp} />
            <WalletWidget />
          </div>

          {/* Middle Column - Daily Tasks */}
          <div className="lg:col-span-1">
            <DailyTasksPanel 
              onTasksUpdate={(count, sparks) => {
                // Could update a global state here
                console.log(`Tasks completed: ${count}, Sparks earned: ${sparks}`);
              }}
            />
          </div>

          {/* Right Column - Updates & Blog */}
          <div className="space-y-6">
            <UpdatesPanel />
            <BlogPanel />
          </div>
        </div>

        {/* Bottom Section - Recent Activity */}
        <div className="mt-8 glass-panel rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {/* Mock activity items */}
            {[
              { icon: '🎮', text: 'Played Pixel Starship Genesis', time: '2 hours ago', reward: '+50 Sparks' },
              { icon: '💰', text: 'Received 10 CGT from staking rewards', time: '5 hours ago', reward: null },
              { icon: '✅', text: 'Completed daily login task', time: '8 hours ago', reward: '+100 Sparks' },
              { icon: '🆙', text: 'Reached Level 5!', time: '1 day ago', reward: '+500 Sparks bonus' },
            ].map((activity, i) => (
              <div key={i} className="flex items-center justify-between glass-panel p-3 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{activity.icon}</span>
                  <div>
                    <div className="text-white">{activity.text}</div>
                    <div className="text-xs text-gray-500">{activity.time}</div>
                  </div>
                </div>
                {activity.reward && (
                  <span className="text-sm text-neon-green font-semibold">{activity.reward}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
