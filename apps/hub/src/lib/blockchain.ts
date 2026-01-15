/**
 * Blockchain Integration Client
 * 
 * Connects to the Demiurge Substrate node for CGT and DRC-369 operations
 */

import { ApiPromise, WsProvider } from '@polkadot/api';
import { Keyring } from '@polkadot/keyring';
import { KeyringPair } from '@polkadot/keyring/types';

// Suppress WebSocket disconnection errors - they're expected when node is offline
// Initialize error suppression only in browser environment
let errorSuppressionInitialized = false;

function initializeErrorSuppression() {
  if (errorSuppressionInitialized) {
    return;
  }
  if (typeof window === 'undefined') {
    return;
  }
  if (typeof console === 'undefined' || !console.error) {
    return;
  }

  try {
    const originalConsoleError = console.error.bind(console);
    console.error = function(...args: any[]) {
      // Convert all args to string for checking
      let message = '';
      for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (typeof arg === 'string') {
          message += arg + ' ';
        } else if (typeof arg === 'object' && arg !== null) {
          try {
            message += JSON.stringify(arg) + ' ';
          } catch {
            message += String(arg) + ' ';
          }
        } else {
          message += String(arg) + ' ';
        }
      }
      
      // Suppress expected disconnection errors from Polkadot API-WS
      if (message.includes('API-WS') && 
          message.includes('disconnected') && 
          (message.includes('1006') || message.includes('Abnormal Closure'))) {
        return; // Silently ignore expected disconnection errors
      }
      
      originalConsoleError.apply(console, args);
    };
    errorSuppressionInitialized = true;
  } catch (error) {
    // Silently fail if we can't intercept console.error
  }
}

// Initialize on module load if in browser
if (typeof window !== 'undefined') {
  initializeErrorSuppression();
}

// Default to production Monad server, fallback to localhost for development
function getDefaultWsUrl(): string {
  if (process.env.NEXT_PUBLIC_BLOCKCHAIN_WS_URL) {
    return process.env.NEXT_PUBLIC_BLOCKCHAIN_WS_URL;
  }
  if (typeof window !== 'undefined' && window.location && window.location.hostname === 'demiurge.cloud') {
    return 'ws://51.210.209.112:9944';
  }
  return 'ws://localhost:9944';
}

const DEFAULT_WS_URL = getDefaultWsUrl();

export class BlockchainClient {
  private api: ApiPromise | null = null;
  private keyring: Keyring;
  private wsUrl: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second

  constructor(wsUrl: string = DEFAULT_WS_URL) {
    this.wsUrl = wsUrl;
    this.keyring = new Keyring({ type: 'sr25519' });
  }

  /**
   * Connect to the blockchain node with retry logic
   */
  async connect(): Promise<void> {
    if (this.api && this.api.isConnected) {
      return; // Already connected
    }

    // Reset API if disconnected
    if (this.api && !this.api.isConnected) {
      try {
        await this.api.disconnect();
      } catch {
        // Ignore disconnect errors
      }
      this.api = null;
    }

    try {
      const provider = new WsProvider(this.wsUrl);
      
      // Set up error handlers to suppress expected errors
      provider.on('error', (error: Error) => {
        // Suppress expected connection errors
        if (error.message?.includes('1006') || error.message?.includes('Abnormal Closure')) {
          return;
        }
      });

      provider.on('disconnected', () => {
        // Silently handle disconnections
        this.api = null;
      });

      this.api = await ApiPromise.create({ provider });
      
      // Reset reconnect attempts on successful connection
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;
      
      console.log('Connected to Demiurge blockchain');
    } catch (error: any) {
      // Suppress WebSocket connection errors - they're expected if the node isn't running
      // Only log if it's not a connection error
      if (!error.message?.includes('disconnected') && !error.message?.includes('1006')) {
        console.warn('Blockchain connection warning:', error.message);
      }
      
      // Don't throw - allow the app to work without blockchain connection
      this.api = null;
    }
  }

