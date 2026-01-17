/**
 * Blockchain Integration Module for Galaga Creator
 * 
 * Handles CGT transactions, game data storage, and blockchain interactions
 */

export class BlockchainIntegration {
    constructor() {
        this.apiBase = '/api';
        this.pendingRewards = [];
        this.rewardQueue = [];
        this.isProcessingRewards = false;
    }

    /**
     * Initialize blockchain integration
     */
    async init() {
        try {
            // Check if HUD is available
            if (typeof window.DemiurgeHUD === 'undefined') {
                console.warn('DemiurgeHUD not available - running in standalone mode');
                return false;
            }

            // Load initial CGT balance
            await this.loadBalance();
            
            // Load saved game data
            await this.loadGameData();

            console.log('Blockchain integration initialized');
            return true;
        } catch (error) {
            console.error('Failed to initialize blockchain integration:', error);
            return false;
        }
    }

    /**
     * Load CGT balance from blockchain
     */
    async loadBalance() {
        try {
            if (typeof window.DemiurgeHUD !== 'undefined') {
                const balanceStr = await window.DemiurgeHUD.getCGTBalance();
                // Balance is returned as string in smallest units (2 decimals), convert to CGT (100 Sparks = 1 CGT)
                const balanceNum = BigInt(balanceStr);
                const cgtAmount = Number(balanceNum) / 100;
                return cgtAmount;
            }
            return 0;
        } catch (error) {
            console.error('Failed to load balance:', error);
            return 0;
        }
    }

    /**
     * Award CGT to player (on-chain transaction)
     * @param {number} amount - Amount in CGT (will be converted to smallest units)
     * @param {string} reason - Reason for reward (e.g., "enemy_kill", "boss_defeat", "coin_collect")
     */
    async awardCGT(amount, reason) {
        try {
            // Convert CGT to smallest units (2 decimals, 100 Sparks = 1 CGT)
            const amountInSmallestUnits = Math.floor(amount * 100);
            
            if (amountInSmallestUnits <= 0) {
                return null;
            }

            // Add to reward queue (batch rewards to reduce transactions)
            this.rewardQueue.push({
                amount: amount,
                amountInSmallestUnits: amountInSmallestUnits,
                reason: reason,
                timestamp: Date.now(),
            });

            // Process rewards queue (batch every 5 seconds or when queue reaches 10)
            if (this.rewardQueue.length >= 10) {
                await this.processRewardQueue();
            } else if (!this.isProcessingRewards) {
                // Schedule batch processing
                setTimeout(() => this.processRewardQueue(), 5000);
            }

            return true;
        } catch (error) {
            console.error('Failed to award CGT:', error);
            return false;
        }
    }

    /**
     * Process reward queue (batch rewards)
     */
    async processRewardQueue() {
        if (this.isProcessingRewards || this.rewardQueue.length === 0) {
            return;
        }

        this.isProcessingRewards = true;

        try {
            // Sum all rewards
            const totalAmount = this.rewardQueue.reduce((sum, reward) => sum + reward.amount, 0);
            const reasons = this.rewardQueue.map(r => r.reason).join(', ');

            // Submit reward via API (which will create on-chain transaction)
            const response = await fetch(`${this.apiBase}/games/reward`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // TODO: Add Authorization header with JWT token
                },
                body: JSON.stringify({
                    gameId: 'galaga-creator',
                    amount: totalAmount,
                    reason: `Batch rewards: ${reasons}`,
                }),
            });

            if (!response.ok) {
                throw new Error(`Reward API failed: ${response.statusText}`);
            }

            const result = await response.json();
            console.log(`Awarded ${totalAmount} CGT: ${result.txHash}`);

            // Clear queue
            this.rewardQueue = [];
        } catch (error) {
            console.error('Failed to process reward queue:', error);
            // Keep rewards in queue to retry later
        } finally {
            this.isProcessingRewards = false;
        }
    }

    /**
     * Spend CGT (for purchases like skins)
     * @param {number} amount - Amount in CGT
     * @param {string} reason - Reason for spending
     */
    async spendCGT(amount, reason) {
        try {
            if (typeof window.DemiurgeHUD !== 'undefined') {
                // Use HUD API to spend CGT
                const txHash = await window.DemiurgeHUD.spendCGT(amount, reason);
                console.log(`Spent ${amount} CGT: ${txHash}`);
                return txHash;
            } else {
                // Fallback: just deduct from local state
                console.warn('HUD not available, using local state only');
                return null;
            }
        } catch (error) {
            console.error('Failed to spend CGT:', error);
            throw error;
        }
    }

    /**
     * Load game data from API
     */
    async loadGameData() {
        try {
            const response = await fetch(`${this.apiBase}/games/data?gameId=galaga-creator`, {
                headers: {
                    // TODO: Add Authorization header
                },
            });

            if (!response.ok) {
                console.warn('Failed to load game data, using defaults');
                return null;
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Failed to load game data:', error);
            return null;
        }
    }

    /**
     * Save game data to API (will be stored on-chain in future)
     */
    async saveGameData(gameState) {
        try {
            const response = await fetch(`${this.apiBase}/games/data`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // TODO: Add Authorization header
                },
                body: JSON.stringify({
                    gameId: 'galaga-creator',
                    score: gameState.score,
                    highScore: gameState.score, // Will be updated if higher
                    cgtEarned: gameState.cgtBalance,
                    upgrades: gameState.upgrades,
                    ownedSkins: gameState.ownedSkins,
                    equippedSkin: gameState.equippedSkin,
                    killCount: gameState.killCount,
                    playTime: gameState.playTime,
                }),
            });

            if (!response.ok) {
                console.warn('Failed to save game data');
                return false;
            }

            return true;
        } catch (error) {
            console.error('Failed to save game data:', error);
            return false;
        }
    }

    /**
     * Update XP based on game achievements
     */
    updateXP(xp, source = 'galaga-creator') {
        try {
            if (typeof window.DemiurgeHUD !== 'undefined') {
                window.DemiurgeHUD.updateAccountXP(xp, source);
            }
        } catch (error) {
            console.error('Failed to update XP:', error);
        }
    }
}

// Export singleton instance
export const blockchainIntegration = new BlockchainIntegration();
