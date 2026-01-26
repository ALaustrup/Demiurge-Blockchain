/**
 * VYB Social Platform Service
 * Handles all VYB data operations and blockchain interactions
 */

import { demiurgeRpc } from '../demiurge-rpc';
import type {
  VYBProfile,
  FeedItem,
  Conversation,
  Message,
  GalleryItem,
  ServiceListing,
  Notification,
  ProfileTheme,
  UserRole,
  FeedItemType,
} from './types';

// Default profile theme
const DEFAULT_THEME: ProfileTheme = {
  primaryColor: '#00f5ff',
  secondaryColor: '#bf00ff',
  backgroundColor: '#0a0a0f',
  fontStyle: 'modern',
  layoutStyle: 'classic',
  musicEnabled: true,
};

// Mock data for development - will be replaced with blockchain/backend calls
const MOCK_PROFILES: Map<string, VYBProfile> = new Map();
const MOCK_FEED: FeedItem[] = [];
const MOCK_CONVERSATIONS: Map<string, Conversation[]> = new Map();
const MOCK_MESSAGES: Map<string, Message[]> = new Map();
const MOCK_GALLERY: Map<string, GalleryItem[]> = new Map();
const MOCK_NOTIFICATIONS: Map<string, Notification[]> = new Map();

class VYBService {
  private currentUser: string | null = null;

  setCurrentUser(qorId: string) {
    this.currentUser = qorId;
  }

  // ============ Profile Methods ============

  async getProfile(qorId: string): Promise<VYBProfile | null> {
    // Check mock data first
    if (MOCK_PROFILES.has(qorId)) {
      return MOCK_PROFILES.get(qorId)!;
    }

    // Return a default profile for any user (auto-create)
    const profile: VYBProfile = {
      qorId,
      walletAddress: '',
      displayName: qorId.split('#')[0] || 'User',
      bio: 'New to VYB - Building something amazing!',
      role: 'user',
      badges: [],
      stats: {
        followers: Math.floor(Math.random() * 100),
        following: Math.floor(Math.random() * 50),
        posts: Math.floor(Math.random() * 20),
        nftsOwned: Math.floor(Math.random() * 10),
        nftsCreated: 0,
        cgtEarned: Math.floor(Math.random() * 1000),
        gamesPlayed: Math.floor(Math.random() * 15),
        achievementsUnlocked: Math.floor(Math.random() * 8),
      },
      theme: DEFAULT_THEME,
      createdAt: new Date(),
      lastActive: new Date(),
      isVerified: false,
      socialLinks: {},
    };

    MOCK_PROFILES.set(qorId, profile);
    return profile;
  }

  async updateProfile(qorId: string, updates: Partial<VYBProfile>): Promise<VYBProfile> {
    const existing = await this.getProfile(qorId);
    if (!existing) throw new Error('Profile not found');

    const updated = { ...existing, ...updates };
    MOCK_PROFILES.set(qorId, updated);
    return updated;
  }

  async updateTheme(qorId: string, theme: Partial<ProfileTheme>): Promise<ProfileTheme> {
    const profile = await this.getProfile(qorId);
    if (!profile) throw new Error('Profile not found');

    const updatedTheme = { ...profile.theme, ...theme };
    await this.updateProfile(qorId, { theme: updatedTheme });
    return updatedTheme;
  }

  async followUser(targetQorId: string): Promise<boolean> {
    // TODO: Implement follow logic
    console.log(`Following ${targetQorId}`);
    return true;
  }

  async unfollowUser(targetQorId: string): Promise<boolean> {
    // TODO: Implement unfollow logic
    console.log(`Unfollowing ${targetQorId}`);
    return true;
  }

  // ============ Feed Methods ============

  async getFeed(options?: {
    type?: 'global' | 'following' | 'profile';
    userId?: string;
    limit?: number;
    offset?: number;
  }): Promise<FeedItem[]> {
    const limit = options?.limit || 20;
    
    // Generate mock feed items
    const feed = this.generateMockFeed(limit, options?.userId);
    return feed;
  }

  async createPost(content: {
    text?: string;
    media?: string[];
    visibility?: 'public' | 'followers' | 'private';
  }): Promise<FeedItem> {
    if (!this.currentUser) throw new Error('Not logged in');

    const post: FeedItem = {
      id: `post_${Date.now()}`,
      type: 'post',
      author: {
        qorId: this.currentUser,
        displayName: this.currentUser.split('#')[0] || 'User',
        isVerified: false,
        role: 'user',
      },
      content: {
        text: content.text,
        media: content.media?.map((url, i) => ({
          id: `media_${Date.now()}_${i}`,
          type: 'image' as const,
          url,
          isMinted: false,
          expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 3 months
        })),
      },
      timestamp: new Date(),
      likes: 0,
      comments: 0,
      tips: 0,
      tipsAmount: 0,
      isLiked: false,
      isTipped: false,
      visibility: content.visibility || 'public',
    };

    MOCK_FEED.unshift(post);
    return post;
  }

