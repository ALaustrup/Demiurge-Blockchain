'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { qorAuth, type User } from '@demiurge/qor-sdk';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  isGod: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state on app load
  useEffect(() => {
    const initAuth = async () => {
      const token = qorAuth.getToken();
      const refreshToken = qorAuth.getRefreshToken();
      
      if (token) {
        try {
          // Check if token is expiring soon
          if (qorAuth.isTokenExpiringSoon()) {
            console.log('[Auth] Token expiring soon, attempting refresh...');
            if (refreshToken) {
              try {
                await qorAuth.refreshToken(refreshToken);
                console.log('[Auth] Token refreshed successfully');
              } catch (refreshError) {
                console.warn('[Auth] Token refresh failed:', refreshError);
              }
            }
          }
          
          const profile = await qorAuth.getProfile();
          setUser(profile);
        } catch (error: any) {
          // Token expired or invalid - try refresh first
          if (error.response?.status === 401) {
            if (refreshToken) {
              try {
                console.log('[Auth] 401 received, attempting token refresh...');
                await qorAuth.refreshToken(refreshToken);
                const profile = await qorAuth.getProfile();
                setUser(profile);
                console.log('[Auth] Session restored via refresh token');
              } catch (refreshError) {
                console.warn('[Auth] Token refresh failed, clearing session');
                qorAuth.clearToken();
                setUser(null);
              }
            } else {
              console.warn('[Auth] Token expired and no refresh token available');
              qorAuth.clearToken();
              setUser(null);
            }
          } else if (error.code === 'ERR_NETWORK' || error.message?.includes('Network')) {
            // Network errors - keep user state from cache, they might be offline
            console.warn('[Auth] Network error, preserving session from cache');
            const cachedUser = localStorage.getItem('demiurge_user');
            if (cachedUser) {
              try {
                setUser(JSON.parse(cachedUser));
              } catch {
                // Invalid cached data, ignore
              }
            }
          } else {
            console.warn('[Auth] Auth check failed:', error.message);
          }
        }
      }
      setLoading(false);
    };
    
    initAuth();
  }, []);

  // Cache user data on change
  useEffect(() => {
    if (user) {
      localStorage.setItem('demiurge_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('demiurge_user');
    }
  }, [user]);

  const login = async (identifier: string, password: string) => {
    const response = await qorAuth.login(identifier, password);
    setUser(response.user);
  };

  const logout = async () => {
    try {
      await qorAuth.logout();
    } catch {
      // Clear local state even if API fails
      qorAuth.clearToken();
    }
    setUser(null);
    window.location.href = '/';
  };

  const refreshUser = async () => {
    try {
      const profile = await qorAuth.getProfile();
      setUser(profile);
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        isGod: user?.role === 'god',
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// HOC for protected pages - shows loading state while checking auth
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options?: { redirectTo?: string; requireGod?: boolean }
) {
  return function ProtectedComponent(props: P) {
    const { user, loading, isGod } = useAuth();

    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-dark-900">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-neon-cyan mx-auto mb-4"></div>
            <p className="text-gray-400">Loading...</p>
          </div>
        </div>
      );
    }

    if (!user) {
      if (typeof window !== 'undefined') {
        window.location.href = options?.redirectTo || '/login';
      }
      return null;
    }

    if (options?.requireGod && !isGod) {
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
      return null;
    }

    return <Component {...props} />;
  };
}
