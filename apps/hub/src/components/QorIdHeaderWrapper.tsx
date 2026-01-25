'use client';

import { useState, useEffect, lazy, Suspense, ReactNode } from 'react';
import { qorAuth, type User, calculateLevel, calculateXpProgress, getTierInfo } from '@demiurge/qor-sdk';
import { QorIdAvatar } from './QorIdAvatar';

// Lazy load AvatarUploadModal to avoid import issues when not logged in
const AvatarUploadModal = lazy(() => import('./avatar/AvatarUploadModal').then(m => ({ default: m.AvatarUploadModal })));

// Wrapper to fix React 19 types compatibility with Suspense
function SuspenseWrapper({ children, fallback }: { children: ReactNode; fallback: ReactNode }) {
  return <Suspense fallback={fallback}>{children}</Suspense>;
}

export function QorIdHeaderWrapper() {
  const [isOpen, setIsOpen] = useState(false);
  const [showAvatarUpload, setShowAvatarUpload] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userXp, setUserXp] = useState(0); // TODO: Fetch from API

  useEffect(() => {
    async function loadUser() {
      if (qorAuth.isAuthenticated()) {
        try {
          const profile = await qorAuth.getProfile();
          setUser(profile);
        } catch (error: any) {
          // Handle network errors gracefully
          if (error.message?.includes('not available') || error.code === 'ERR_NETWORK') {
            console.warn('QOR Auth service not available - running in offline mode');
          } else {
            console.error('Failed to load user profile:', error);
          }
        }
      }
      setLoading(false);
    }
    loadUser();
  }, []);

  const handleLogout = async () => {
    try {
      await qorAuth.logout();
    } catch (error) {
      // Even if logout fails, clear local state
      qorAuth.clearToken();
    }
    window.location.href = '/';
  };

  const handleAvatarUploadSuccess = async (avatarUrl: string) => {
    // Refresh user profile to get updated avatar_url
    try {
      const updatedProfile = await qorAuth.getProfile();
      setUser(updatedProfile);
    } catch (error) {
      console.error('Failed to refresh profile after avatar upload:', error);
    }
  };

  if (loading) {
    return (
      <div className="glass-panel px-4 py-2 rounded-lg">
        <span className="text-gray-400">Loading...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <a
        href="/social"
        className="glass-panel px-4 py-2 rounded-lg hover:chroma-glow transition-all"
      >
        Login
      </a>
    );
  }

  return (
    <div className="relative">
      {/* 3D Avatar - Centered and Clickable */}
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        <QorIdAvatar user={user} />
      </div>
      
      {/* User Menu */}
      {isOpen && (
        <>
          {/* Backdrop to close menu */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 glass-panel p-4 rounded-lg min-w-[220px] z-50">
            <div className="space-y-2">
              {/* User Info with Level */}
              <div className="pb-2 border-b border-demiurge-cyan/20">
                <div className="text-sm text-demiurge-cyan font-bold">
                  {user.qor_id}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs bg-neon-cyan/20 text-neon-cyan px-2 py-0.5 rounded-full">
                    Lv.{calculateLevel(userXp)}
                  </span>
                  <span className="text-xs text-gray-400">
                    {calculateXpProgress(userXp).currentXp} XP
                  </span>
                </div>
              </div>
              
              {/* Dashboard - Primary Link */}
              <a
                href="/dashboard"
                className="block w-full glass-panel py-2 px-3 rounded hover:chroma-glow transition-all text-left text-neon-cyan font-semibold"
                onClick={() => setIsOpen(false)}
              >
                Dashboard
              </a>
              
              <a
                href="/profile"
                className="block w-full glass-panel py-2 px-3 rounded hover:chroma-glow transition-all text-left"
                onClick={() => setIsOpen(false)}
              >
                Profile
              </a>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setShowAvatarUpload(true);
                }}
                className="block w-full glass-panel py-2 px-3 rounded hover:chroma-glow transition-all text-left"
              >
                {user.avatar_url ? 'Change Avatar' : 'Upload Avatar'}
              </button>
              
              {/* Email - On-Chain Email Inbox */}
              <a
                href="/email"
                className="block w-full glass-panel py-2 px-3 rounded hover:chroma-glow transition-all text-left flex items-center justify-between"
                onClick={() => setIsOpen(false)}
              >
                <span>Email</span>
                <span className="text-xs text-gray-500">Coming Soon</span>
              </a>
              
              <a
                href="/nft-portal"
                className="block w-full glass-panel py-2 px-3 rounded hover:chroma-glow transition-all text-left"
                onClick={() => setIsOpen(false)}
              >
                NFT Portal
              </a>
              <a
                href="/settings"
                className="block w-full glass-panel py-2 px-3 rounded hover:chroma-glow transition-all text-left"
                onClick={() => setIsOpen(false)}
              >
                Settings
              </a>
              {user.role === 'god' && (
                <a
                  href="/admin"
                  className="block w-full glass-panel py-2 px-3 rounded hover:chroma-glow transition-all text-left text-demiurge-gold"
                  onClick={() => setIsOpen(false)}
                >
                  Admin Portal
                </a>
              )}
              <button
                onClick={handleLogout}
                className="block w-full glass-panel py-2 px-3 rounded hover:chroma-glow transition-all text-left text-red-400"
              >
                Logout
              </button>
            </div>
          </div>
        </>
      )}

      {/* Avatar Upload Modal */}
      {user && (
        <SuspenseWrapper fallback={null}>
          <AvatarUploadModal
            isOpen={showAvatarUpload}
            onClose={() => setShowAvatarUpload(false)}
            onSuccess={handleAvatarUploadSuccess}
            user={user}
          />
        </SuspenseWrapper>
      )}
    </div>
  );
}