  async likePost(postId: string): Promise<boolean> {
    const post = MOCK_FEED.find(p => p.id === postId);
    if (post) {
      post.isLiked = !post.isLiked;
      post.likes += post.isLiked ? 1 : -1;
    }
    return true;
  }

  async tipPost(postId: string, amount: number): Promise<boolean> {
    if (!this.currentUser) throw new Error('Not logged in');
    
    const post = MOCK_FEED.find(p => p.id === postId);
    if (post) {
      post.isTipped = true;
      post.tips += 1;
      post.tipsAmount += amount;
    }
    
    // TODO: Execute actual CGT transfer
    return true;
  }

  private generateMockFeed(limit: number, userId?: string): FeedItem[] {
    const feedTypes: FeedItemType[] = ['post', 'achievement', 'nft_mint', 'game_score', 'reward'];
    const mockUsers = [
      { qorId: 'artist#0042', displayName: 'CryptoArtist', role: 'artist' as UserRole, isVerified: true },
      { qorId: 'dev#0101', displayName: 'BlockDev', role: 'developer' as UserRole, isVerified: true },
      { qorId: 'musician#0088', displayName: 'SynthMaster', role: 'musician' as UserRole, isVerified: false },
      { qorId: 'gamer#1337', displayName: 'ProGamer', role: 'gamer' as UserRole, isVerified: false },
      { qorId: 'designer#0033', displayName: 'PixelPerfect', role: 'designer' as UserRole, isVerified: true },
    ];

    const posts: string[] = [
      'Just minted my latest NFT collection! Check it out on the marketplace 🎨',
      'Hit a new high score in Cosmic Drift! Who can beat 15,000 points? 🚀',
      'Working on a new game for the Demiurge platform. Stay tuned! 🎮',
      'Loving the new staking rewards! 5% APY is amazing 📈',
      'New music track dropping tomorrow. Preview in my profile 🎵',
      'Just completed the "Creator God" achievement! Platinum tier 🏆',
      'Looking for collaborators on a metaverse project. DM me!',
      'The VYB community is growing fast! Welcome to all the new creators 💜',
    ];

    const feed: FeedItem[] = [];
    
    for (let i = 0; i < limit; i++) {
      const type = feedTypes[Math.floor(Math.random() * feedTypes.length)];
      const author = mockUsers[Math.floor(Math.random() * mockUsers.length)];
      
      const item: FeedItem = {
        id: `feed_${Date.now()}_${i}`,
        type,
        author,
        content: this.generateContentForType(type, posts),
        timestamp: new Date(Date.now() - i * 1000 * 60 * 30), // 30 min apart
        likes: Math.floor(Math.random() * 100),
        comments: Math.floor(Math.random() * 20),
        tips: Math.floor(Math.random() * 10),
        tipsAmount: Math.floor(Math.random() * 50),
        isLiked: Math.random() > 0.7,
        isTipped: Math.random() > 0.9,
        visibility: 'public',
      };
      
      feed.push(item);
    }
    
    return feed;
  }

  private generateContentForType(type: FeedItemType, posts: string[]): FeedItem['content'] {
    switch (type) {
      case 'post':
        return { text: posts[Math.floor(Math.random() * posts.length)] };
      case 'achievement':
        return {
          text: 'Unlocked a new achievement!',
          achievement: {
            id: `ach_${Date.now()}`,
            name: ['First Steps', 'Rising Star', 'Creator God', 'Diamond Hands'][Math.floor(Math.random() * 4)],
            icon: '🏆',
            tier: ['bronze', 'silver', 'gold', 'platinum'][Math.floor(Math.random() * 4)],
          },
        };
      case 'nft_mint':
        return {
          text: 'Just minted a new NFT!',
          nft: {
            id: `nft_${Date.now()}`,
            name: ['Cosmic Journey', 'Digital Dreams', 'Neon Nights', 'Cyber Soul'][Math.floor(Math.random() * 4)],
            image: '/placeholder-nft.png',
          },
        };
      case 'game_score':
        return {
          text: 'New personal best!',
          game: {
            id: 'cosmic-drift',
            name: 'Cosmic Drift',
            thumbnail: '/games/cosmic-drift.png',
            score: Math.floor(Math.random() * 20000),
            leaderboardRank: Math.floor(Math.random() * 100) + 1,
          },
        };
      case 'reward':
        return {
          text: 'Earned CGT rewards!',
          reward: {
            amount: Math.floor(Math.random() * 100) + 10,
            reason: ['Daily login', 'Game completion', 'Achievement unlocked', 'Staking reward'][Math.floor(Math.random() * 4)],
            source: ['game', 'staking', 'achievement'][Math.floor(Math.random() * 3)] as any,
          },
        };
      default:
        return { text: 'Something happened!' };
    }
  }

