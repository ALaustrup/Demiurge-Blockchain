import { qorAuth } from '@demiurge/qor-sdk';
import { MusicRelease, ReleaseType, getReleaseType, getReleaseCost } from '@/lib/vyb/types';

export interface TrackUploadData {
  title: string;
  audioFile?: File;
  audioUri?: string;
  duration: number;
  isExplicit?: boolean;
  lyrics?: string;
}

export interface ReleaseCreationData {
  title: string;
  genre: string;
  description?: string;
  coverArtFile?: File;
  coverArtUri?: string;
  tracks: TrackUploadData[];
  isExplicit?: boolean;
  releaseDate?: Date;
}

export interface ReleaseCreationResult {
  success: boolean;
  releaseId?: string;
  nftId?: string;
  message: string;
}

class ReleaseService {
  private baseUrl = '/api/music';

  private getAuthHeader(): Record<string, string> {
    const token = qorAuth.getToken();
    if (!token) return {};
    return { 'Authorization': `Bearer ${token}` };
  }

  async createRelease(data: ReleaseCreationData): Promise<ReleaseCreationResult> {
    const releaseType = getReleaseType(data.tracks.length);
    const cost = getReleaseCost(releaseType);

    // TODO: Upload cover art and tracks to IPFS
    // For now, we'll assume URIs are provided or mock the upload

    const response = await fetch(`${this.baseUrl}/releases`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
      },
      body: JSON.stringify({
        title: data.title,
        genre: data.genre,
        description: data.description,
        coverArtUri: data.coverArtUri || '',
        tracks: data.tracks.map((t, i) => ({
          trackNumber: i + 1,
          title: t.title,
          audioUri: t.audioUri || '',
          duration: t.duration,
          isExplicit: t.isExplicit || false,
          lyrics: t.lyrics,
        })),
        releaseType,
        mintCost: cost,
        isExplicit: data.isExplicit || false,
        releaseDate: data.releaseDate?.toISOString(),
      }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to create release');
    }

    return result;
  }

  async getRelease(releaseId: string): Promise<MusicRelease | null> {
    const response = await fetch(`${this.baseUrl}/release/${releaseId}`);

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error('Failed to fetch release');
    }

    const data = await response.json();
    return data.release || null;
  }

  async getReleases(options?: {
    artistId?: string;
    genre?: string;
    featured?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{ releases: MusicRelease[]; total: number }> {
    const params = new URLSearchParams();
    if (options?.artistId) params.set('artistId', options.artistId);
    if (options?.genre) params.set('genre', options.genre);
    if (options?.featured) params.set('featured', 'true');
    if (options?.limit) params.set('limit', options.limit.toString());
    if (options?.offset) params.set('offset', options.offset.toString());

    const response = await fetch(`${this.baseUrl}/releases?${params.toString()}`);

    if (!response.ok) {
      return { releases: [], total: 0 };
    }

    const data = await response.json();
    return {
      releases: data.releases || [],
      total: data.total || 0,
    };
  }

  async getFeaturedReleases(): Promise<MusicRelease[]> {
    const { releases } = await this.getReleases({ featured: true, limit: 10 });
    return releases;
  }

  async getNewReleases(limit = 20): Promise<MusicRelease[]> {
    const { releases } = await this.getReleases({ limit });
    return releases;
  }

  async likeRelease(releaseId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/release/${releaseId}/like`, {
      method: 'POST',
      headers: this.getAuthHeader(),
    });

    if (!response.ok) {
      throw new Error('Failed to like release');
    }
  }

  async collectRelease(releaseId: string): Promise<{ success: boolean; nftId?: string }> {
    const response = await fetch(`${this.baseUrl}/release/${releaseId}/collect`, {
      method: 'POST',
      headers: this.getAuthHeader(),
    });

    if (!response.ok) {
      throw new Error('Failed to collect release');
    }

    return response.json();
  }

  // Calculate release cost
  calculateCost(trackCount: number): { type: ReleaseType; cost: number } {
    const type = getReleaseType(trackCount);
    const cost = getReleaseCost(type);
    return { type, cost };
  }
}

export const releaseService = new ReleaseService();
