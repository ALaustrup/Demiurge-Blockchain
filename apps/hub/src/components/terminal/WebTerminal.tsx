'use client';

/**
 * WebTerminal
 * 
 * On-chain CLI terminal accessible from the landing page.
 * Mirrors the demiurge CLI commands for blockchain interaction.
 * No authentication required - public read-only access.
 */

import { useState, useRef, useEffect, useCallback, KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DemiurgeClient } from '@demiurge/sdk';
import { Drc369Client } from '@demiurge/drc369-sdk';

// ============================================================================
// Types
// ============================================================================

interface TerminalLine {
  id: number;
  type: 'input' | 'output' | 'error' | 'info' | 'success' | 'table';
  content: string;
  timestamp: Date;
}

interface CommandResult {
  type: 'output' | 'error' | 'success' | 'info' | 'table';
  content: string;
}

// ============================================================================
// Constants
// ============================================================================

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://rpc.demiurge.cloud';

const HELP_TEXT = `
╔══════════════════════════════════════════════════════════════════════════╗
║                      DEMIURGE CLI - Web Terminal                         ║
║                  The Sovereign Creative Substrate                        ║
╚══════════════════════════════════════════════════════════════════════════╝

USAGE: <command> [subcommand] [arguments]

COMMANDS:
  help                          Show this help message
  clear                         Clear terminal
  
  chain status                  Get chain status
  chain block-number            Get current block number
  chain block [number]          Get block information
  chain validators              List validators
  
  wallet balance <address>      Get CGT balance
  wallet energy <address>       Get energy level
  
  nft info <tokenId>            Get NFT information
  nft list <owner>              List NFTs owned by address
  
  identity check <username>     Check username availability
  identity resolve <handle>     Resolve QOR ID to address

OPTIONS:
  --json                        Output as JSON
  --rpc <url>                   Custom RPC endpoint

EXAMPLES:
  chain status
  wallet balance 0x1234...5678
  nft list 0xabcd...efgh
  identity check satoshi
`;

const WELCOME_MESSAGE = `
╔══════════════════════════════════════════════════════════════════════════╗
║   ██████╗ ███████╗███╗   ███╗██╗██╗   ██╗██████╗  ██████╗ ███████╗      ║
║   ██╔══██╗██╔════╝████╗ ████║██║██║   ██║██╔══██╗██╔════╝ ██╔════╝      ║
║   ██║  ██║█████╗  ██╔████╔██║██║██║   ██║██████╔╝██║  ███╗█████╗        ║
║   ██║  ██║██╔══╝  ██║╚██╔╝██║██║██║   ██║██╔══██╗██║   ██║██╔══╝        ║
║   ██████╔╝███████╗██║ ╚═╝ ██║██║╚██████╔╝██║  ██║╚██████╔╝███████╗      ║
║   ╚═════╝ ╚══════╝╚═╝     ╚═╝╚═╝ ╚═════╝ ╚═╝  ╚═╝ ╚═════╝ ╚══════╝      ║
║                                                                          ║
║              On-Chain CLI Terminal v1.0.0 - Web Interface                ║
║                                                                          ║
║   Type 'help' for available commands                                     ║
║   Connected to: ${RPC_URL.padEnd(52)}║
╚══════════════════════════════════════════════════════════════════════════╝
`;

// ============================================================================
// Command Executor
// ============================================================================

class CommandExecutor {
  private client: DemiurgeClient;
  private nftClient: Drc369Client;
  private rpcUrl: string;

  constructor(rpcUrl: string = RPC_URL) {
    this.rpcUrl = rpcUrl;
    this.client = new DemiurgeClient({ rpcUrl });
    this.nftClient = new Drc369Client({ rpcUrl });
  }

