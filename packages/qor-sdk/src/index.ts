import axios, { AxiosInstance } from 'axios';

// Export leveling system
export * from './leveling';

// Export asset management
export * from './assets';

// Default to production server, fallback to localhost for development
const DEFAULT_API_URL = process.env.NEXT_PUBLIC_QOR_AUTH_URL || 
  (typeof window !== 'undefined' && window.location.hostname === 'demiurge.cloud'
    ? 'http://51.210.209.112:8080'
    : 'http://localhost:8080');

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
  email: string;
  password: string;
  username: string;
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
    if (typeof window !== 'undefined') {
      localStorage.setItem('qor_token', token);
    }
  }

  getToken(): string | null {
    if (this.token) return this.token;
    if (typeof window !== 'undefined') {
      return localStorage.getItem('qor_token');
    }
    return null;
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('qor_token');
    }
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await this.client.post<LoginResponse>('/api/v1/auth/login', {
      email,
      password,
    });
    
    if (response.data.token) {
      this.setToken(response.data.token);
    }
    
    return response.data;
  }

  async register(data: RegisterRequest): Promise<LoginResponse> {
    try {
      const response = await this.client.post<LoginResponse>('/api/v1/auth/register', data);
      
      if (response.data.token) {
        this.setToken(response.data.token);
      }
      
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
