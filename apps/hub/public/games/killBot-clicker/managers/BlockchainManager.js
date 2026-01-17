/**
 * Demiurge Blockchain Manager for Cyber Forge Miner
 * 
 * Replaces APIManager with blockchain integration
 */

class BlockchainManager {
  constructor(options = {}) {
    this.isWalletConnected = false;
    this.qorId = null;
    this.balance = '0';
    this.assets = [];
    this.mockMode = options.mockMode || false;
    this.onConnectionChange = options.onConnectionChange || null;
    
    // Check if HUD is available (injected by Demiurge Hub)
    this.hudAvailable = typeof window !== 'undefined' && window.DemiurgeHUD;
    
    if (!this.hudAvailable && !this.mockMode) {
      console.warn('DemiurgeHUD not available. Enable mockMode for development.');
    }
  }

  /**
   * Connect to Demiurge wallet (replaces login)
   * @returns {Promise<boolean>}
   */
  async connectDemiurgeWallet() {
    if (this.mockMode) {
      this.isWalletConnected = true;
      this.qorId = 'mock_user_123';
      this.balance = '100000000000'; // 1000 CGT
      this.assets = [];
      if (this.onConnectionChange) {
        this.onConnectionChange(true);
      }
      return true;
    }

    if (!this.hudAvailable) {
      throw new Error('DemiurgeHUD not available. Game must be loaded in Demiurge Hub.');
    }

    try {
      this.qorId = await window.DemiurgeHUD.getQORID();
      this.balance = await window.DemiurgeHUD.getCGTBalance();
      this.assets = await window.DemiurgeHUD.getUserAssets();
      
      this.isWalletConnected = true;
      
      if (this.onConnectionChange) {
        this.onConnectionChange(true);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      this.isWalletConnected = false;
      if (this.onConnectionChange) {
        this.onConnectionChange(false);
      }
      return false;
    }
  }

  /**
   * Start mining session (replaces startSession)
   * @returns {Promise<Object>}
   */
  async startSession() {
    if (!this.isWalletConnected) {
      return { success: false, error: 'Wallet not connected' };
    }

    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return { success: true, sessionId };
  }

  /**
   * Submit work and earn CGT (replaces submitWork)
   * @param {Object} hashData - Work submission data
   * @returns {Promise<Object>}
   */
  async submitWork(hashData) {
    if (!this.isWalletConnected) {
      return { success: false, error: 'Wallet not connected' };
    }

    try {
      // Calculate CGT reward based on work power
      const baseReward = 0.5; // Base CGT per work submission
      const powerMultiplier = hashData.power || 1;
      const rewardAmount = baseReward * powerMultiplier;

      // Submit reward via API
      const token = this.getAuthToken();
      if (!token) {
        // Fallback to mock if no token
        return { 
          success: true, 
          yield: rewardAmount,
          cgtEarned: rewardAmount,
        };
      }

      const response = await fetch('/api/games/reward', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          gameId: 'killBot-clicker',
          amount: rewardAmount,
          reason: 'work_submit',
        }),
      });

