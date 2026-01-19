/**
 * Demiurge Custom Blockchain RPC Client
 * 
 * Connects to the Demiurge custom blockchain node via JSON-RPC 2.0
 * Replaces Polkadot API for our custom consensus engine
 */

export interface RpcRequest {
  jsonrpc: '2.0';
  id: number | string;
  method: string;
  params?: any[];
}

export interface RpcResponse<T = any> {
  jsonrpc: '2.0';
  id: number | string;
  result?: T;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

export interface BlockInfo {
  hash: string;
  number: number;
  parentHash: string;
  stateRoot: string;
  extrinsicsRoot: string;
  timestamp: number;
  transactions: TransactionInfo[];
}

export interface TransactionInfo {
  hash: string;
  from: string;
  to?: string;
  amount?: string;
  nonce: number;
  status: 'pending' | 'inBlock' | 'finalized' | 'failed';
}

export interface ValidatorInfo {
  account: string;
  stake: string;
  commission: number;
  active: boolean;
  publicKey: string;
}

export interface StakingPoolInfo {
  validator: string;
  totalStake: string;
  nominators: Array<{
    account: string;
    stake: string;
    era: number;
  }>;
  commission: number;
}

export interface EraInfo {
  era: number;
  blockNumber: number;
  totalRewards: string;
  transactionFees: string;
  validators: ValidatorInfo[];
}

export interface EnergyInfo {
  current: number;
  max: number;
  regenerationRate: number;
  lastUpdate: number;
}

export interface ConsensusStatus {
  currentEra: number;
  blockNumber: number;
  validators: number;
  totalStake: string;
  transactionFees: string;
}

export class DemiurgeRpcClient {
  private rpcUrl: string;
  private requestId = 0;

  constructor(rpcUrl: string = 'http://localhost:9933') {
    this.rpcUrl = rpcUrl;
  }

  /**
   * Make JSON-RPC request
   */
  private async request<T>(method: string, params?: any[]): Promise<T> {
    const id = ++this.requestId;
    const request: RpcRequest = {
      jsonrpc: '2.0',
      id,
      method,
      params: params || [],
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(this.rpcUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: RpcResponse<T> = await response.json();

      if (data.error) {
        throw new Error(`RPC error: ${data.error.message} (code: ${data.error.code})`);
      }

      return data.result as T;
    } catch (error: any) {
      // Handle network errors gracefully (blockchain may not be running)
      const isNetworkError = 
        error.name === 'AbortError' || 
        error.message?.includes('fetch') || 
        error.message?.includes('Failed to fetch') ||
        error.message?.includes('NetworkError') ||
        error.code === 'ERR_NETWORK';

      if (isNetworkError) {
        // Create a custom error that components can check for
        // Don't log network errors - they're expected when blockchain is offline
        const networkError = new Error('Blockchain RPC unavailable');
        (networkError as any).isNetworkError = true;
        throw networkError;
      }
      
      // For other errors, log and rethrow
      console.error(`RPC request failed for ${method}:`, error);
      throw error;
    }
  }

  /**
   * Get chain health status
   */
  async getHealth(): Promise<{
    connected: boolean;
    blockNumber: number;
    blockTime: number;
    finality: number;
  }> {
    return this.request('chain_getHealth');
  }

  /**
   * Get latest block number
   */
  async getBlockNumber(): Promise<number> {
    return this.request('chain_getBlockNumber');
  }

  /**
   * Get block by number
   */
  async getBlock(blockNumber: number): Promise<BlockInfo | null> {
    return this.request('chain_getBlock', [blockNumber]);
  }

  /**
   * Get latest block
   */
  async getLatestBlock(): Promise<BlockInfo> {
    return this.request('chain_getLatestBlock');
  }

  /**
   * Get balance for an account
   */
  async getBalance(address: string): Promise<string> {
    return this.request('balances_getBalance', [address]);
  }

  /**
   * Transfer CGT tokens
   */
  async transfer(
    fromAddress: string,
    toAddress: string,
    amount: string,
    signature: string
  ): Promise<string> {
    return this.request('balances_transfer', [fromAddress, toAddress, amount, signature]);
  }

  /**
   * Get energy for an account
   */
  async getEnergy(address: string): Promise<EnergyInfo> {
    return this.request('energy_getEnergy', [address]);
  }

  /**
   * Get current era information
   */
  async getCurrentEra(): Promise<EraInfo> {
    return this.request('consensus_getCurrentEra');
  }

  /**
   * Get validator set
   */
  async getValidators(): Promise<ValidatorInfo[]> {
    return this.request('consensus_getValidators');
  }

  /**
   * Get validator by account
   */
  async getValidator(account: string): Promise<ValidatorInfo | null> {
    return this.request('consensus_getValidator', [account]);
  }

  /**
   * Get staking pool for a validator
   */
  async getStakingPool(validator: string): Promise<StakingPoolInfo | null> {
    return this.request('consensus_getStakingPool', [validator]);
  }

  /**
   * Nominate a validator
   */
  async nominateValidator(
    nominator: string,
    validator: string,
    amount: string,
    signature: string
  ): Promise<string> {
    return this.request('consensus_nominateValidator', [nominator, validator, amount, signature]);
  }

  /**
   * Get active session keys for an account
   */
  async getSessionKeys(account: string): Promise<Array<{
    sessionKey: string;
    expiryBlock: number;
  }>> {
    return this.request('sessionKeys_getActiveKeys', [account]);
  }

  /**
   * Authorize a session key
   */
  async authorizeSessionKey(
    primaryAccount: string,
    sessionKey: string,
    duration: number,
    signature: string
  ): Promise<string> {
    return this.request('sessionKeys_authorize', [primaryAccount, sessionKey, duration, signature]);
  }

  /**
   * Get transaction by hash
   */
  async getTransaction(hash: string): Promise<TransactionInfo | null> {
    return this.request('chain_getTransaction', [hash]);
  }

  /**
   * Get transaction history for an account
   */
  async getTransactionHistory(address: string, limit: number = 50): Promise<TransactionInfo[]> {
    return this.request('chain_getTransactionHistory', [address, limit]);
  }

  /**
   * Submit a signed transaction
   */
  async submitTransaction(
    transaction: {
      from: string;
      to?: string;
      amount?: string;
      nonce: number;
      data?: any;
      signature: string;
    }
  ): Promise<string> {
    return this.request('chain_submitTransaction', [transaction]);
  }

  /**
   * Get consensus status
   */
  async getConsensusStatus(): Promise<ConsensusStatus> {
    return this.request('consensus_getStatus');
  }
}

// Export singleton instance
export const demiurgeRpc = new DemiurgeRpcClient(
  process.env.NEXT_PUBLIC_DEMIURGE_RPC_URL || 'http://localhost:9933'
);
