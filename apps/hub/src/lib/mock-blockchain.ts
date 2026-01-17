/**
 * Mock Blockchain Service
 * 
 * Provides mock blockchain responses for testing and development
 * when the blockchain node is not available.
 * 
 * This service implements the same interface as the real blockchain client
 * but returns mock data, allowing frontend development to continue.
 */

import { blockchainClient } from './blockchain';

export interface MockTransaction {
  hash: string;
  from: string;
  to: string;
  amount: string;
  blockNumber: number;
  timestamp: number;
  type: 'transfer' | 'reward' | 'spend';
  reason?: string;
}

export interface MockBalance {
  address: string;
  balance: string;
  formatted: string;
}

/**
 * Mock blockchain service for testing
 */
export class MockBlockchainService {
  private mockBalances: Map<string, string> = new Map();
  private mockTransactions: Map<string, MockTransaction[]> = new Map();
  private mockConnected: boolean = true;

  constructor() {
    // Initialize with some mock data
    this.initializeMockData();
  }

  /**
   * Initialize mock data for testing
   */
  private initializeMockData() {
    // Add some sample transactions
    const sampleAddress = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';
    const mockTxs: MockTransaction[] = [
      {
        hash: '0x1234567890abcdef',
        from: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
        to: sampleAddress,
        amount: '10000', // 100 CGT (10000 Sparks)
        blockNumber: 1000,
        timestamp: Date.now() - 86400000, // 1 day ago
        type: 'reward',
        reason: 'Game reward: Galaga Creator'
      },
      {
        hash: '0xabcdef1234567890',
        from: sampleAddress,
        to: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
        amount: '5000', // 50 CGT
        blockNumber: 950,
        timestamp: Date.now() - 172800000, // 2 days ago
        type: 'transfer'
      },
      {
        hash: '0x9876543210fedcba',
        from: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
        to: sampleAddress,
        amount: '25000', // 250 CGT
        blockNumber: 800,
        timestamp: Date.now() - 259200000, // 3 days ago
        type: 'reward',
        reason: 'Game reward: KillBot Clicker'
      }
    ];
    
    this.mockTransactions.set(sampleAddress, mockTxs);
    this.mockBalances.set(sampleAddress, '50000'); // 500 CGT
  }

  /**
   * Set mock balance for an address
   */
  setMockBalance(address: string, balance: string) {
    this.mockBalances.set(address, balance);
  }

  /**
   * Add mock transaction
   */
  addMockTransaction(address: string, transaction: MockTransaction) {
    const txs = this.mockTransactions.get(address) || [];
    txs.unshift(transaction); // Add to beginning
    this.mockTransactions.set(address, txs);
  }

  /**
   * Get mock balance for an address
   */
  async getMockBalance(address: string): Promise<string> {
    // Return mock balance or default to 0
    return this.mockBalances.get(address) || '0';
  }

  /**
   * Get mock transaction history
   */
  async getMockTransactions(address: string, limit: number = 50): Promise<MockTransaction[]> {
    const txs = this.mockTransactions.get(address) || [];
    return txs.slice(0, limit);
  }

  /**
   * Format balance using blockchain client formatter
   */
  formatBalance(balance: string): string {
    return blockchainClient.formatCGTBalance(balance);
  }

  /**
   * Check if blockchain is connected (mock)
   */
  isConnected(): boolean {
    return this.mockConnected;
  }

  /**
   * Set connection status (for testing)
   */
  setConnected(connected: boolean) {
    this.mockConnected = connected;
  }

  /**
   * Simulate a transfer (for testing)
   */
  async simulateTransfer(
    fromAddress: string,
    toAddress: string,
    amount: string
  ): Promise<string> {
    // Update balances
    const fromBalance = BigInt(this.mockBalances.get(fromAddress) || '0');
    const toBalance = BigInt(this.mockBalances.get(toAddress) || '0');
    const amountBigInt = BigInt(amount);

    if (fromBalance < amountBigInt) {
      throw new Error('Insufficient balance');
    }

    this.mockBalances.set(fromAddress, (fromBalance - amountBigInt).toString());
    this.mockBalances.set(toAddress, (toBalance + amountBigInt).toString());

    // Add transaction
    const tx: MockTransaction = {
      hash: `0x${Math.random().toString(16).substring(2)}`,
      from: fromAddress,
      to: toAddress,
      amount,
      blockNumber: 1000 + Math.floor(Math.random() * 100),
      timestamp: Date.now(),
      type: 'transfer'
    };

    this.addMockTransaction(fromAddress, tx);
    this.addMockTransaction(toAddress, tx);

    return tx.hash;
  }
}

// Export singleton instance
export const mockBlockchain = new MockBlockchainService();

/**
 * Check if we should use mock blockchain
 * 
 * Uses mock when:
 * - Blockchain client is not connected
 * - Environment variable is set
 * - In development mode
 */
export function shouldUseMockBlockchain(): boolean {
  // Check environment variable
  if (process.env.NEXT_PUBLIC_USE_MOCK_BLOCKCHAIN === 'true') {
    return true;
  }

  // Check if blockchain client is connected
  if (blockchainClient.isConnected()) {
    return false;
  }

  // In development, use mock if blockchain is not available
  if (process.env.NODE_ENV === 'development') {
    return true;
  }

  return false;
}

/**
 * Get balance (real or mock)
 */
export async function getBalance(address: string): Promise<string> {
  if (shouldUseMockBlockchain()) {
    return mockBlockchain.getMockBalance(address);
  }

  try {
    return await blockchainClient.getCGTBalance(address);
  } catch (error) {
    console.warn('Failed to get real balance, using mock:', error);
    return mockBlockchain.getMockBalance(address);
  }
}

/**
 * Get transaction history (real or mock)
 */
export async function getTransactions(address: string, limit: number = 50): Promise<MockTransaction[]> {
  if (shouldUseMockBlockchain()) {
    return mockBlockchain.getMockTransactions(address, limit);
  }

  try {
    const realTxs = await blockchainClient.getTransactions(address);
    // Convert to MockTransaction format
    return realTxs.map(tx => ({
      hash: tx.hash,
      from: tx.from,
      to: tx.to,
      amount: tx.amount,
      blockNumber: tx.blockNumber,
      timestamp: Date.now() - (1000 - tx.blockNumber) * 6000, // Estimate timestamp
      type: 'transfer' as const
    }));
  } catch (error) {
    console.warn('Failed to get real transactions, using mock:', error);
    return mockBlockchain.getMockTransactions(address, limit);
  }
}
