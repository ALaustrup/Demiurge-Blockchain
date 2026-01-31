#!/usr/bin/env node

/**
 * Demiurge CLI - Official command-line interface
 * 
 * Complete toolkit for interacting with the Demiurge Protocol:
 * - Blockchain queries and transactions
 * - QOR ID management
 * - DRC-369 NFT operations
 * - AI agent deployment
 * - Validator operations
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { registerChainCommands } from './commands/chain';
import { registerWalletCommands } from './commands/wallet';
import { registerNftCommands } from './commands/nft';
import { registerAgentCommands } from './commands/agent';
import { registerIdentityCommands } from './commands/identity';
import { registerValidatorCommands } from './commands/validator';
import { registerDevCommands } from './commands/dev';

const program = new Command();

// CLI metadata
program
  .name('demiurge')
  .description(chalk.cyan('🔥 Demiurge Protocol CLI - The Sovereign Creative Substrate'))
  .version('1.0.0');

// Register command groups
registerChainCommands(program);
registerWalletCommands(program);
registerNftCommands(program);
registerAgentCommands(program);
registerIdentityCommands(program);
registerValidatorCommands(program);
registerDevCommands(program);

// Global options
program
  .option('-r, --rpc <url>', 'RPC endpoint URL', process.env.DEMIURGE_RPC_URL || 'https://rpc.demiurge.cloud')
  .option('-q, --quiet', 'Suppress output')
  .option('-j, --json', 'Output as JSON')
  .option('--no-color', 'Disable colored output');

// Parse and execute
program.parse(process.argv);

// If no command specified, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