  async execute(input: string): Promise<CommandResult[]> {
    const parts = input.trim().split(/\s+/);
    const command = parts[0]?.toLowerCase();
    const subcommand = parts[1]?.toLowerCase();
    const args = parts.slice(2);
    const isJson = input.includes('--json');

    try {
      switch (command) {
        case 'help':
        case '?':
          return [{ type: 'info', content: HELP_TEXT }];

        case 'clear':
          return [{ type: 'info', content: '__CLEAR__' }];

        case 'chain':
          return await this.handleChainCommand(subcommand, args, isJson);

        case 'wallet':
          return await this.handleWalletCommand(subcommand, args, isJson);

        case 'nft':
          return await this.handleNftCommand(subcommand, args, isJson);

        case 'identity':
        case 'id':
          return await this.handleIdentityCommand(subcommand, args, isJson);

        case '':
          return [];

        default:
          return [{
            type: 'error',
            content: `Unknown command: '${command}'. Type 'help' for available commands.`,
          }];
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return [{ type: 'error', content: `Error: ${message}` }];
    }
  }

  private async handleChainCommand(
    subcommand: string,
    args: string[],
    isJson: boolean
  ): Promise<CommandResult[]> {
    switch (subcommand) {
      case 'status': {
        const blockNumber = await this.client.getBlockNumber();
        
        if (isJson) {
          return [{
            type: 'output',
            content: JSON.stringify({
              blockHeight: blockNumber,
              rpcEndpoint: this.rpcUrl,
              network: 'Demiurge Mainnet',
              status: 'Online',
            }, null, 2),
          }];
        }
        
        return [{
          type: 'table',
          content: `
┌────────────────────────────────┬────────────────────────────────────────────┐
│ Metric                         │ Value                                      │
├────────────────────────────────┼────────────────────────────────────────────┤
│ Block Height                   │ ${String(blockNumber).padEnd(42)}│
│ RPC Endpoint                   │ ${this.rpcUrl.padEnd(42)}│
│ Network                        │ Demiurge Mainnet                           │
│ Status                         │ ● Online                                   │
└────────────────────────────────┴────────────────────────────────────────────┘
`,
        }];
      }

      case 'block-number': {
        const blockNumber = await this.client.getBlockNumber();
        
        if (isJson) {
          return [{ type: 'output', content: JSON.stringify({ blockNumber }, null, 2) }];
        }
        
        return [{
          type: 'success',
          content: `📦 Current Block: ${blockNumber}`,
        }];
      }

      case 'block': {
        const blockNum = args[0] || 'latest';
        return [{
          type: 'info',
          content: `📦 Block ${blockNum}\n\nNote: Full block data coming soon`,
        }];
      }

      case 'validators': {
        return [{
          type: 'info',
          content: `🏛️  Validators:\n\nNote: Validator list coming soon via RPC`,
        }];
      }

      default:
        return [{
          type: 'error',
          content: `Unknown chain subcommand: '${subcommand}'\nAvailable: status, block-number, block, validators`,
        }];
    }
  }

  private async handleWalletCommand(
    subcommand: string,
    args: string[],
    isJson: boolean
  ): Promise<CommandResult[]> {
    switch (subcommand) {
      case 'balance': {
        const address = args[0];
        if (!address) {
          return [{ type: 'error', content: 'Usage: wallet balance <address>' }];
        }
        
        try {
          const balance = await this.client.getBalance(address);
          const cgtBalance = (Number(balance) / 1e18).toFixed(6);
          const sparks = (Number(balance) / 1e16).toFixed(2);
          
          if (isJson) {
            return [{
              type: 'output',
              content: JSON.stringify({ address, balance: cgtBalance, sparks }, null, 2),
            }];
          }
          
          return [{
            type: 'success',
            content: `💰 Balance:\n\n  Address: ${address}\n  Balance: ${cgtBalance} CGT\n  Sparks:  ${sparks}`,
          }];
        } catch {
          return [{
            type: 'error',
            content: `Failed to fetch balance for ${address}. Check the address format.`,
          }];
        }
      }

      case 'energy': {
        const address = args[0];
        if (!address) {
          return [{ type: 'error', content: 'Usage: wallet energy <address>' }];
        }
        
        try {
          const energy = await this.client.getEnergy(address);
          const filled = Math.floor(energy / 5);
          const empty = 20 - filled;
          const bar = '█'.repeat(filled) + '░'.repeat(empty);
          
          if (isJson) {
            return [{ type: 'output', content: JSON.stringify({ address, energy }, null, 2) }];
          }
          
          return [{
            type: 'success',
            content: `⚡ Energy:\n\n  Address: ${address}\n  Current: ${energy} / 100\n  Level:   [${bar}] ${energy}%`,
          }];
        } catch {
          return [{
            type: 'error',
            content: `Failed to fetch energy for ${address}. Check the address format.`,
          }];
        }
      }

      case 'generate':
        return [{
          type: 'info',
          content: `🔑 Wallet generation is available in the full CLI.\n\n  Install: npm install -g @demiurge/cli\n  Run:     demiurge wallet generate`,
        }];

      default:
        return [{
          type: 'error',
          content: `Unknown wallet subcommand: '${subcommand}'\nAvailable: balance, energy`,
        }];
    }
  }

  private async handleNftCommand(
    subcommand: string,
    args: string[],
    isJson: boolean
  ): Promise<CommandResult[]> {
    switch (subcommand) {
      case 'info': {
        const tokenId = args[0];
        if (!tokenId) {
          return [{ type: 'error', content: 'Usage: nft info <tokenId>' }];
        }
        
        try {
          const token = await this.nftClient.getToken(tokenId);
          
          if (isJson) {
            return [{ type: 'output', content: JSON.stringify(token, null, 2) }];
          }
          
          let output = `🖼️  NFT Information:\n\n`;
          output += `  Token ID:   ${token.id}\n`;
          output += `  Name:       ${token.name || 'Unnamed'}\n`;
          output += `  Owner:      ${token.owner}\n`;
          output += `  Collection: ${token.collection || 'None'}\n`;
          
          if (token.dynamicState) {
            output += `\n📊 Dynamic State:\n`;
            output += `  Level: ${token.dynamicState.level || 1}\n`;
            output += `  XP:    ${token.dynamicState.xp || 0}\n`;
          }
          
          return [{ type: 'success', content: output }];
        } catch {
          return [{
            type: 'error',
            content: `NFT not found: ${tokenId}`,
          }];
        }
      }

      case 'list': {
        const owner = args[0];
        if (!owner) {
          return [{ type: 'error', content: 'Usage: nft list <owner>' }];
        }
        
        try {
          const tokens = await this.nftClient.getTokensByOwner(owner);
          
          if (tokens.length === 0) {
            return [{ type: 'info', content: `No NFTs found for ${owner}` }];
          }
          
          if (isJson) {
            return [{ type: 'output', content: JSON.stringify(tokens, null, 2) }];
          }
          
          let table = `Found ${tokens.length} NFTs:\n\n`;
          table += '┌───────────────┬───────────────────────────┬────────┬────────┐\n';
          table += '│ Token ID      │ Name                      │ Level  │ XP     │\n';
          table += '├───────────────┼───────────────────────────┼────────┼────────┤\n';
          
          tokens.slice(0, 10).forEach((t: any) => {
            const id = (t.id || '').slice(0, 12).padEnd(13);
            const name = (t.name || 'Unnamed').slice(0, 24).padEnd(25);
            const level = String(t.dynamicState?.level || 1).padEnd(6);
            const xp = String(t.dynamicState?.xp || 0).padEnd(6);
            table += `│ ${id} │ ${name} │ ${level} │ ${xp} │\n`;
          });
          
          table += '└───────────────┴───────────────────────────┴────────┴────────┘';
          
          return [{ type: 'table', content: table }];
        } catch {
          return [{
            type: 'error',
            content: `Failed to fetch NFTs for ${owner}`,
          }];
        }
      }

      default:
        return [{
          type: 'error',
          content: `Unknown nft subcommand: '${subcommand}'\nAvailable: info, list`,
        }];
    }
  }

  private async handleIdentityCommand(
    subcommand: string,
    args: string[],
    isJson: boolean
  ): Promise<CommandResult[]> {
    switch (subcommand) {
      case 'check': {
        const username = args[0];
        if (!username) {
          return [{ type: 'error', content: 'Usage: identity check <username>' }];
        }
        
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL || 'https://auth.demiurge.cloud'}/api/auth/check-username?username=${encodeURIComponent(username)}`
          );
          const data = await response.json();
          
          if (isJson) {
            return [{ type: 'output', content: JSON.stringify(data, null, 2) }];
          }
          
          if (data.available) {
            return [{ type: 'success', content: `✅ "${username}" is available!` }];
          } else {
            return [{ type: 'error', content: `❌ "${username}" is already taken` }];
          }
        } catch {
          return [{
            type: 'info',
            content: `🔍 Checking "${username}"...\n\nNote: Username check requires auth API`,
          }];
        }
      }

      case 'resolve': {
        const handle = args[0];
        if (!handle) {
          return [{ type: 'error', content: 'Usage: identity resolve <handle>' }];
        }
        
        return [{
          type: 'info',
          content: `🔍 QOR ID Resolution:\n\n  Handle:  ${handle}\n  DID:     did:demiurge:...\n  Address: 0x...\n\nNote: Full resolution coming soon`,
        }];
      }

      case 'register':
      case 'login':
        return [{
          type: 'info',
          content: `🔐 Identity ${subcommand} requires the full CLI or web interface.\n\n  Install: npm install -g @demiurge/cli\n  Or visit: https://demiurge.cloud`,
        }];

      default:
        return [{
          type: 'error',
          content: `Unknown identity subcommand: '${subcommand}'\nAvailable: check, resolve`,
        }];
    }
  }
}

