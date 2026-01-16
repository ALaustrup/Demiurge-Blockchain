'use client';

import { useState, useEffect, useRef } from 'react';
import { qorAuth } from '@demiurge/qor-sdk';

interface QorIdAuthFlowProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type AuthStep = 'login' | 'register-email' | 'register-username' | 'register-pin';

export function QorIdAuthFlow({ isOpen, onClose, onSuccess }: QorIdAuthFlowProps) {
  const [step, setStep] = useState<AuthStep>('login');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [usernameStatus, setUsernameStatus] = useState<'checking' | 'available' | 'taken' | 'invalid' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const checkTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal closes
      setStep('login');
      setEmail('');
      setUsername('');
      setPassword('');
      setUsernameStatus(null);
      setError(null);
    }
  }, [isOpen]);

  // Real-time username validation
  useEffect(() => {
    if (step !== 'register-username' || !username) {
      setUsernameStatus(null);
      return;
    }

    if (checkTimeoutRef.current) {
      clearTimeout(checkTimeoutRef.current);
    }

    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(username)) {
      setUsernameStatus('invalid');
      return;
    }

    setUsernameStatus('checking');
    checkTimeoutRef.current = setTimeout(async () => {
      try {
        const result = await qorAuth.checkUsername(username);
        setUsernameStatus(result.available ? 'available' : 'taken');
      } catch (err) {
        setUsernameStatus('available'); // Assume available if API fails
      }
    }, 500);

    return () => {
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }
    };
  }, [username, step]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await qorAuth.login(username, password);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setStep('register-username');
      setError(null);
    }
  };

  const handleUsernameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (usernameStatus === 'available') {
      setStep('register-pin');
      setError(null);
    }
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) return;

    setError(null);
    setIsLoading(true);

    try {
      const response = await qorAuth.register({
        email: email.trim() || `${username}@demiurge.cloud`,
        password,
        username,
      });

      if (response.token) {
        qorAuth.setToken(response.token);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50">
      <div className="glass-panel liquid-border p-10 rounded-xl w-full max-w-lg border-2 border-demiurge-violet/50 relative overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors text-2xl z-10"
        >
          ✕
        </button>

        {/* Login Step */}
        {step === 'login' && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-grunge text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan via-neon-magenta to-neon-green mb-2">
                CONNECT WITH QOR ID
              </h2>
              <p className="text-gray-400 font-body">Enter the Demiurge ecosystem</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2 font-body">Username or Email</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your QOR ID or email"
                  className="w-full bg-gray-900/50 border-2 border-gray-700 rounded-lg p-4 text-white placeholder-gray-500 focus:border-neon-cyan focus:outline-none focus:ring-2 focus:ring-neon-cyan/50 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2 font-body">Chain PIN</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your Chain PIN"
                  className="w-full bg-gray-900/50 border-2 border-gray-700 rounded-lg p-4 text-white placeholder-gray-500 focus:border-neon-cyan focus:outline-none focus:ring-2 focus:ring-neon-cyan/50 transition-all"
                  required
                />
              </div>

              {error && (
                <div className="bg-red-900/30 border-2 border-red-500/50 rounded-lg p-4 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !username || !password}
                className="w-full bg-gradient-to-r from-neon-cyan via-neon-magenta to-neon-green text-white font-grunge-alt py-4 rounded-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-lg chroma-glow"
              >
                {isLoading ? 'CONNECTING...' : 'LOGIN'}
              </button>

              <div className="text-center pt-4 border-t border-gray-700">
                <button
                  type="button"
                  onClick={() => setStep('register-email')}
                  className="text-neon-cyan hover:text-neon-magenta transition-colors underline font-body"
                >
                  Create QOR ID
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Register Email Step */}
        {step === 'register-email' && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-grunge text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan via-neon-magenta to-neon-green mb-2">
                CREATE QOR ID
              </h2>
              <p className="text-gray-400 font-body">Step 1 of 3: Email Address</p>
            </div>

            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2 font-body">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full bg-gray-900/50 border-2 border-gray-700 rounded-lg p-4 text-white placeholder-gray-500 focus:border-neon-cyan focus:outline-none focus:ring-2 focus:ring-neon-cyan/50 transition-all"
                  required
                />
                <p className="text-xs text-gray-500 mt-2 font-body">Used for account recovery and notifications</p>
              </div>

              {error && (
                <div className="bg-red-900/30 border-2 border-red-500/50 rounded-lg p-4 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-neon-cyan via-neon-magenta to-neon-green text-white font-grunge-alt py-4 rounded-lg hover:scale-105 transition-all text-lg chroma-glow"
              >
                CONTINUE
              </button>

              <button
                type="button"
                onClick={() => setStep('login')}
                className="w-full text-neon-cyan hover:text-neon-magenta transition-colors text-sm underline font-body"
              >
                Back to Login
              </button>
            </form>
          </div>
        )}

        {/* Register Username Step */}
        {step === 'register-username' && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-grunge text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan via-neon-magenta to-neon-green mb-2">
                CHOOSE USERNAME
              </h2>
              <p className="text-gray-400 font-body">Step 2 of 3: Your on-chain identity</p>
            </div>

            <form onSubmit={handleUsernameSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2 font-body">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  placeholder="3-20 characters, alphanumeric and _"
                  className="w-full bg-gray-900/50 border-2 border-gray-700 rounded-lg p-4 text-white placeholder-gray-500 focus:border-neon-cyan focus:outline-none focus:ring-2 focus:ring-neon-cyan/50 transition-all"
                  required
                  minLength={3}
                  maxLength={20}
                  pattern="[a-zA-Z0-9_]{3,20}"
                />
                {usernameStatus === 'checking' && (
                  <div className="text-xs text-neon-cyan mt-2 font-body animate-pulse">Checking availability...</div>
                )}
                {usernameStatus === 'available' && (
                  <div className="text-xs text-neon-green mt-2 font-body">✓ Username available</div>
                )}
                {usernameStatus === 'taken' && (
                  <div className="text-xs text-red-400 mt-2 font-body">✗ Username already taken</div>
                )}
                {usernameStatus === 'invalid' && username.length > 0 && (
                  <div className="text-xs text-red-400 mt-2 font-body">Invalid format (3-20 alphanumeric characters)</div>
                )}
              </div>

              {error && (
                <div className="bg-red-900/30 border-2 border-red-500/50 rounded-lg p-4 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={usernameStatus !== 'available'}
                className={`w-full font-grunge-alt py-4 rounded-lg transition-all text-lg ${
                  usernameStatus === 'available'
                    ? 'bg-gradient-to-r from-neon-cyan via-neon-magenta to-neon-green text-white hover:scale-105 chroma-glow'
                    : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                }`}
              >
                CONTINUE
              </button>

              <button
                type="button"
                onClick={() => setStep('register-email')}
                className="w-full text-neon-cyan hover:text-neon-magenta transition-colors text-sm underline font-body"
              >
                ← Back
              </button>
            </form>
          </div>
        )}

        {/* Register PIN Step */}
        {step === 'register-pin' && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-grunge text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan via-neon-magenta to-neon-green mb-2">
                SET CHAIN PIN
              </h2>
              <p className="text-gray-400 font-body">Step 3 of 3: Secure your account</p>
            </div>

            <form onSubmit={handlePinSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2 font-body">Chain PIN (Password)</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full bg-gray-900/50 border-2 border-gray-700 rounded-lg p-4 text-white placeholder-gray-500 focus:border-neon-cyan focus:outline-none focus:ring-2 focus:ring-neon-cyan/50 transition-all"
                  required
                  minLength={6}
                />
                {password.length > 0 && (
                  <div className={`text-xs mt-2 font-body ${password.length >= 6 ? 'text-neon-green' : 'text-red-400'}`}>
                    {password.length >= 6 ? '✓ Chain PIN accepted' : `Minimum 6 characters (${password.length}/6)`}
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-2 font-body">Your Chain PIN secures access to blockchain services</p>
              </div>

              {error && (
                <div className="bg-red-900/30 border-2 border-red-500/50 rounded-lg p-4 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={password.length < 6 || isLoading}
                className={`w-full font-grunge-alt py-4 rounded-lg transition-all text-lg ${
                  password.length >= 6
                    ? 'bg-gradient-to-r from-neon-cyan via-neon-magenta to-neon-green text-white hover:scale-105 chroma-glow'
                    : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isLoading ? 'CREATING ACCOUNT...' : 'CREATE QOR ID'}
              </button>

              <button
                type="button"
                onClick={() => setStep('register-username')}
                className="w-full text-neon-cyan hover:text-neon-magenta transition-colors text-sm underline font-body"
              >
                ← Back
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