  // ============ Messaging Methods ============

  async getConversations(): Promise<Conversation[]> {
    if (!this.currentUser) return [];
    
    // Return mock conversations
    const mockConversations: Conversation[] = [
      {
        id: 'conv_1',
        participants: [
          { qorId: 'artist#0042', displayName: 'CryptoArtist', isOnline: true },
        ],
        lastMessage: {
          id: 'msg_1',
          conversationId: 'conv_1',
          sender: 'artist#0042',
          content: { text: 'Hey! Loved your latest post 🎨' },
          timestamp: new Date(Date.now() - 1000 * 60 * 5),
          status: 'delivered',
          reactions: [],
        },
        unreadCount: 2,
        isPinned: true,
        isMuted: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
        updatedAt: new Date(Date.now() - 1000 * 60 * 5),
      },
      {
        id: 'conv_2',
        participants: [
          { qorId: 'dev#0101', displayName: 'BlockDev', isOnline: false, lastSeen: new Date(Date.now() - 1000 * 60 * 30) },
        ],
        lastMessage: {
          id: 'msg_2',
          conversationId: 'conv_2',
          sender: this.currentUser,
          content: { text: 'Thanks for the collaboration offer!' },
          timestamp: new Date(Date.now() - 1000 * 60 * 60),
          status: 'read',
          reactions: [],
        },
        unreadCount: 0,
        isPinned: false,
        isMuted: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48),
        updatedAt: new Date(Date.now() - 1000 * 60 * 60),
      },
    ];
    
