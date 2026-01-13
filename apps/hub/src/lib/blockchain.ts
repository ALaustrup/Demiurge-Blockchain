/**
 * Blockchain Integration Client
 * 
 * Connects to the Demiurge Substrate node for CGT and DRC-369 operations
 */

import { ApiPromise, WsProvider } from '@polkadot/api';
import { Keyring } from '@polkadot/keyring';
import { KeyringPair } from '@polkadot/keyring/types';

const DEFAULT_WS_URL = process.env.NEXT_PUBLIC_BLOCKCHAIN_WS_URL || 'ws://localhost:9944';

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
      const accountData = await this.api!.query.cgt.account(address);
      // TODO: Parse and format balance (with 8 decimals)
      return accountData.toString();
    } catch (error) {
      console.error('Failed to query CGT balance:', error);
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
      const items = await this.api!.query.drc369.ownerItems(address);
      // TODO: Fetch metadata for each item
      return [];
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
