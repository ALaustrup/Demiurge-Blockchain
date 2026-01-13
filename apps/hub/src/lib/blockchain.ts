/**
 * Blockchain Integration Client
 * 
 * Connects to the Demiurge Substrate node for CGT and DRC-369 operations
 */

import { ApiPromise, WsProvider } from '@polkadot/api';
import { Keyring } from '@polkadot/keyring';
import { KeyringPair } from '@polkadot/keyring/types';

// Default to production Monad server, fallback to localhost for development
const DEFAULT_WS_URL = process.env.NEXT_PUBLIC_BLOCKCHAIN_WS_URL || 
  (typeof window !== 'undefined' && window.location.hostname === 'demiurge.cloud' 
    ? 'ws://51.210.209.112:9944' 
    : 'ws://localhost:9944');

export class BlockchainClient {
  private api: ApiPromise | null = null;
  private keyring: Keyring;
  private wsUrl: string;

  constructor(wsUrl: string = DEFAULT_WS_URL) {
    this.wsUrl = wsUrl;
    this.keyring = new Keyring({ type: 'sr25519' });
  }

  /**
   * Connect to the blockchain node
   */
  async connect(): Promise<void> {
    if (this.api) {
      return; // Already connected
    }

    const provider = new WsProvider(this.wsUrl);
    this.api = await ApiPromise.create({ provider });
    
    console.log('Connected to Demiurge blockchain');
  }

  /**
   * Get CGT balance for an account
   */
  async getCGTBalance(address: string): Promise<string> {
    if (!this.api) {
      await this.connect();
    }

    try {
      // Query balance from pallet-cgt
      // The pallet-cgt stores balances as AccountData with free balance
      const accountData = await this.api!.query.cgt.account(address);
      
      // Parse the account data (assuming it's a struct with 'free' field)
      // Format: { free: Balance } where Balance is u128 with 8 decimals
      if (accountData && typeof accountData === 'object' && 'free' in accountData) {
        const free = (accountData as any).free;
        return free.toString();
      }
      
      // Fallback: try to parse as direct balance
      return accountData.toString() || '0';
    } catch (error) {
      console.error('Failed to query CGT balance:', error);
      // If pallet doesn't exist or query fails, return 0
      return '0';
    }
  }

  /**
   * Transfer CGT tokens
   */
  async transferCGT(
    fromPair: KeyringPair,
    toAddress: string,
    amount: string
  ): Promise<string> {
    if (!this.api) {
      await this.connect();
    }

    try {
      // Build transfer extrinsic
      const transfer = this.api!.tx.cgt.transfer(toAddress, amount);
      
      // Sign and submit
      const hash = await transfer.signAndSend(fromPair);
      
      return hash.toString();
    } catch (error) {
      console.error('Failed to transfer CGT:', error);
      throw error;
    }
  }

  /**
   * Get user's DRC-369 assets
   */
  async getUserAssets(address: string): Promise<any[]> {
    if (!this.api) {
      await this.connect();
    }

    try {
      // Query owner_items from pallet-drc369
      // Returns a BTreeMap or Vec of asset UUIDs
      const items = await this.api!.query.drc369.ownerItems(address);
      
      // Convert to array format
      const assets: any[] = [];
      
      if (items && typeof items === 'object') {
        // Handle different response formats
        if (Array.isArray(items)) {
          items.forEach((item: any, index: number) => {
            assets.push({
              uuid: item?.toString() || index.toString(),
              // TODO: Fetch full metadata from pallet-drc369
            });
          });
        } else if ('toHuman' in items) {
          // Convert to human-readable format
          const human = items.toHuman();
          if (Array.isArray(human)) {
            human.forEach((item: any, index: number) => {
              assets.push({
                uuid: item?.toString() || index.toString(),
              });
            });
          }
        }
      }
      
      return assets;
    } catch (error) {
      console.error('Failed to query user assets:', error);
      return [];
    }
  }

  /**
   * Disconnect from node
   */
  async disconnect(): Promise<void> {
    if (this.api) {
      await this.api.disconnect();
      this.api = null;
    }
  }
}

// Export singleton instance
export const blockchainClient = new BlockchainClient();
