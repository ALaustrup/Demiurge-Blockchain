/**
 * Sophia Chat API Route (Enhanced)
 * 
 * Features:
 * - Streaming responses using Vercel AI SDK patterns
 * - Tool calling for blockchain queries, docs search, and agent communication
 * - Multi-provider support (Grok > Claude > GPT)
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  SOPHIA_FULL_SYSTEM_PROMPT,
  SOPHIA_ERROR_MESSAGE,
  executeSearchDocs,
  executeGetBlockInfo,
  executeGetAccountBalance,
  executeGetValidatorInfo,
  executeGetTransaction,
  executeGetNFTInfo,
  executeGetNetworkStats,
  executeSendToAgent,
} from '@/lib/sophia';

// RPC endpoint for blockchain queries
const RPC_ENDPOINT = process.env.NEXT_PUBLIC_RPC_URL || 'http://localhost:9944';
const AGENT_REGISTRY_URL = process.env.AGENT_REGISTRY_URL || 'http://localhost:8080';

// Tool definitions for LLM
const TOOL_DEFINITIONS = [
  {
    type: 'function',
    function: {
      name: 'searchDocs',
      description: 'Search Demiurge documentation for guides, references, and specifications',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query' },
          category: { type: 'string', description: 'Optional category filter' },
          limit: { type: 'number', description: 'Max results', default: 5 },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getBlockInfo',
      description: 'Get blockchain block information',
      parameters: {
        type: 'object',
        properties: {
          blockNumber: { type: 'number', description: 'Block number (optional, defaults to latest)' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getAccountBalance',
      description: 'Check CGT balance for an address',
      parameters: {
        type: 'object',
        properties: {
          address: { type: 'string', description: 'Account address' },
        },
        required: ['address'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getValidatorInfo',
      description: 'Get validator information',
      parameters: {
        type: 'object',
        properties: {
          address: { type: 'string', description: 'Validator address (optional for all validators)' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getTransaction',
      description: 'Look up a transaction by hash',
      parameters: {
        type: 'object',
        properties: {
          hash: { type: 'string', description: 'Transaction hash' },
        },
        required: ['hash'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getNFTInfo',
      description: 'Get DRC-369 NFT information',
      parameters: {
        type: 'object',
        properties: {
          tokenId: { type: 'string', description: 'NFT token ID' },
          collection: { type: 'string', description: 'Collection address' },
        },
        required: ['tokenId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getNetworkStats',
      description: 'Get current network statistics',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'sendToAgent',
      description: 'Send a message to another AI agent',
      parameters: {
        type: 'object',
        properties: {
          agentId: { type: 'string', description: 'Agent ID' },
          message: { type: 'string', description: 'Message to send' },
          action: { type: 'string', enum: ['query', 'command', 'notify'], description: 'Type of interaction' },
        },
        required: ['agentId', 'message', 'action'],
      },
    },
  },
];

// Execute a tool call
async function executeTool(name: string, args: any): Promise<any> {
  switch (name) {
    case 'searchDocs':
      return executeSearchDocs(args);
    case 'getBlockInfo':
      return executeGetBlockInfo(args, RPC_ENDPOINT);
    case 'getAccountBalance':
      return executeGetAccountBalance(args, RPC_ENDPOINT);
    case 'getValidatorInfo':
      return executeGetValidatorInfo(args, RPC_ENDPOINT);
    case 'getTransaction':
      return executeGetTransaction(args, RPC_ENDPOINT);
    case 'getNFTInfo':
      return executeGetNFTInfo(args, RPC_ENDPOINT);
    case 'getNetworkStats':
      return executeGetNetworkStats(RPC_ENDPOINT);
    case 'sendToAgent':
      return executeSendToAgent(args, AGENT_REGISTRY_URL);
    default:
      return { success: false, error: `Unknown tool: ${name}` };
  }
}

// Process tool calls and get responses
async function processToolCalls(toolCalls: any[]): Promise<any[]> {
  const results = await Promise.all(
    toolCalls.map(async (call: any) => {
      const result = await executeTool(call.function.name, JSON.parse(call.function.arguments || '{}'));
      return {
        tool_call_id: call.id,
        role: 'tool',
        content: JSON.stringify(result),
      };
    })
  );
  return results;
}

// Call LLM with provider fallback
async function callLLM(
  messages: any[],
  systemPrompt: string,
  enableTools: boolean = true,
  maxTokens: number = 2048,
  temperature: number = 0.7
): Promise<{ text?: string; toolCalls?: any[]; error?: string }> {
  const grokKey = process.env.XAI_API_KEY || process.env.GROK_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  // Try Grok first (supports tools)
  if (grokKey) {
    try {
      const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${grokKey}`,
        },
        body: JSON.stringify({
          model: 'grok-4-latest',
          max_tokens: maxTokens,
          temperature,
          messages: [{ role: 'system', content: systemPrompt }, ...messages],
          tools: enableTools ? TOOL_DEFINITIONS : undefined,
          tool_choice: enableTools ? 'auto' : undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const choice = data.choices[0];
        
        if (choice.message.tool_calls) {
          return { toolCalls: choice.message.tool_calls };
        }
        
        return { text: choice.message.content };
      }
    } catch (e) {
      console.warn('Grok API failed:', e);
    }
  }

  // Fallback to Claude (with tool support)
  if (anthropicKey) {
    try {
      // Convert messages format
      const anthropicMessages = messages.filter((m: any) => m.role !== 'system');
      
      // Convert tool definitions for Claude
      const claudeTools = enableTools ? TOOL_DEFINITIONS.map(t => ({
        name: t.function.name,
        description: t.function.description,
        input_schema: t.function.parameters,
      })) : undefined;

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: maxTokens,
          temperature,
          system: systemPrompt,
          messages: anthropicMessages,
          tools: claudeTools,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Check for tool use
        const toolUse = data.content.find((c: any) => c.type === 'tool_use');
        if (toolUse) {
          return {
            toolCalls: [{
              id: toolUse.id,
              function: {
                name: toolUse.name,
                arguments: JSON.stringify(toolUse.input),
              },
            }],
          };
        }
        
        const textContent = data.content.find((c: any) => c.type === 'text');
        return { text: textContent?.text || '' };
      }
    } catch (e) {
      console.warn('Claude API failed:', e);
    }
  }

  // Fallback to OpenAI
  if (openaiKey) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          max_tokens: maxTokens,
          temperature,
          messages: [{ role: 'system', content: systemPrompt }, ...messages],
          tools: enableTools ? TOOL_DEFINITIONS : undefined,
          tool_choice: enableTools ? 'auto' : undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const choice = data.choices[0];
        
        if (choice.message.tool_calls) {
          return { toolCalls: choice.message.tool_calls };
        }
        
        return { text: choice.message.content };
      }
    } catch (e) {
      console.warn('OpenAI API failed:', e);
    }
  }

  return { error: 'No LLM API available' };
}

export async function POST(request: NextRequest) {
  try {
    const { messages, maxTokens = 2048, temperature = 0.7, systemPrompt, enableTools = true } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages array required' }, { status: 400 });
    }

    const fullSystemPrompt = systemPrompt || SOPHIA_FULL_SYSTEM_PROMPT;
    let conversationMessages = [...messages];
    let iterations = 0;
    const maxIterations = 5; // Prevent infinite loops

    // Agentic loop: handle tool calls
    while (iterations < maxIterations) {
      iterations++;
      
      const result = await callLLM(
        conversationMessages,
        fullSystemPrompt,
        enableTools && iterations < maxIterations,
        maxTokens,
        temperature
      );

      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 503 });
      }

      // If we got a text response, we're done
      if (result.text) {
        return NextResponse.json({
          text: result.text,
          iterations,
          toolsUsed: conversationMessages.filter((m: any) => m.role === 'tool').length,
        });
      }

      // Handle tool calls
      if (result.toolCalls && result.toolCalls.length > 0) {
        // Add assistant message with tool calls
        conversationMessages.push({
          role: 'assistant',
          content: null,
          tool_calls: result.toolCalls,
        });

        // Execute tools and add results
        const toolResults = await processToolCalls(result.toolCalls);
        conversationMessages.push(...toolResults);

        // Continue loop to get LLM response with tool results
        continue;
      }

      // No text or tool calls - something went wrong
      break;
    }

    // Fallback if we exhausted iterations
    return NextResponse.json({
      text: SOPHIA_ERROR_MESSAGE,
      iterations,
      error: 'Max iterations reached',
    });

  } catch (error: any) {
    console.error('Sophia chat error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process request', text: SOPHIA_ERROR_MESSAGE },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  const hasGrok = !!(process.env.XAI_API_KEY || process.env.GROK_API_KEY);
  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  
  return NextResponse.json({
    status: hasGrok || hasAnthropic || hasOpenAI ? 'ready' : 'no-api-key',
    providers: {
      grok: hasGrok,
      anthropic: hasAnthropic,
      openai: hasOpenAI,
    },
    tools: TOOL_DEFINITIONS.map(t => t.function.name),
  });
}