      if (response.ok) {
        const result = await response.json();
        // Update local balance
        await this.refreshBalance();
        
        return {
          success: true,
          yield: rewardAmount,
          cgtEarned: rewardAmount,
          txHash: result.txHash,
        };
      } else {
        // Fallback to mock on error
        return { 
          success: true, 
          yield: rewardAmount,
          cgtEarned: rewardAmount,
        };
      }
    } catch (error) {
      console.warn('Work submission failed, using fallback:', error);
      // Fallback calculation
      return { 
        success: true, 
        yield: (hashData.power || 1) * 1.5,
        cgtEarned: (hashData.power || 1) * 0.5,
      };
    }
  }

  /**
   * Get mining stats (replaces getStats)
   * @returns {Promise<Object>}
   */
  async getStats() {
    if (!this.isWalletConnected) {
      return {
        balance: 0,
        hashrate: 0,
        uptime: '0h',
        rank: 0,
      };
    }

    try {
      const balanceStr = await this.getDemiurgeBalance();
      const balanceBigInt = BigInt(balanceStr);
      const balanceCGT = Number(balanceBigInt) / 100; // 100 Sparks = 1 CGT

      // Load game data for stats
      const gameData = await this.loadGameData();

      return {
        balance: balanceCGT,
        hashrate: gameData?.hashrate || 0,
        uptime: this.formatUptime(gameData?.playTime || 0),
        rank: gameData?.rank || 0,
      };
    } catch (error) {
      console.error('Failed to get stats:', error);
      return {
        balance: 0,
        hashrate: 0,
        uptime: '0h',
        rank: 0,
      };
    }
  }

  /**
   * Get CGT balance
   * @returns {Promise<string>} Balance in smallest units
   */
  async getDemiurgeBalance() {
    if (this.mockMode) {
      return this.balance || '100000000000';
    }

    if (!this.hudAvailable) {
      throw new Error('DemiurgeHUD not available');
    }

    try {
      this.balance = await window.DemiurgeHUD.getCGTBalance();
      return this.balance;
    } catch (error) {
      console.error('Failed to get balance:', error);
      throw error;
    }
  }

  /**
   * Refresh balance from blockchain
   */
  async refreshBalance() {
    try {
      this.balance = await this.getDemiurgeBalance();
    } catch (error) {
      console.warn('Failed to refresh balance:', error);
    }
  }

  /**
   * Get QOR ID
   * @returns {Promise<string>}
   */
  async getQORID() {
    if (this.mockMode) {
      return this.qorId || 'mock_user_123';
    }

    if (!this.hudAvailable) {
      throw new Error('DemiurgeHUD not available');
    }

    try {
      this.qorId = await window.DemiurgeHUD.getQORID();
      return this.qorId;
    } catch (error) {
      console.error('Failed to get QOR ID:', error);
      throw error;
    }
  }

  /**
   * Load game data from API
   * @returns {Promise<Object>}
   */
  async loadGameData() {
    try {
      const token = this.getAuthToken();
      if (!token) {
        return null;
      }

      const response = await fetch('/api/games/data?gameId=killBot-clicker', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn('Failed to load game data:', error);
    }
    return null;
  }

  /**
   * Save game data to API
   * @param {Object} gameState - Game state to save
   * @returns {Promise<boolean>}
   */
  async saveGameData(gameState) {
    try {
      const token = this.getAuthToken();
      if (!token) {
        return false;
      }

      const response = await fetch('/api/games/data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          gameId: 'killBot-clicker',
          ...gameState,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to save game data:', error);
      return false;
    }
  }

  /**
   * Update XP
   * @param {number} xp - XP to add
   * @param {string} source - Source of XP
   */
  updateAccountXP(xp, source = 'killBot-clicker') {
    if (this.mockMode) {
      console.log(`[MOCK] Would award ${xp} XP from ${source}`);
      return;
    }

    if (!this.hudAvailable) {
      return;
    }

    try {
      window.DemiurgeHUD.updateAccountXP(xp, source);
    } catch (error) {
      console.error('Failed to update XP:', error);
    }
  }

  /**
   * Get auth token (if available)
   * @returns {string|null}
   */
  getAuthToken() {
    // Try to get token from cookies or localStorage
    if (typeof document !== 'undefined') {
      const cookies = document.cookie.split(';');
      for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'qor_token' || name === 'access_token') {
          return value;
        }
      }
    }
    return null;
  }

  /**
   * Format uptime from seconds
   * @param {number} seconds - Uptime in seconds
   * @returns {string}
   */
  formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) {
      return `${days}d ${hours}h`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }

  /**
   * Disconnect wallet
   */
  disconnect() {
    this.isWalletConnected = false;
    this.qorId = null;
    this.balance = '0';
    this.assets = [];
    
    if (this.onConnectionChange) {
      this.onConnectionChange(false);
    }
  }
}

// Export for use in game
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BlockchainManager;
}
