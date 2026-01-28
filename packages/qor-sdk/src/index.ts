import axios, { AxiosInstance } from 'axios';

// Export leveling system
export * from './leveling';

// Export asset management
export * from './assets';

// Default to production server, fallback to localhost for development
function getDefaultApiUrl(): string {
  if (process.env.NEXT_PUBLIC_QOR_AUTH_URL) {
    return process.env.NEXT_PUBLIC_QOR_AUTH_URL;
  }
  // Check if we're in browser environment
  if (typeof globalThis !== 'undefined' && 'window' in globalThis) {
    const win = (globalThis as any).window;
    if (win?.location?.hostname === 'demiurge.cloud') {
      return 'https://demiurge.cloud/api/v1';
    }
  }
  return 'http://localhost:8080/api/v1';
}

const DEFAULT_API_URL = getDefaultApiUrl();

export interface QorId {
  username: string;
  discriminator: number;
}

export interface User {
  id: string;
  qor_id: string;
  email: string;
  role: 'user' | 'moderator' | 'admin' | 'god';
  created_at?: string;
  updated_at?: string;
  avatar_url?: string | null;
  display_name?: string;
  bio?: string;
  on_chain?: {
    address: string;
    cgt_balance?: string;
  };
  on_chain_address?: string; // Legacy field name
}

// Response from the QOR Auth API
export interface ApiTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

// Convenience interface for SDK users
export interface LoginResponse {
  token: string;
  refresh_token: string;
  user: User;
}

export interface RegisterRequest {
  email?: string; // Optional - if not provided, account is username-only
  password: string;
  username: string;
}

export interface RegisterResponse {
  qor_id: string;
  email_verified: boolean;
  backup_code?: string; // Only for username-only accounts
  email_verification_token?: string; // Only in dev, remove in production
  message: string;
}

export class QorAuthClient {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor(baseURL: string = DEFAULT_API_URL) {
    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to include token
    this.client.interceptors.request.use((config) => {
      if (this.token) {
        config.headers.Authorization = `Bearer ${this.token}`;
      }
      return config;
    });
  }

  setToken(token: string) {
    this.token = token;
    // Store in localStorage for persistence
    if (typeof globalThis !== 'undefined' && 'window' in globalThis && 'localStorage' in (globalThis as any).window) {
      (globalThis as any).window.localStorage.setItem('qor_token', token);
    }
  }

  getToken(): string | null {
    if (this.token) return this.token;
    if (typeof globalThis !== 'undefined' && 'window' in globalThis && 'localStorage' in (globalThis as any).window) {
      return (globalThis as any).window.localStorage.getItem('qor_token');
    }
    return null;
  }

  clearToken() {
    this.token = null;
    if (typeof globalThis !== 'undefined' && 'window' in globalThis && 'localStorage' in (globalThis as any).window) {
      (globalThis as any).window.localStorage.removeItem('qor_token');
    }
  }

  /**
   * Decode JWT token to get user data (without verification)
   * Useful for offline mode when API is unavailable
   */
  getTokenData(): { qor_id: string; user_id: string; role: string; exp: number } | null {
    const token = this.getToken();
    if (!token) return null;
    
    try {
      // JWT format: header.payload.signature
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      
      // Decode base64url payload
      const payload = parts[1];
      const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      const data = JSON.parse(decoded);
      
      return {
        qor_id: data.qor_id || data.sub,
        user_id: data.user_id || data.sub,
        role: data.role || 'user',
        exp: data.exp || 0,
      };
    } catch (e) {
      console.warn('Failed to decode token:', e);
      return null;
    }
  }

  async login(identifier: string, password: string): Promise<LoginResponse> {
    const response = await this.client.post<ApiTokenResponse>('/auth/login', {
      identifier, // Can be email or username
      password,
    });
    
    const { access_token, refresh_token } = response.data;
    
    if (access_token) {
      this.setToken(access_token);
    }
    
    // Fetch user profile to complete the login response
    let user: User;
    try {
      user = await this.getProfile();
    } catch (e) {
      // If profile fetch fails, create a minimal user object from token
      const tokenData = this.getTokenData();
      user = {
        id: tokenData?.user_id || '',
        qor_id: tokenData?.qor_id || identifier,
        email: '',
        role: (tokenData?.role as User['role']) || 'user',
      };
    }
    
    return {
      token: access_token,
      refresh_token,
      user,
    };
  }

  async register(data: RegisterRequest): Promise<RegisterResponse> {
    try {
      const response = await this.client.post<RegisterResponse>('/auth/register', {
        email: data.email || undefined, // Optional
        username: data.username,
        password: data.password,
      });
      
      // Note: Registration doesn't auto-login, user needs to login after email verification
      return response.data;
    } catch (error: any) {
      if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
        throw new Error('QOR Auth service is not available. Please ensure the service is running on port 8080.');
      }
      // Handle API errors - the error format is { error: { code, message } }
      const apiError = error.response?.data?.error;
      if (apiError) {
        // Extract message from error object
        const message = typeof apiError === 'string' ? apiError : apiError.message || apiError.code || 'Registration failed';
        throw new Error(message);
      }
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  }