// ============================================================================
// Terminal Component
// ============================================================================

interface WebTerminalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WebTerminal({ isOpen, onClose }: WebTerminalProps) {
  const [lines, setLines] = useState<TerminalLine[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const executorRef = useRef<CommandExecutor | null>(null);
  const lineIdRef = useRef(0);

  // Initialize executor and welcome message
  useEffect(() => {
    if (isOpen && !executorRef.current) {
      executorRef.current = new CommandExecutor();
      setLines([{
        id: lineIdRef.current++,
        type: 'info',
        content: WELCOME_MESSAGE,
        timestamp: new Date(),
      }]);
    }
  }, [isOpen]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [lines]);

  // Focus input when terminal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const addLine = useCallback((type: TerminalLine['type'], content: string) => {
    setLines(prev => [...prev, {
      id: lineIdRef.current++,
      type,
      content,
      timestamp: new Date(),
    }]);
  }, []);

  const executeCommand = useCallback(async (input: string) => {
    if (!input.trim() || !executorRef.current) return;

    // Add input line
    addLine('input', `$ ${input}`);
    
    // Add to history
    setHistory(prev => [input, ...prev.slice(0, 99)]);
    setHistoryIndex(-1);
    setCurrentInput('');
    setIsProcessing(true);

    try {
      const results = await executorRef.current.execute(input);
      
      for (const result of results) {
        if (result.content === '__CLEAR__') {
          setLines([]);
        } else {
          addLine(result.type, result.content);
        }
      }
    } catch (error) {
      addLine('error', `Error: ${error instanceof Error ? error.message : String(error)}`);
    }

    setIsProcessing(false);
  }, [addLine]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'Enter':
        executeCommand(currentInput);
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        if (history.length > 0) {
          const newIndex = Math.min(historyIndex + 1, history.length - 1);
          setHistoryIndex(newIndex);
          setCurrentInput(history[newIndex] || '');
        }
        break;
        
      case 'ArrowDown':
        e.preventDefault();
        if (historyIndex > 0) {
          const newIndex = historyIndex - 1;
          setHistoryIndex(newIndex);
          setCurrentInput(history[newIndex] || '');
        } else {
          setHistoryIndex(-1);
          setCurrentInput('');
        }
        break;
        
      case 'Tab':
        e.preventDefault();
        // Simple tab completion
        const completions: Record<string, string[]> = {
          'c': ['chain'],
          'ch': ['chain'],
          'cha': ['chain'],
          'chai': ['chain'],
          'w': ['wallet'],
          'wa': ['wallet'],
          'wal': ['wallet'],
          'n': ['nft'],
          'nf': ['nft'],
          'i': ['identity'],
          'id': ['identity'],
          'h': ['help'],
          'he': ['help'],
          'hel': ['help'],
          'cl': ['clear'],
          'cle': ['clear'],
          'clea': ['clear'],
        };
        const match = completions[currentInput.toLowerCase()];
        if (match && match.length === 1) {
          setCurrentInput(match[0] + ' ');
        }
        break;
        
      case 'Escape':
        onClose();
        break;
        
      case 'l':
        if (e.ctrlKey) {
          e.preventDefault();
          setLines([]);
        }
        break;
    }
  }, [currentInput, executeCommand, history, historyIndex, onClose]);

  const getLineColor = (type: TerminalLine['type']) => {
    switch (type) {
      case 'input': return 'text-neon-cyan';
      case 'output': return 'text-text-primary';
      case 'error': return 'text-red-400';
      case 'success': return 'text-green-400';
      case 'info': return 'text-text-secondary';
      case 'table': return 'text-neon-cyan';
      default: return 'text-text-primary';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-5xl h-[80vh] bg-[#0a0a0f] rounded-lg border border-neon-cyan/30 shadow-2xl shadow-neon-cyan/10 overflow-hidden flex flex-col"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Terminal Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-neon-cyan/20 to-transparent border-b border-neon-cyan/20">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <button
                    onClick={onClose}
                    className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-400 transition-colors"
                  />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <span className="font-mono text-sm text-neon-cyan tracking-wider">
                  DEMIURGE CLI - Web Terminal
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-text-tertiary font-mono">
                <span>RPC: {RPC_URL}</span>
                <span className="text-green-400">● Connected</span>
              </div>
            </div>

            {/* Terminal Body */}
            <div
              ref={terminalRef}
              className="flex-1 overflow-y-auto p-4 font-mono text-sm leading-relaxed"
              onClick={() => inputRef.current?.focus()}
            >
              {lines.map((line) => (
                <div key={line.id} className={`${getLineColor(line.type)} whitespace-pre-wrap mb-1`}>
                  {line.content}
                </div>
              ))}
              
              {/* Input line */}
              <div className="flex items-center text-neon-cyan">
                <span className="mr-2">$</span>
                <input
                  ref={inputRef}
                  type="text"
                  value={currentInput}
                  onChange={(e) => setCurrentInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isProcessing}
                  className="flex-1 bg-transparent border-none outline-none text-text-primary caret-neon-cyan"
                  placeholder={isProcessing ? 'Processing...' : ''}
                  autoComplete="off"
                  spellCheck={false}
                />
                {isProcessing && (
                  <div className="w-2 h-4 bg-neon-cyan animate-pulse" />
                )}
              </div>
            </div>

            {/* Terminal Footer */}
            <div className="px-4 py-2 border-t border-white/5 flex justify-between text-xs text-text-tertiary font-mono">
              <div className="flex gap-4">
                <span><kbd className="px-1 py-0.5 bg-white/5 rounded">↑↓</kbd> History</span>
                <span><kbd className="px-1 py-0.5 bg-white/5 rounded">Tab</kbd> Complete</span>
                <span><kbd className="px-1 py-0.5 bg-white/5 rounded">Ctrl+L</kbd> Clear</span>
                <span><kbd className="px-1 py-0.5 bg-white/5 rounded">Esc</kbd> Close</span>
              </div>
              <div>
                Type <span className="text-neon-cyan">help</span> for commands
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default WebTerminal;
