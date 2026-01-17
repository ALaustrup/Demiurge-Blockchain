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
  on_chain?: {
    address: string;
    cgt_balance?: string;
  };
  on_chain_address?: string; // Legacy field name
}

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

  async login(identifier: string, password: string): Promise<LoginResponse> {
    const response = await this.client.post<LoginResponse>('/api/v1/auth/login', {
      identifier, // Can be email or username
      password,
    });
    
    if (response.data.token) {
      this.setToken(response.data.token);
    }
    
    return response.data;
  }

  async register(data: RegisterRequest): Promise<RegisterResponse> {
    try {
      const response = await this.client.post<RegisterResponse>('/api/v1/auth/register', {
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
      // Handle API errors
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw error;
    }
  }

  async forgotPassword(identifier: string): Promise<{ requires_backup_code?: boolean; reset_token?: string; message: string }> {
    try {
      const response = await this.client.post<{ requires_backup_code?: boolean; reset_token?: string; message: string }>('/api/v1/auth/forgot-password', {
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
      await this.client.post('/api/v1/auth/reset-password-backup', {
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
      await this.client.post('/api/v1/auth/reset-password', {
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
      await this.client.post('/api/v1/auth/verify-email', { token });
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  }

  async getProfile(): Promise<User> {
    try {
      const response = await this.client.get<User>('/api/v1/profile');
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
    const response = await this.client.post<LoginResponse>('/api/v1/auth/refresh', {
      refresh_token: refreshToken,
    });
    
    if (response.data.token) {
      this.setToken(response.data.token);
    }
    
    return response.data;
  }

  async logout(): Promise<void> {
    try {
      await this.client.post('/api/v1/auth/logout');
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

  async checkUsername(username: string): Promise<{ available: boolean; username: string }> {
    try {
      const response = await this.client.post<{ available: boolean; username: string }>('/api/v1/auth/check-username', {
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
        '/api/v1/profile/avatar',
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