    return mockConversations;
  }

  async getMessages(conversationId: string): Promise<Message[]> {
    // Return mock messages
    return [
      {
        id: 'msg_1',
        conversationId,
        sender: 'artist#0042',
        content: { text: 'Hey there! 👋' },
        timestamp: new Date(Date.now() - 1000 * 60 * 60),
        status: 'read',
        reactions: [],
      },
      {
        id: 'msg_2',
        conversationId,
        sender: this.currentUser || 'me',
        content: { text: 'Hi! How are you?' },
        timestamp: new Date(Date.now() - 1000 * 60 * 55),
        status: 'read',
        reactions: [],
      },
      {
        id: 'msg_3',
        conversationId,
        sender: 'artist#0042',
        content: { text: 'Doing great! Loved your latest post 🎨' },
        timestamp: new Date(Date.now() - 1000 * 60 * 5),
        status: 'delivered',
        reactions: [{ emoji: '❤️', count: 1, users: [this.currentUser || 'me'] }],
      },
    ];
  }

  async sendMessage(conversationId: string, content: Message['content']): Promise<Message> {
    if (!this.currentUser) throw new Error('Not logged in');

    const message: Message = {
      id: `msg_${Date.now()}`,
      conversationId,
      sender: this.currentUser,
      content,
      timestamp: new Date(),
      status: 'sent',
      reactions: [],
    };

    return message;
  }

  async startConversation(targetQorId: string): Promise<Conversation> {
    if (!this.currentUser) throw new Error('Not logged in');

    const conversation: Conversation = {
      id: `conv_${Date.now()}`,
      participants: [
        { qorId: targetQorId, displayName: targetQorId.split('#')[0], isOnline: false },
      ],
      unreadCount: 0,
      isPinned: false,
      isMuted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return conversation;
  }

  // ============ Media Gallery Methods ============

  async getGallery(qorId: string): Promise<GalleryItem[]> {
    // Return mock gallery items
    const mockItems: GalleryItem[] = [
      {
        id: 'media_1',
        ownerId: qorId,
        type: 'image',
        url: '/placeholder-1.png',
        thumbnailUrl: '/placeholder-1-thumb.png',
        title: 'My first upload',
        tags: ['art', 'digital'],
        uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 83), // ~83 days left
        isMinted: false,
        isPublic: true,
        views: 42,
        likes: 12,
      },
      {
        id: 'media_2',
        ownerId: qorId,
        type: 'image',
        url: '/placeholder-2.png',
        thumbnailUrl: '/placeholder-2-thumb.png',
        title: 'Neon Dreams',
        tags: ['neon', 'cyberpunk'],
        uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14),
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 76),
        isMinted: true,
        nftId: 'nft_001',
        isPublic: true,
        views: 156,
        likes: 48,
      },
    ];
    
    return mockItems;
  }

  async uploadMedia(file: File): Promise<GalleryItem> {
    if (!this.currentUser) throw new Error('Not logged in');

    // TODO: Upload to server
    const item: GalleryItem = {
      id: `media_${Date.now()}`,
      ownerId: this.currentUser,
      type: file.type.startsWith('video') ? 'video' : file.type.startsWith('audio') ? 'audio' : 'image',
      url: URL.createObjectURL(file),
      title: file.name,
      tags: [],
      uploadedAt: new Date(),
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 3 months
      isMinted: false,
      isPublic: false,
      views: 0,
      likes: 0,
    };

    return item;
  }

  async mintMedia(mediaId: string, options: {
    name: string;
    description: string;
    royaltyPercent: number;
  }): Promise<{ success: boolean; nftId?: string; txHash?: string }> {
    // TODO: Call DRC-369 minting RPC
    console.log(`Minting media ${mediaId} as NFT:`, options);
    
    return {
      success: true,
      nftId: `nft_${Date.now()}`,
      txHash: `0x${Math.random().toString(16).slice(2)}`,
    };
  }

  // ============ Notification Methods ============

  async getNotifications(): Promise<Notification[]> {
    if (!this.currentUser) return [];

    // Return mock notifications
    return [
      {
        id: 'notif_1',
        type: 'tip',
        title: 'You received a tip!',
        message: 'artist#0042 tipped you 5 CGT',
        isRead: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 5),
        actionUrl: '/social',
      },
      {
        id: 'notif_2',
        type: 'follow',
        title: 'New follower',
        message: 'gamer#1337 started following you',
        isRead: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 30),
        actionUrl: '/social/profile/gamer%231337',
      },
      {
        id: 'notif_3',
        type: 'achievement',
        title: 'Achievement unlocked!',
        message: 'You earned the "Rising Star" badge',
        isRead: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
      },
      {
        id: 'notif_4',
        type: 'like',
        title: 'Someone liked your post',
        message: 'dev#0101 liked your post',
        isRead: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5),
      },
    ];
  }

  async markNotificationRead(notificationId: string): Promise<void> {
    console.log(`Marking notification ${notificationId} as read`);
  }

  async markAllNotificationsRead(): Promise<void> {
    console.log('Marking all notifications as read');
  }

  // ============ Service Marketplace Methods ============

  async getServices(category?: string): Promise<ServiceListing[]> {
    // Return mock services
    return [
      {
        id: 'svc_1',
        creatorId: 'artist#0042',
        creator: { qorId: 'artist#0042', displayName: 'CryptoArtist', role: 'artist', isVerified: true },
        title: 'Custom NFT Artwork',
        description: 'Hand-drawn digital art for your NFT collection. Multiple styles available.',
        category: 'art',
        price: 50,
        deliveryDays: 7,
        rating: 4.8,
        reviewCount: 24,
        portfolio: [],
        tags: ['nft', 'digital art', 'custom'],
        isActive: true,
      },
      {
        id: 'svc_2',
        creatorId: 'musician#0088',
        creator: { qorId: 'musician#0088', displayName: 'SynthMaster', role: 'musician', isVerified: false },
        title: 'Game Soundtrack',
        description: 'Original music for your game. Chiptune, synthwave, or orchestral.',
        category: 'music',
        price: 100,
        deliveryDays: 14,
        rating: 4.9,
        reviewCount: 12,
        portfolio: [],
        tags: ['music', 'game', 'soundtrack'],
        isActive: true,
      },
      {
        id: 'svc_3',
        creatorId: 'dev#0101',
        creator: { qorId: 'dev#0101', displayName: 'BlockDev', role: 'developer', isVerified: true },
        title: 'Smart Contract Development',
        description: 'Custom smart contracts for your project. Audited and secure.',
        category: 'smart-contracts',
        price: 500,
        deliveryDays: 21,
        rating: 5.0,
        reviewCount: 8,
        portfolio: [],
        tags: ['blockchain', 'smart contracts', 'development'],
        isActive: true,
      },
    ];
  }
}

// Export singleton
export const vybService = new VYBService();
