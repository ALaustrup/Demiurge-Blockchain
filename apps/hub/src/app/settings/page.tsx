'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { qorAuth } from '@demiurge/qor-sdk';
import Link from 'next/link';

type SettingsTab = 'account' | 'security' | 'email' | 'notifications';

export default function SettingsPage() {
  const router = useRouter();
  const { user, loading, isAuthenticated, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>('account');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Form states
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [emailEnabled, setEmailEnabled] = useState(false);
  
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login?redirect=/settings');
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (user) {
      setDisplayName(user.display_name || user.qor_id);
      setBio(user.bio || '');
    }
  }, [user]);

  if (loading) {
    return (
      <main className="min-h-screen p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-neon-cyan mx-auto mb-4"></div>
          <p className="text-gray-400">Loading settings...</p>
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const handleSaveProfile = async () => {
    setSaving(true);
    setMessage(null);
    
    try {
      await qorAuth.updateProfile({ display_name: displayName, bio });
      await refreshUser();
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePin = async () => {
    if (newPin !== confirmPin) {
      setMessage({ type: 'error', text: 'PINs do not match' });
      return;
    }
    if (newPin.length !== 6) {
      setMessage({ type: 'error', text: 'PIN must be 6 digits' });
      return;
    }
    
    setSaving(true);
    setMessage(null);
    
    try {
      await qorAuth.changePin(currentPin, newPin);
      setMessage({ type: 'success', text: 'PIN changed successfully!' });
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to change PIN' });
    } finally {
      setSaving(false);
    }
  };

  const tabs: { id: SettingsTab; label: string; icon: string }[] = [
    { id: 'account', label: 'Account', icon: '👤' },
    { id: 'security', label: 'Security', icon: '🔐' },
    { id: 'email', label: 'Email', icon: '📧' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
  ];

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/dashboard" className="text-gray-400 hover:text-white text-sm mb-2 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-white">Settings</h1>
          <p className="text-gray-400">Manage your account preferences</p>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-neon-green/10 border border-neon-green/50 text-neon-green' 
              : 'bg-red-500/10 border border-red-500/50 text-red-400'
          }`}>
            {message.text}
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar */}
          <div className="md:w-48 flex md:flex-col gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg text-left transition-all ${
                  activeTab === tab.id
                    ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/50'
                    : 'glass-panel text-gray-400 hover:text-white'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 glass-panel rounded-xl p-6">
            {activeTab === 'account' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-white mb-4">Account Settings</h2>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-2">QOR ID</label>
                  <div className="glass-panel px-4 py-3 rounded-lg text-neon-cyan font-mono">
                    {user?.qor_id}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Your QOR ID cannot be changed</p>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Display Name</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full glass-panel px-4 py-3 rounded-lg text-white bg-transparent border border-dark-600 focus:border-neon-cyan outline-none"
                    placeholder="Your display name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Bio</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full glass-panel px-4 py-3 rounded-lg text-white bg-transparent border border-dark-600 focus:border-neon-cyan outline-none resize-none h-24"
                    placeholder="Tell us about yourself..."
                  />
                </div>
                
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="bg-neon-cyan text-black font-bold py-3 px-6 rounded-lg hover:bg-neon-cyan/80 transition-all disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-white mb-4">Security Settings</h2>
                
                <div className="glass-panel p-4 rounded-lg border border-yellow-500/30">
                  <h3 className="font-semibold text-white mb-2">Change PIN</h3>
                  <p className="text-sm text-gray-400 mb-4">
                    Your 6-digit PIN is used to sign transactions and verify your identity.
                  </p>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Current PIN</label>
                      <input
                        type="password"
                        value={currentPin}
                        onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="w-full glass-panel px-4 py-3 rounded-lg text-white bg-transparent border border-dark-600 focus:border-neon-cyan outline-none font-mono text-center tracking-widest"
                        placeholder="••••••"
                        maxLength={6}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">New PIN</label>
                      <input
                        type="password"
                        value={newPin}
                        onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="w-full glass-panel px-4 py-3 rounded-lg text-white bg-transparent border border-dark-600 focus:border-neon-cyan outline-none font-mono text-center tracking-widest"
                        placeholder="••••••"
                        maxLength={6}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Confirm New PIN</label>
                      <input
                        type="password"
                        value={confirmPin}
                        onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="w-full glass-panel px-4 py-3 rounded-lg text-white bg-transparent border border-dark-600 focus:border-neon-cyan outline-none font-mono text-center tracking-widest"
                        placeholder="••••••"
                        maxLength={6}
                      />
                    </div>
                    
                    <button
                      onClick={handleChangePin}
                      disabled={saving || !currentPin || !newPin || !confirmPin}
                      className="bg-yellow-500 text-black font-bold py-2 px-4 rounded-lg hover:bg-yellow-400 transition-all disabled:opacity-50"
                    >
                      {saving ? 'Changing...' : 'Change PIN'}
                    </button>
                  </div>
                </div>
                
                <div className="glass-panel p-4 rounded-lg">
                  <h3 className="font-semibold text-white mb-2">Two-Factor Authentication</h3>
                  <p className="text-sm text-gray-400 mb-4">
                    Add an extra layer of security to your account.
                  </p>
                  <button className="glass-panel py-2 px-4 rounded-lg text-gray-400 cursor-not-allowed">
                    Coming Soon
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'email' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-white mb-4">On-Chain Email</h2>
                
                <div className="glass-panel p-6 rounded-lg border border-neon-cyan/30">
                  <div className="flex items-center gap-4 mb-4">
                    <span className="text-4xl">📧</span>
                    <div>
                      <h3 className="font-semibold text-white">Your Email Address</h3>
                      <p className="text-neon-cyan font-mono">{user?.qor_id}@demiurge.cloud</p>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-400 mb-4">
                    Your on-chain email address is automatically assigned based on your QOR ID.
                    Enable it to send and receive encrypted messages on the blockchain.
                  </p>
                  
                  <div className="flex items-center justify-between glass-panel p-3 rounded-lg">
                    <span className="text-white">Enable On-Chain Email</span>
                    <button 
                      onClick={() => setEmailEnabled(!emailEnabled)}
                      className={`w-12 h-6 rounded-full transition-all relative ${
                        emailEnabled ? 'bg-neon-cyan' : 'bg-dark-600'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all ${
                        emailEnabled ? 'left-6' : 'left-0.5'
                      }`} />
                    </button>
                  </div>
                  
                  {emailEnabled && (
                    <div className="mt-4 p-3 bg-neon-green/10 border border-neon-green/30 rounded-lg">
                      <p className="text-neon-green text-sm">
                        Email service coming soon! You'll be notified when it's ready.
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="glass-panel p-4 rounded-lg">
                  <h3 className="font-semibold text-white mb-2">Storage Mode</h3>
                  <p className="text-sm text-gray-400 mb-4">
                    Choose how your emails are stored:
                  </p>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 p-3 glass-panel rounded-lg cursor-pointer">
                      <input type="radio" name="storage" defaultChecked className="text-neon-cyan" />
                      <div>
                        <div className="text-white">Standard</div>
                        <div className="text-xs text-gray-400">Fast, centralized storage</div>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 p-3 glass-panel rounded-lg cursor-not-allowed opacity-50">
                      <input type="radio" name="storage" disabled className="text-neon-cyan" />
                      <div>
                        <div className="text-white">Decentralized (IPFS)</div>
                        <div className="text-xs text-gray-400">Coming soon - Fully on-chain storage</div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-white mb-4">Notifications</h2>
                
                <div className="space-y-3">
                  {[
                    { id: 'transactions', label: 'Transaction Alerts', desc: 'Get notified for incoming/outgoing transactions', enabled: true },
                    { id: 'games', label: 'Game Rewards', desc: 'Notifications when you earn CGT in games', enabled: true },
                    { id: 'social', label: 'Social Activity', desc: 'Messages and mentions in VYB Social', enabled: false },
                    { id: 'updates', label: 'Platform Updates', desc: 'News and announcements from Demiurge', enabled: true },
                  ].map((notif) => (
                    <div key={notif.id} className="flex items-center justify-between glass-panel p-4 rounded-lg">
                      <div>
                        <div className="text-white font-semibold">{notif.label}</div>
                        <div className="text-sm text-gray-400">{notif.desc}</div>
                      </div>
                      <button className={`w-12 h-6 rounded-full transition-all relative ${
                        notif.enabled ? 'bg-neon-cyan' : 'bg-dark-600'
                      }`}>
                        <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all ${
                          notif.enabled ? 'left-6' : 'left-0.5'
                        }`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
