/**
 * Game Registry
 * 
 * Manages game metadata and registration for the Demiurge ecosystem
 */

// Game categories for organization
export type GameCategory = 'miner' | 'drc369' | 'casual' | 'multiplayer' | 'adventure';

// Supported game engines
export type GameEngine = 'phaser' | 'scattertxt' | 'rosebud' | 'unity-webgl' | 'unreal-webgl' | 'custom';

// Reward types
export interface GameReward {
  type: 'cgt' | 'sparks' | 'nft' | 'xp';
  description: string;
}

export interface GameMetadata {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  entryPoint: string; // Relative path to index.html
  version: string;
  author?: string;
  tags?: string[];
  category: GameCategory; // Primary category
  engine: GameEngine; // Game engine used
  engineVersion?: string;
  rewards?: GameReward[]; // Types of rewards available
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

  /**
   * Get games by category
   */
  getByCategory(category: GameCategory): GameMetadata[] {
    return this.getAll().filter((game) => game.category === category);
  }

  /**
   * Get games by engine
   */
  getByEngine(engine: GameEngine): GameMetadata[] {
    return this.getAll().filter((game) => game.engine === engine);
  }

  /**
   * Get all categories with counts
   */
  getCategoryCounts(): Record<GameCategory, number> {
    const counts: Record<GameCategory, number> = {
      miner: 0,
      drc369: 0,
      casual: 0,
      multiplayer: 0,
      adventure: 0,
    };
    this.getAll().forEach((game) => {
      counts[game.category]++;
    });
    return counts;
  }
}

// Export singleton instance
export const gameRegistry = new GameRegistry();

// Initialize registry - games will be added when they are ready
function initializeRegistry() {
  // Registry is empty - games will be registered when added to the platform
  // New games with DRC-369 NFT integration can be registered using gameRegistry.register()
  //
  // Example registration for a DRC-369 enabled game:
  // gameRegistry.register({
  //   id: 'game-id',
  //   title: 'Game Title',
  //   description: 'Game description',
  //   thumbnail: '/games/game-id/thumb.png',
  //   entryPoint: 'index.html',
  //   version: '1.0.0',
  //   author: 'Developer Name',
  //   category: 'drc369',
  //   engine: 'phaser', // or 'unity-webgl', 'custom', etc.
  //   tags: ['action', 'nft-support'],
  //   rewards: [
  //     { type: 'nft', description: 'Earn account-bound DRC-369 NFTs' },
  //     { type: 'cgt', description: 'Earn CGT rewards' },
  //   ],
  //   nftSupport: {
  //     enabled: true,
  //     assetTypes: ['achievement', 'reward'],
  //   },
  // });
}

// Initialize on module load
initializeRegistry();
