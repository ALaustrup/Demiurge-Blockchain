/**
 * Game Registry
 * 
 * Manages game metadata and registration for the Demiurge ecosystem
 */

export interface GameMetadata {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  entryPoint: string; // Relative path to index.html
  version: string;
  author?: string;
  tags?: string[];
  cgtPool?: number; // Current CGT pool (updated dynamically)
  activeUsers?: number; // Current active users (updated dynamically)
  minLevel?: number; // Minimum QOR ID level required
  createdAt?: string;
  updatedAt?: string;
  // CGT earning configuration
  cgtEarning?: {
    [key: string]: {
      amount: number; // CGT amount
      chance: number; // Probability (0.0 to 1.0)
    };
  };
  // DRC-369 NFT support
  nftSupport?: {
    enabled: boolean;
    assetTypes: string[]; // e.g., ['ship_skin', 'weapon', 'powerup']
    exclusiveAssets?: Array<{
      uuid: string;
      name: string;
      description: string;
    }>;
  };
}

/**
 * Game Registry API
 * 
 * In production, this would fetch from a database or API.
 * For now, we'll use a static registry that can be extended.
 */
class GameRegistry {
  private games: Map<string, GameMetadata> = new Map();

  /**
   * Register a new game
   */
  register(game: GameMetadata): void {
    this.games.set(game.id, {
      ...game,
      cgtPool: game.cgtPool || 0,
      activeUsers: game.activeUsers || 0,
      createdAt: game.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  /**
   * Get all registered games
   */
  getAll(): GameMetadata[] {
    return Array.from(this.games.values());
  }

  /**
   * Get a game by ID
   */
  getById(id: string): GameMetadata | undefined {
    return this.games.get(id);
  }

  /**
   * Update game stats (CGT pool, active users)
   */
  updateStats(id: string, stats: { cgtPool?: number; activeUsers?: number }): void {
    const game = this.games.get(id);
    if (game) {
      this.games.set(id, {
        ...game,
        ...stats,
        updatedAt: new Date().toISOString(),
      });
    }
  }

  /**
   * Search games by query
   */
  search(query: string): GameMetadata[] {
    const lowerQuery = query.toLowerCase();
    return this.getAll().filter(
      (game) =>
        game.title.toLowerCase().includes(lowerQuery) ||
        game.description.toLowerCase().includes(lowerQuery) ||
        game.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery))
    );
  }
}

// Export singleton instance
export const gameRegistry = new GameRegistry();

// Initialize registry with default games
function initializeRegistry() {
  // Register Pixel Starship Genesis (Galaga Creator)
  gameRegistry.register({
    id: 'galaga-creator',
    title: 'Pixel Starship Genesis',
    description: 'Infinite procedural gameplay with enemy swarms. Earn CGT by defeating enemies, collect coins, and unlock powerful ship skins! Supports DRC-369 NFT ship skins.',
    thumbnail: '/games/galaga-creator/assets/player_ship.webp',
    entryPoint: 'index.html',
    version: '1.0.0',
    author: 'Demiurge Games',
    tags: ['action', 'arcade', 'shooter', 'space', 'cgt-earning', 'nft-support'],
    minLevel: 1,
    cgtPool: 0,
    activeUsers: 0,
    // CGT earning rates
    cgtEarning: {
      enemyKill: { amount: 1, chance: 0.1 },
      bossDefeat: { amount: 10, chance: 1.0 },
      coinCollect: { amount: 50, chance: 1.0 },
    },
    // DRC-369 NFT support
    nftSupport: {
      enabled: true,
      assetTypes: ['ship_skin'],
      exclusiveAssets: [
        {
          uuid: 'galaga-exclusive-skin-001',
          name: 'Chronos Glaive Ship',
          description: 'Exclusive ship skin for Pixel Starship Genesis owners',
        },
      ],
    },
  });

  // Register Cyber Forge Miner (KillBot Clicker)
  gameRegistry.register({
    id: 'killBot-clicker',
    title: 'Cyber Forge Miner',
    description: 'Interactive pattern-matching data breach mini-game. Mine CGT through computational work. Connect your QOR ID to disburse mined currencies.',
    thumbnail: '/games/killBot-clicker/assets/mining_core.webp',
    entryPoint: 'index.html',
    version: '1.0.0',
    author: 'Demiurge Games',
    tags: ['clicker', 'mining', 'puzzle', 'cyber', 'cgt-earning'],
    minLevel: 1,
    cgtPool: 0,
    activeUsers: 0,
    // CGT earning rates
    cgtEarning: {
      workSubmit: { amount: 0.5, chance: 1.0 },
      patternMatch: { amount: 2.0, chance: 1.0 },
      sessionComplete: { amount: 10.0, chance: 1.0 },
    },
    // DRC-369 NFT support
    nftSupport: {
      enabled: false,
      assetTypes: [],
    },
  });
}

// Initialize on module load
initializeRegistry();