  async forgotPassword(identifier: string): Promise<{ requires_backup_code?: boolean; reset_token?: string; message: string }> {
    try {
      const response = await this.client.post<{ requires_backup_code?: boolean; reset_token?: string; message: string }>('/auth/forgot-password', {
        identifier,
      });
      return response.data;
    } catch (error: any) {
      if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
        throw new Error('QOR Auth service is not available.');
      }
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  }

  async resetPasswordWithBackup(username: string, backupCode: string, newPassword: string): Promise<void> {
    try {
      await this.client.post('/auth/reset-password-backup', {
        username,
        backup_code: backupCode,
        new_password: newPassword,
      });
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  }

  async resetPasswordWithToken(token: string, newPassword: string): Promise<void> {
    try {
      await this.client.post('/auth/reset-password', {
        token,
        new_password: newPassword,
      });
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  }

  async verifyEmail(token: string): Promise<void> {
    try {
      await this.client.post('/auth/verify-email', { token });
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  }

  async getProfile(): Promise<User> {
    try {
      const response = await this.client.get<User>('/profile');
      return response.data;
    } catch (error: any) {
      // Handle network errors gracefully
      if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
        throw new Error('QOR Auth service is not available. Please ensure the service is running on port 8080.');
      }
      throw error;
    }
  }

  async refreshToken(refreshToken: string): Promise<LoginResponse> {
    const response = await this.client.post<ApiTokenResponse>('/auth/refresh', {
      refresh_token: refreshToken,
    });
    
    const { access_token, refresh_token: newRefreshToken } = response.data;
    
    if (access_token) {
      this.setToken(access_token);
    }
    
    // Fetch updated user profile
    let user: User;
    try {
      user = await this.getProfile();
    } catch (e) {
      const tokenData = this.getTokenData();
      user = {
        id: tokenData?.user_id || '',
        qor_id: tokenData?.qor_id || '',
        email: '',
        role: (tokenData?.role as User['role']) || 'user',
      };
    }
    
    return {
      token: access_token,
      refresh_token: newRefreshToken,
      user,
    };
  }

  async logout(): Promise<void> {
    try {
      await this.client.post('/auth/logout');
    } finally {
      this.clearToken();
    }
  }

  async isGod(): Promise<boolean> {
    try {
      const profile = await this.getProfile();
      return profile.role === 'god';
    } catch {
      return false;
    }
  }

  async isAdmin(): Promise<boolean> {
    try {
      const profile = await this.getProfile();
      return profile.role === 'admin' || profile.role === 'god';
    } catch {
      return false;
    }
  }

  isAuthenticated(): boolean {
    return this.getToken() !== null;
  }

  /**
   * Update user profile
   */
  async updateProfile(data: { display_name?: string; bio?: string }): Promise<User> {
    try {
      const response = await this.client.put<User>('/profile', data);
      return response.data;
    } catch (error: any) {
      if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
        throw new Error('QOR Auth service is not available.');
      }
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  }

  /**
   * Change user PIN
   */
  async changePin(currentPin: string, newPin: string): Promise<void> {
    try {
      await this.client.post('/profile/change-pin', {
        current_pin: currentPin,
        new_pin: newPin,
      });
    } catch (error: any) {
      if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
        throw new Error('QOR Auth service is not available.');
      }
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  }

  async checkUsername(username: string): Promise<{ available: boolean; username: string }> {
    try {
      const response = await this.client.post<{ available: boolean; username: string }>('/auth/check-username', {
        username,
      });
      return response.data;
    } catch (error: any) {
      // If service is not available, assume username is available (for offline mode)
      if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
        return { available: true, username: username.toLowerCase() };
      }
      throw error;
    }
  }

  /**
   * Upload avatar image and mint as DRC-369 NFT
   * 
   * @param file Image file to upload
   * @param qorId User's QOR ID for the NFT metadata
   * @returns Avatar URL
   */
  async uploadAvatar(file: File, qorId: string): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      formData.append('qor_id', qorId);

      const response = await this.client.post<{ avatar_url: string; asset_uuid?: string }>(
        '/profile/avatar',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      return response.data.avatar_url;
    } catch (error: any) {
      if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
        throw new Error('QOR Auth service is not available. Please ensure the service is running on port 8080.');
      }
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw error;
    }
  }
}

// Export singleton instance
export const qorAuth = new QorAuthClient();

// Export default for convenience
export default qorAuth;