  /**
   * Get CGT balance for an account
   * 
   * CGT uses pallet-balances for storage, so we query the balances pallet.
   * Balance is stored as u128 with 8 decimals (CGT_UNIT = 100_000_000).
   */
  async getCGTBalance(address: string): Promise<string> {
    if (!this.api) {
      await this.connect();
    }

    try {
      // Convert address to AccountId format
      const accountId = this.api!.createType('AccountId32', address);
      
      // Query balance from system account (pallet-balances stores balances here)
      // Format: { data: { free: Balance, reserved: Balance, ... }, ... }
      const accountInfo = await this.api!.query.system.account(accountId);
      
      // Type assertion: accountInfo is AccountInfo which has data property
      const accountInfoTyped = accountInfo as any;
      if (accountInfoTyped && accountInfoTyped.data && accountInfoTyped.data.free) {
        // Extract free balance (available CGT)
        const freeBalance = accountInfoTyped.data.free.toString();
        return freeBalance;
      }
      
      return '0';
    } catch (error) {
      console.error('Failed to query CGT balance:', error);
      // Return 0 on error (account might not exist or node not connected)
      return '0';
    }
  }

  /**
   * Format CGT balance for display (with 8 decimals)
   * 
   * @param balance Raw balance string (in smallest units, e.g., "100000000" = 1 CGT)
   * @returns Formatted balance string (e.g., "1.00000000")
   */
  formatCGTBalance(balance: string): string {
    const CGT_UNIT = 100_000_000; // 10^8
    const balanceNum = BigInt(balance);
    const whole = balanceNum / BigInt(CGT_UNIT);
    const fractional = balanceNum % BigInt(CGT_UNIT);
    
    // Format fractional part with leading zeros
    const fractionalStr = fractional.toString().padStart(8, '0');
    
    return `${whole}.${fractionalStr}`;
  }

  /**
   * Transfer CGT tokens
   * 
   * @param fromPair Keyring pair of sender (must be unlocked)
   * @param toAddress Destination account address
   * @param amount Amount in smallest units (e.g., "100000000" = 1 CGT)
   * @returns Transaction hash
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
      // Convert amount to Compact<Balance>
      const amountCompact = this.api!.createType('Compact<Balance>', amount);
      
      // Convert toAddress to AccountId
      const toAccountId = this.api!.createType('AccountId32', toAddress);
      
      // Build transfer extrinsic using pallet-cgt
      // Note: pallet-cgt uses pallet-balances internally, but we call cgt.transfer
      // to ensure fees are properly handled (80% burn, 20% treasury)
      const transfer = this.api!.tx.cgt.transfer(toAccountId, amountCompact);
      
      // Sign and submit transaction
      return new Promise((resolve, reject) => {
        transfer.signAndSend(fromPair, ({ status, txHash }) => {
          if (status.isInBlock || status.isFinalized) {
            resolve(txHash.toString());
          } else if ((status as any).isError) {
            reject(new Error('Transaction failed'));
          }
        }).catch(reject);
      });
    } catch (error) {
      console.error('Failed to transfer CGT:', error);
      throw error;
    }
  }

  /**
   * Get user's DRC-369 assets
   * 
   * @param address User's account address
   * @returns Array of DRC-369 asset metadata
   */
  async getUserAssets(address: string): Promise<any[]> {
    if (!this.api) {
      await this.connect();
    }

    try {
      // Convert address to AccountId
      const accountId = this.api!.createType('AccountId32', address);
      
      // Query owner_items from pallet-drc369
      // Returns a BTreeMap<AccountId, BTreeSet<Uuid>> or similar structure
      const ownerItems = await this.api!.query.drc369.ownerItems(accountId);
      
      const assets: any[] = [];
      
      if (ownerItems) {
        // Convert to human-readable format for easier parsing
        const human = ownerItems.toHuman();
        
        if (Array.isArray(human)) {
          // If it's an array of UUIDs
          human.forEach((uuid: any) => {
            assets.push({
              uuid: uuid?.toString() || uuid,
            });
          });
        } else if (typeof human === 'object' && human !== null) {
          // If it's an object/map, extract values
          Object.values(human).forEach((uuid: any) => {
            assets.push({
              uuid: uuid?.toString() || uuid,
            });
          });
        }
        
        // Fetch full metadata for each asset
        // TODO: Query pallet-drc369.assets(uuid) for each asset
        // For now, return UUIDs only
      }
      
      return assets;
    } catch (error) {
      console.error('Failed to query user assets:', error);
      return [];
    }
  }

