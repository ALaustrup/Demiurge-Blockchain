/**
 * VYB Social Platform Types
 * Core data structures for the on-chain social network
 */

// ============ User Profile Types ============

export interface VYBProfile {
  qorId: string;
  walletAddress: string;
  displayName: string;
  bio: string;
  avatar?: string;
  coverImage?: string;
  role: UserRole;
  badges: Badge[];
  stats: ProfileStats;
  theme: ProfileTheme;
  createdAt: Date;
  lastActive: Date;
  isVerified: boolean;
  socialLinks: SocialLinks;
}

export type UserRole = 
  | 'creator'
  | 'developer' 
  | 'artist'
  | 'musician'
  | 'designer'
  | 'gamer'
  | 'collector'
  | 'user';

export interface Badge {
  id: string;
  name: string;
  icon: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'legendary';
  earnedAt: Date;
  description: string;
}

export interface ProfileStats {
  followers: number;
  following: number;
  posts: number;
  nftsOwned: number;
  nftsCreated: number;
  cgtEarned: number;
  gamesPlayed: number;
  achievementsUnlocked: number;
}

export interface ProfileTheme {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  fontStyle: 'modern' | 'retro' | 'grunge' | 'minimal';
  layoutStyle: 'classic' | 'grid' | 'timeline' | 'gallery';
  musicEnabled: boolean;
  profileSong?: string;
}

export interface SocialLinks {
  website?: string;
  twitter?: string;
  discord?: string;
  github?: string;
  youtube?: string;
  twitch?: string;
}

// ============ Activity Feed Types ============

export interface FeedItem {
  id: string;
  type: FeedItemType;
  author: FeedAuthor;
  content: FeedContent;
  timestamp: Date;
  likes: number;
  comments: number;
  tips: number;
  tipsAmount: number; // CGT
  isLiked: boolean;
  isTipped: boolean;
  visibility: 'public' | 'followers' | 'private';
  txHash?: string; // On-chain transaction if applicable
}

export type FeedItemType =
  | 'post'
  | 'achievement'
  | 'nft_mint'
  | 'nft_purchase'
  | 'game_score'
  | 'level_up'
  | 'reward'
  | 'follow'
  | 'tip'
  | 'service_complete';

export interface FeedAuthor {
  qorId: string;
  displayName: string;
  avatar?: string;
  isVerified: boolean;
  role: UserRole;
}

export interface FeedContent {
  text?: string;
  media?: MediaItem[];
  nft?: NFTPreview;
  achievement?: AchievementPreview;
  game?: GamePreview;
  reward?: RewardPreview;
  mention?: string[]; // QOR IDs mentioned
}

export interface MediaItem {
  id: string;
  type: 'image' | 'video' | 'audio';
  url: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  duration?: number; // For video/audio
  isMinted: boolean;
  nftId?: string;
  expiresAt?: Date; // 3 months from upload
}

export interface NFTPreview {
  id: string;
  name: string;
  image: string;
  collection?: string;
  price?: number;
}

export interface AchievementPreview {
  id: string;
  name: string;
  icon: string;
  tier: string;
  game?: string;
}

export interface GamePreview {
  id: string;
  name: string;
  thumbnail: string;
  score?: number;
  leaderboardRank?: number;
}

export interface RewardPreview {
  amount: number;
  reason: string;
  source: 'game' | 'staking' | 'referral' | 'achievement' | 'tip';
}

// ============ Messaging Types ============

export interface Conversation {
  id: string;
  participants: ConversationParticipant[];
  lastMessage?: Message;
  unreadCount: number;
  isPinned: boolean;
  isMuted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationParticipant {
  qorId: string;
  displayName: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen?: Date;
}

export interface Message {
  id: string;
  conversationId: string;
  sender: string; // QOR ID
  content: MessageContent;
  timestamp: Date;
  status: 'sending' | 'sent' | 'delivered' | 'read';
  replyTo?: string; // Message ID
  reactions: MessageReaction[];
}

export interface MessageContent {
  text?: string;
  media?: MediaItem[];
  nft?: NFTPreview;
  tip?: {
    amount: number;
    message?: string;
  };
  sharedPost?: string; // Feed item ID
}

export interface MessageReaction {
  emoji: string;
  count: number;
  users: string[]; // QOR IDs
}

// ============ Media Gallery Types ============

export interface GalleryItem {
  id: string;
  ownerId: string;
  type: 'image' | 'video' | 'audio';
  url: string;
  thumbnailUrl?: string;
  title?: string;
  description?: string;
  tags: string[];
  uploadedAt: Date;
  expiresAt: Date; // 3 months from upload
  isMinted: boolean;
  nftId?: string;
  isPublic: boolean;
  views: number;
  likes: number;
}

export interface MintRequest {
  mediaId: string;
  name: string;
  description: string;
  royaltyPercent: number;
  isPublic: boolean;
  collection?: string;
}

// ============ Service Marketplace Types ============

export interface ServiceListing {
  id: string;
  creatorId: string;
  creator: FeedAuthor;
  title: string;
  description: string;
  category: ServiceCategory;
  price: number; // CGT
  deliveryDays: number;
  rating: number;
  reviewCount: number;
  portfolio: MediaItem[];
  tags: string[];
  isActive: boolean;
}

export type ServiceCategory =
  | 'game-design'
  | 'web-design'
  | 'graphics'
  | 'music'
  | 'art'
  | 'animation'
  | '3d-modeling'
  | 'smart-contracts'
  | 'consulting'
  | 'other';

export interface ServiceOrder {
  id: string;
  serviceId: string;
  buyerId: string;
  sellerId: string;
  price: number;
  status: 'pending' | 'accepted' | 'in_progress' | 'delivered' | 'completed' | 'disputed' | 'cancelled';
  requirements: string;
  deliverables?: MediaItem[];
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

// ============ Notification Types ============

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: Date;
  actionUrl?: string;
}

export type NotificationType =
  | 'message'
  | 'follow'
  | 'like'
  | 'comment'
  | 'tip'
  | 'mention'
  | 'achievement'
  | 'reward'
  | 'nft_sold'
  | 'order_update'
  | 'system';
