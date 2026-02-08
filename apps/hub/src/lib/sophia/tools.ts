/**
 * Sophia AI Tool Definitions
 * Tools that Sophia can use to interact with the Demiurge ecosystem
 */

import { z } from 'zod';

// Tool result types
export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TOOL SCHEMAS - Define parameters for each tool
// ═══════════════════════════════════════════════════════════════════════════════

export const searchDocsSchema = z.object({
  query: z.string().describe('Search query for documentation'),
  category: z.string().optional().describe('Optional category filter: getting-started, developers, sdk, validators, specifications, architecture, deployment, troubleshooting'),
  limit: z.number().optional().default(5).describe('Maximum number of results'),
});

export const getBlockInfoSchema = z.object({
  blockNumber: z.number().optional().describe('Block number to fetch. If not provided, returns latest block'),
});

export const getAccountBalanceSchema = z.object({
  address: z.string().describe('Account address to check balance for'),
});

export const getValidatorInfoSchema = z.object({
  address: z.string().optional().describe('Validator address. If not provided, returns all active validators'),
});

export const getTransactionSchema = z.object({
  hash: z.string().describe('Transaction hash to look up'),
});

export const sendToAgentSchema = z.object({
  agentId: z.string().describe('The ID of the agent to communicate with'),
  message: z.string().describe('Message to send to the agent'),
  action: z.enum(['query', 'command', 'notify']).describe('Type of interaction'),
});

export const getNFTInfoSchema = z.object({
  tokenId: z.string().describe('NFT token ID'),
  collection: z.string().optional().describe('Collection address'),
});

export const getNetworkStatsSchema = z.object({});

// ═══════════════════════════════════════════════════════════════════════════════
// TOOL DEFINITIONS - Describe what each tool does
// ═══════════════════════════════════════════════════════════════════════════════