  /**
   * Get full metadata for a DRC-369 asset
   * 
   * @param uuid Asset UUID (32-byte hash as hex string)
   * @returns Full asset metadata including state, resources, and nesting info
   */
  async getAssetMetadata(uuid: string): Promise<any> {
    if (!this.api) {
      await this.connect();
    }

    try {
      // Query asset metadata from pallet-drc369
      const assetData = await this.api!.query.drc369.assets(uuid);
      
      if (!assetData || assetData.isEmpty) {
        throw new Error(`Asset ${uuid} not found`);
      }

      // Convert to human-readable format
      const asset = assetData.toHuman();
      
      // Format the response
      return {
        uuid: uuid,
        name: asset?.name || 'Unknown',
        creatorQorId: asset?.creator_qor_id || '',
        creatorAccount: asset?.creator_account || '',
        owner: asset?.owner || '',
        assetType: 'virtual', // Can be determined from metadata
        xpLevel: asset?.level || 0,
        experiencePoints: asset?.experience_points || 0,
        durability: asset?.durability || 100,
        killCount: asset?.kill_count || 0,
        classId: asset?.class_id || 0,
        isSoulbound: asset?.is_soulbound || false,
        royaltyFeePercent: asset?.royalty_fee_percent || 0,
        mintedAt: asset?.minted_at || 0,
        metadata: {
          description: asset?.description || '',
          image: asset?.image || '',
          attributes: asset?.attributes || {},
          resources: asset?.resources || [],
          parentUuid: asset?.parent_uuid || null,
          childrenUuids: asset?.children_uuids || [],
          equipmentSlots: asset?.equipment_slots || [],
          delegation: asset?.delegation || null,
          customState: asset?.custom_state || {}
        }
      };
    } catch (error) {
      console.error('Failed to query asset metadata:', error);
      throw error;
    }
  }

  /**
   * Mint avatar as DRC-369 NFT asset
   * 
   * @param fromPair Keyring pair of the creator
   * @param qorId User's QOR ID (e.g., "username#0001")
   * @param avatarUrl URL/IPFS hash of the avatar image
   * @param imageData Base64 or URL of the image (for metadata)
   * @returns Transaction hash
   */
  async mintAvatarAsset(
    fromPair: KeyringPair,
    qorId: string,
    avatarUrl: string,
    imageData?: string
  ): Promise<string> {
    if (!this.api) {
      await this.connect();
    }

    try {
      // Prepare DRC-369 metadata
      // For avatars, we use a special UE5 asset path that represents a 2D image
      // The avatar will be soulbound (is_soulbound = true) and have 0% royalty
      const name = `${qorId} Avatar`;
      const creatorQorId = qorId;
      
      // Use a placeholder UE5 asset path for 2D avatars
      // In the future, this could be a 3D representation of the avatar
      const ue5AssetPath = `Texture2D'/Game/UI/Avatars/${qorId.replace('#', '_')}_Avatar'`;
      const glassMaterial = `MaterialInstance'/Game/Glass/MI_Avatar.MI_Avatar'`;
      const vfxSocket = '';
      const isSoulbound = true; // Avatars are soulbound to the user
      const royaltyFeePercent = 0; // No royalties on avatars

      // Convert strings to Vec<u8>
      const nameBytes = Array.from(new TextEncoder().encode(name));
      const qorIdBytes = Array.from(new TextEncoder().encode(creatorQorId));
      const ue5PathBytes = Array.from(new TextEncoder().encode(ue5AssetPath));
      const glassMatBytes = Array.from(new TextEncoder().encode(glassMaterial));
      const vfxBytes = Array.from(new TextEncoder().encode(vfxSocket));

      // Build mint_item extrinsic
      const mintExtrinsic = this.api!.tx.drc369.mintItem(
        nameBytes,
        qorIdBytes,
        ue5PathBytes,
        glassMatBytes,
        vfxBytes,
        isSoulbound,
        royaltyFeePercent
      );

      // Sign and submit transaction
      return new Promise((resolve, reject) => {
        mintExtrinsic.signAndSend(fromPair, ({ status, txHash }) => {
          if (status.isInBlock || status.isFinalized) {
            resolve(txHash.toString());
          } else if ((status as any).isError) {
            reject(new Error('Transaction failed'));
          }
        }).catch(reject);
      });
    } catch (error) {
      console.error('Failed to mint avatar asset:', error);
      throw error;
    }
  }

  /**
   * Get connection status
   */
  isConnected(): boolean {
    return this.api !== null && this.api.isConnected;
  }

  /**
   * Get API instance (for advanced operations)
   */
  getApi(): ApiPromise | null {
    return this.api;
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
