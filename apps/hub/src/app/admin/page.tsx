'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { qorAuth } from '@demiurge/qor-sdk';

interface User {
  id: string;
  qor_id: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
}

interface Stats {
  total_users: number;
  active_sessions: number;
  registrations_24h: number;
  logins_24h: number;
  users_by_role: Array<{ role: string; count: number }>;
}

export default function AdminPage() {
  const router = useRouter();
  const [isGod, setIsGod] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'tokens' | 'stats'>('users');

  useEffect(() => {
    async function checkAccess() {
      try {
        const hasAccess = await qorAuth.isGod();
        setIsGod(hasAccess);
        setLoading(false);
        
        if (!hasAccess) {
          router.push('/');
          return;
        }

        // Load initial data
        await loadStats();
        await loadUsers();
      } catch (error) {
        console.error('Failed to check access:', error);
        setLoading(false);
        router.push('/');
      }
    }
    checkAccess();
  }, [router]);

  const loadUsers = async () => {
    try {
      const token = qorAuth.getToken();
      const response = await fetch('http://localhost:8080/api/v1/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const loadStats = async () => {
    try {
      const token = qorAuth.getToken();
      const response = await fetch('http://localhost:8080/api/v1/admin/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleBanUser = async (userId: string) => {
    if (!confirm('Are you sure you want to ban this user?')) return;

    try {
      const token = qorAuth.getToken();
      const response = await fetch(`http://localhost:8080/api/v1/admin/users/${userId}/ban`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: 'Admin action' }),
      });
      
      if (response.ok) {
        await loadUsers();
        alert('User banned successfully');
      }
    } catch (error) {
      console.error('Failed to ban user:', error);
    }
  };

  const handleTransferTokens = async (toUserId: string, amount: string) => {
    try {
      const token = qorAuth.getToken();
      const response = await fetch('http://localhost:8080/api/v1/admin/tokens/transfer', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to_user_id: toUserId,
          amount: amount,
          reason: 'Customer support',
        }),
      });
      
      if (response.ok) {
        alert('Token transfer initiated');
      }
    } catch (error) {
      console.error('Failed to transfer tokens:', error);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="glass-panel p-8 rounded-lg">
          <div className="text-demiurge-cyan">Loading admin portal...</div>
        </div>
      </main>
    );
  }

  if (!isGod) {
    return null;
  }

  return (
    <main className="min-h-screen p-8 pt-28">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-demiurge-gold via-demiurge-violet to-demiurge-cyan bg-clip-text text-transparent">
          Admin Portal
        </h1>
        <p className="text-xl text-gray-300 mb-8">
          God-Level System Control
        </p>

        {/* Tabs */}
        <div className="flex gap-4 mb-8">
          {(['users', 'tokens', 'stats'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`glass-panel px-6 py-2 rounded-lg transition-all ${
                activeTab === tab
                  ? 'chroma-glow border border-demiurge-gold'
                  : 'hover:chroma-glow'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="glass-panel p-6 rounded-lg">
            <h2 className="text-2xl font-bold mb-4 text-demiurge-cyan">User Management</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-demiurge-cyan/20">
                    <th className="text-left p-2">QOR ID</th>
                    <th className="text-left p-2">Email</th>
                    <th className="text-left p-2">Role</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Created</th>
                    <th className="text-left p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-demiurge-cyan/10">
                      <td className="p-2">{user.qor_id}</td>
                      <td className="p-2 text-gray-400">{user.email}</td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          user.role === 'god' ? 'bg-demiurge-gold/20 text-demiurge-gold' :
                          user.role === 'admin' ? 'bg-demiurge-violet/20 text-demiurge-violet' :
                          'bg-demiurge-cyan/20 text-demiurge-cyan'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          user.status === 'active' ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="p-2 text-gray-400 text-sm">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-2">
                        <button
                          onClick={() => handleBanUser(user.id)}
                          className="text-red-400 hover:text-red-300 text-sm"
                        >
                          Ban
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tokens Tab */}
        {activeTab === 'tokens' && (
          <div className="glass-panel p-6 rounded-lg">
            <h2 className="text-2xl font-bold mb-4 text-demiurge-cyan">Token Management</h2>
            <div className="space-y-4">
              <div className="glass-panel p-4 rounded-lg">
                <h3 className="text-lg font-bold mb-4">Transfer CGT</h3>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target as HTMLFormElement);
                    handleTransferTokens(
                      formData.get('to_user_id') as string,
                      formData.get('amount') as string
                    );
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm mb-2">To User ID</label>
                    <input
                      type="text"
                      name="to_user_id"
                      required
                      className="w-full glass-panel px-4 py-2 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-2">Amount (CGT)</label>
                    <input
                      type="text"
                      name="amount"
                      required
                      className="w-full glass-panel px-4 py-2 rounded-lg"
                    />
                  </div>
                  <button
                    type="submit"
                    className="glass-panel px-6 py-2 rounded-lg hover:chroma-glow transition-all"
                  >
                    Transfer
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Stats Tab */}
        {activeTab === 'stats' && stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="glass-panel p-6 rounded-lg">
              <h3 className="text-sm text-gray-400 mb-2">Total Users</h3>
              <p className="text-3xl font-bold text-demiurge-cyan">{stats.total_users}</p>
            </div>
            <div className="glass-panel p-6 rounded-lg">
              <h3 className="text-sm text-gray-400 mb-2">Active Sessions</h3>
              <p className="text-3xl font-bold text-demiurge-violet">{stats.active_sessions}</p>
            </div>
            <div className="glass-panel p-6 rounded-lg">
              <h3 className="text-sm text-gray-400 mb-2">Registrations (24h)</h3>
              <p className="text-3xl font-bold text-demiurge-gold">{stats.registrations_24h}</p>
            </div>
            <div className="glass-panel p-6 rounded-lg">
              <h3 className="text-sm text-gray-400 mb-2">Logins (24h)</h3>
              <p className="text-3xl font-bold text-demiurge-cyan">{stats.logins_24h}</p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
