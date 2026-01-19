'use client';

import { useRouter } from 'next/navigation';
import { qorAuth } from '@demiurge/qor-sdk';
import { useEffect } from 'react';

export default function SocialPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!qorAuth.isAuthenticated()) {
      router.push('/login');
    }
  }, [router]);

  if (!qorAuth.isAuthenticated()) {
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
              CONNECT WITH QOR ID
            </h2>
            
            <div className="text-demiurge-cyan">
              <p className="text-lg">You are connected!</p>
              <p className="text-sm text-gray-400 mt-2">Social features coming soon...</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