export const sophiaTools = {
  searchDocs: {
    name: 'searchDocs',
    description: 'Search the Demiurge documentation for guides, references, and specifications. Use this when users ask questions about how to use Demiurge, SDK, validators, or technical details.',
    parameters: searchDocsSchema,
  },
  
  getBlockInfo: {
    name: 'getBlockInfo',
    description: 'Get information about a specific block or the latest block on the Demiurge chain. Includes block hash, transactions, validator, and timestamp.',
    parameters: getBlockInfoSchema,
  },
  
  getAccountBalance: {
    name: 'getAccountBalance',
    description: 'Check the CGT balance and energy allocation for any account address on the Demiurge chain.',
    parameters: getAccountBalanceSchema,
  },
  
  getValidatorInfo: {
    name: 'getValidatorInfo',
    description: 'Get information about validators including their stake, commission, status, and performance metrics.',
    parameters: getValidatorInfoSchema,
  },
  
  getTransaction: {
    name: 'getTransaction',
    description: 'Look up a transaction by its hash. Returns transaction details, status, and block inclusion.',
    parameters: getTransactionSchema,
  },
  
  sendToAgent: {
    name: 'sendToAgent',
    description: 'Communicate with a registered AI agent on the Demiurge network. Use this to delegate tasks or query specialized agents.',
    parameters: sendToAgentSchema,
  },
  
  getNFTInfo: {
    name: 'getNFTInfo',
    description: 'Get information about a DRC-369 NFT including metadata, physics properties, composability data, and ownership.',
    parameters: getNFTInfoSchema,
  },
  
  getNetworkStats: {
    name: 'getNetworkStats',
    description: 'Get current network statistics including TPS, active validators, total staked, and network health.',
    parameters: getNetworkStatsSchema,
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// TOOL HANDLERS - Execute the tools
// ═══════════════════════════════════════════════════════════════════════════════

import { searchDocs as searchDocsIndex, docsIndex } from '@/lib/docs';

export async function executeSearchDocs(params: z.infer<typeof searchDocsSchema>): Promise<ToolResult> {
  try {
    let results = searchDocsIndex(params.query);
    
    if (params.category) {
      results = results.filter(r => 
        r.category.toLowerCase().includes(params.category!.toLowerCase())
      );
    }
    
    results = results.slice(0, params.limit || 5);
    
    return {
      success: true,
      data: {
        count: results.length,
        results: results.map(r => ({
          title: r.title,
          description: r.description,
          category: r.category,
          url: r.href,
        })),
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function executeGetBlockInfo(
  params: z.infer<typeof getBlockInfoSchema>,
  rpcEndpoint: string
): Promise<ToolResult> {
  try {
    const method = params.blockNumber 
      ? 'chain_getBlockByNumber' 
      : 'chain_getLatestBlock';
    
    const rpcParams = params.blockNumber ? [params.blockNumber] : [];
    
    const response = await fetch(rpcEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method,
        params: rpcParams,
      }),
    });
    
    const data = await response.json();
    
    if (data.error) {
      return { success: false, error: data.error.message };
    }
    
    return {
      success: true,
      data: {
        blockNumber: data.result?.number,
        hash: data.result?.hash,
        timestamp: data.result?.timestamp,
        validator: data.result?.author,
        transactions: data.result?.transactions?.length || 0,
        parentHash: data.result?.parentHash,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function executeGetAccountBalance(
  params: z.infer<typeof getAccountBalanceSchema>,
  rpcEndpoint: string
): Promise<ToolResult> {
  try {
    const response = await fetch(rpcEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'chain_getBalance',
        params: [params.address],
      }),
    });
    
    const data = await response.json();
    
    if (data.error) {
      return { success: false, error: data.error.message };
    }
    
    // Also get energy info
    const energyResponse = await fetch(rpcEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 2,
        method: 'energy_getEnergy',
        params: [params.address],
      }),
    });
    
    const energyData = await energyResponse.json();
    
    return {
      success: true,
      data: {
        address: params.address,
        balance: {
          free: data.result?.free,
          reserved: data.result?.reserved,
          total: data.result?.total,
        },
        energy: energyData.result || null,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function executeGetValidatorInfo(
  params: z.infer<typeof getValidatorInfoSchema>,
  rpcEndpoint: string
): Promise<ToolResult> {
  try {
    const method = params.address 
      ? 'consensus_getValidator'
      : 'consensus_getActiveValidators';
    
    const rpcParams = params.address ? [params.address] : [];
    
    const response = await fetch(rpcEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method,
        params: rpcParams,
      }),
    });
    
    const data = await response.json();
    
    if (data.error) {
      return { success: false, error: data.error.message };
    }
    
    return {
      success: true,
      data: data.result,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function executeGetTransaction(
  params: z.infer<typeof getTransactionSchema>,
  rpcEndpoint: string
): Promise<ToolResult> {
  try {
    const response = await fetch(rpcEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'chain_getTransaction',
        params: [params.hash],
      }),
    });
    
    const data = await response.json();
    
    if (data.error) {
      return { success: false, error: data.error.message };
    }
    
    return {
      success: true,
      data: data.result,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function executeSendToAgent(
  params: z.infer<typeof sendToAgentSchema>,
  baseUrl: string = ''
): Promise<ToolResult> {
  try {
    // Use local agent registry
    const { getAgent, sendMessage, createConversation, simulateAgentResponse } = await import('@/lib/agents');
    
    // Look up agent
    const agent = getAgent(params.agentId);
    
    if (!agent) {
      return { success: false, error: `Agent ${params.agentId} not found` };
    }
    
    if (agent.status === 'offline') {
      return { success: false, error: `Agent ${params.agentId} is currently offline` };
    }
    
    // Create conversation and send message
    const conversation = createConversation(['sophia', params.agentId]);
    
    const result = sendMessage({
      conversationId: conversation.id,
      from: 'sophia',
      to: params.agentId,
      action: params.action,
      priority: 'normal',
      content: {
        text: params.message,
      },
    });
    
    if (!result.success || !result.message) {
      return { success: false, error: result.error?.message || 'Failed to send message' };
    }
    
    // Get simulated response from agent
    const response = await simulateAgentResponse(result.message);
    
    return {
      success: true,
      data: {
        agentId: params.agentId,
        agentName: agent.name,
        agentDescription: agent.description,
        messageSent: params.message,
        response: response?.content.text || 'Agent did not respond',
        conversationId: conversation.id,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function executeGetNFTInfo(
  params: z.infer<typeof getNFTInfoSchema>,
  rpcEndpoint: string
): Promise<ToolResult> {
  try {
    const response = await fetch(rpcEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'drc369_getNFT',
        params: [params.tokenId, params.collection],
      }),
    });
    
    const data = await response.json();
    
    if (data.error) {
      return { success: false, error: data.error.message };
    }
    
    return {
      success: true,
      data: data.result,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function executeGetNetworkStats(
  rpcEndpoint: string
): Promise<ToolResult> {
  try {
    const response = await fetch(rpcEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'system_health',
        params: [],
      }),
    });
    
    const data = await response.json();
    
    if (data.error) {
      return { success: false, error: data.error.message };
    }
    
    return {
      success: true,
      data: {
        connected: data.result?.peers > 0,
        peers: data.result?.peers,
        syncing: data.result?.isSyncing,
        shouldHavePeers: data.result?.shouldHavePeers,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
