'use client';

import { useState } from 'react';
import { QorIdLoginModal } from '@/components/auth/QorIdLoginModal';
import { QorIdRegisterModal } from '@/components/auth/QorIdRegisterModal';
import { qorAuth } from '@demiurge/qor-sdk';

export default function SocialPage() {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  const handleLoginSuccess = () => {
    // Refresh page to update nav bar with avatar
    window.location.reload();
  };

  const handleRegisterSuccess = () => {
    // Refresh page to update nav bar with avatar
    window.location.reload();
  };

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
            
            {!qorAuth.isAuthenticated() ? (
              <button
                onClick={() => setShowLoginModal(true)}
                className="glass-panel px-12 py-4 rounded-lg hover:chroma-glow transition-all text-xl font-bold bg-gradient-to-r from-demiurge-cyan to-demiurge-violet text-white"
              >
                LOGIN TO JOIN
              </button>
            ) : (
              <div className="text-demiurge-cyan">
                <p className="text-lg">You are connected!</p>
                <p className="text-sm text-gray-400 mt-2">Social features coming soon...</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <QorIdLoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLoginSuccess={handleLoginSuccess}
        onSwitchToRegister={() => {
          setShowLoginModal(false);
          setShowRegisterModal(true);
        }}
      />

      <QorIdRegisterModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        onRegisterSuccess={handleRegisterSuccess}
        onBackToLogin={() => {
          setShowRegisterModal(false);
          setShowLoginModal(true);
        }}
      />
    </main>
  );
}
