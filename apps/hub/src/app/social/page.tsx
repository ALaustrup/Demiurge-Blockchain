'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

export default function SocialPage() {
  const router = useRouter();
  const { user, loading, isAuthenticated } = useAuth();

  useEffect(() => {
    // Redirect to login if not authenticated (after loading completes)
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  // Show loading state while checking auth
  if (loading) {
    return (
      <main className="min-h-screen p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-neon-cyan mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="glass-panel p-12 text-center">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-demiurge-cyan to-demiurge-violet bg-clip-text text-transparent">
            VYB
          </h1>
          <p className="text-xl text-gray-400 mb-8">
            On-Chain Social Platform
          </p>
          
          <div className="mt-8 space-y-4">
            <h2 className="text-2xl font-bold text-demiurge-cyan mb-6">
              Welcome, {user?.qor_id}!
            </h2>
            
            <div className="text-demiurge-cyan">
              <p className="text-lg">You are connected to VYB Social!</p>
              <p className="text-sm text-gray-400 mt-2">Full social features coming soon...</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
