import axios, { AxiosInstance } from 'axios';

// Export leveling system
export * from './leveling';

// Export asset management
export * from './assets';

const DEFAULT_API_URL = process.env.NEXT_PUBLIC_QOR_AUTH_URL || 'http://localhost:8080';

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
    const response = await this.client.post<LoginResponse>('/api/v1/auth/register', data);
    
    if (response.data.token) {
      this.setToken(response.data.token);
    }
    
    return response.data;
  }

  async getProfile(): Promise<User> {
    const response = await this.client.get<User>('/api/v1/profile');
    return response.data;
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
}

// Export singleton instance
export const qorAuth = new QorAuthClient();

// Export default for convenience
export default qorAuth;
