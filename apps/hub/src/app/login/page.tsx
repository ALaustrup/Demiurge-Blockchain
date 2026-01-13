'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { qorAuth } from '@demiurge/qor-sdk';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await qorAuth.login(email, password);
      // Set cookie for middleware
      document.cookie = `qor_token=${response.token}; path=/; max-age=86400`;
      router.push('/portal');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="glass-panel p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-demiurge-cyan to-demiurge-violet bg-clip-text text-transparent">
          Login to Demiurge
        </h1>
        
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full glass-panel px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-demiurge-cyan"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full glass-panel px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-demiurge-cyan"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full glass-panel py-3 rounded-lg hover:chroma-glow transition-all font-bold disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <a href="/register" className="text-demiurge-cyan hover:text-demiurge-violet">
            Don't have an account? Register
          </a>
        </div>
      </div>
    </main>
  );
}
