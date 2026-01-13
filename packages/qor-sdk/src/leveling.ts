/**
 * QOR ID Leveling System: "The Path to Ascension"
 * 
 * Logarithmic progression model:
 * - Level 1-10: Fast-paced (The Awakening)
 * - Level 11-50: Steady (The Disciple)
 * - Level 50+: Prestigious (The Creator God)
 * 
 * XP Formula: XP_Required = 500 × (CurrentLevel)^1.5
 */

export interface LevelInfo {
  level: number;
  currentXP: number;
  xpRequired: number;
  xpProgress: number; // 0-1
  title: string;
  tier: 'awakening' | 'disciple' | 'creator-god';
}

/**
 * Calculate XP required for a given level
 * Formula: XP_Required = 500 × (CurrentLevel)^1.5
 */
export function calculateXPRequired(level: number): number {
  if (level <= 0) return 0;
  return Math.floor(500 * Math.pow(level, 1.5));
}

/**
 * Calculate total XP needed to reach a level
 */
export function calculateTotalXPForLevel(level: number): number {
  let totalXP = 0;
  for (let i = 1; i < level; i++) {
    totalXP += calculateXPRequired(i);
  }
  return totalXP;
}

/**
 * Calculate level from total XP
 */
export function calculateLevelFromXP(totalXP: number): number {
  let level = 1;
  let xpAccumulated = 0;
  
  while (xpAccumulated < totalXP) {
    const xpForNextLevel = calculateXPRequired(level);
    if (xpAccumulated + xpForNextLevel > totalXP) {
      break;
    }
    xpAccumulated += xpForNextLevel;
    level++;
  }
  
  return level;
}

/**
 * Get level information
 */
export function getLevelInfo(totalXP: number): LevelInfo {
  const level = calculateLevelFromXP(totalXP);
  const xpRequired = calculateXPRequired(level);
  const previousLevelXP = calculateTotalXPForLevel(level);
  const currentXP = totalXP - previousLevelXP;
  const xpProgress = currentXP / xpRequired;
  
  let tier: 'awakening' | 'disciple' | 'creator-god';
  let title: string;
  
  if (level <= 10) {
    tier = 'awakening';
    title = 'The Awakening';
  } else if (level <= 50) {
    tier = 'disciple';
    title = 'The Disciple';
  } else {
    tier = 'creator-god';
    title = 'The Creator God';
  }
  
  return {
    level,
    currentXP,
    xpRequired,
    xpProgress: Math.min(xpProgress, 1),
    title,
    tier,
  };
}

/**
 * XP Sources
 */
export enum XPSource {
  TUTORIAL_COMPLETE = 100,
  WALLET_LINKED = 50,
  FIRST_GAME_PLAYED = 150,
  GAME_WIN = 25,
  CGT_STAKED = 10, // Per 100 CGT staked per day
  SOCIAL_FOLLOWER = 5,
  SOCIAL_POST = 2,
  DRC369_MINT = 200,
  ASCENSION_FEAT = 1000, // Tournament win, rare mint, etc.
}

/**
 * Calculate XP multiplier based on owned DRC-369 NFTs
 */
export function calculateXPMultiplier(ownedNFTs: number): number {
  // Base multiplier: 1.0
  // Each NFT adds 0.02x (2%)
  // Max multiplier: 2.0x (50 NFTs)
  return Math.min(1.0 + (ownedNFTs * 0.02), 2.0);
}

/**
 * Apply XP multiplier to earned XP
 */
export function applyXPMultiplier(baseXP: number, multiplier: number): number {
  return Math.floor(baseXP * multiplier);
}
