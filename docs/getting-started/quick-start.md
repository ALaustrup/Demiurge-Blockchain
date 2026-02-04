# Quick Start Guide

Get started with Demiurge Protocol in 5 minutes.

---

## Prerequisites

- Node.js 18+ or Rust 1.70+
- Internet connection to reach `rpc.demiurge.cloud`

---

## Option 1: Use the Web Platform

The fastest way to explore Demiurge:

1. Visit https://demiurge.cloud
2. Create an account (QOR ID or keypair)
3. Claim your starter CGT bonus
4. Explore the dashboard

---

## Option 2: Use the CLI

```bash
# Install the CLI
npm install -g @demiurge/cli

# Start interactive shell
demiurge

# Or use command mode
demiurge chain status
```

### Common CLI Commands

```bash
# Check chain status
demiurge chain status

# Generate a wallet
demiurge wallet generate --output my-wallet.json

# Check balance
demiurge wallet balance <address>

# Send CGT
demiurge wallet send <to-address> <amount>
```

---

## Option 3: Use the SDK

```bash
npm install @demiurge/sdk
```

```typescript
import { DemiurgeClient } from '@demiurge/sdk';

const client = new DemiurgeClient({
  rpcUrl: 'https://rpc.demiurge.cloud'
});

// Get current block number
const block = await client.getBlockNumber();
console.log('Current block:', block);

// Get balance
const balance = await client.getBalance('0x0000...0001');
console.log('Balance:', balance, 'CGT');
```

---

## Option 4: Direct RPC Calls

```bash
curl -X POST https://rpc.demiurge.cloud:9944 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"chain_getBlockNumber","params":[]}'
```

Response:
```json
{"jsonrpc":"2.0","result":277,"id":1}
```

---

## Next Steps

- [Installation Guide](./installation.md) - Set up your development environment
- [First Transaction](./first-transaction.md) - Send your first transfer
- [RPC Reference](../developers/rpc-reference.md) - All available RPC methods
- [DRC-369 Specification](../specifications/drc369.md) - Create dynamic NFTs

---

## Live Endpoints

| Service | URL |
|---------|-----|
| Frontend | https://demiurge.cloud |
| RPC | https://rpc.demiurge.cloud:9944 |
| Direct IP | http://51.210.209.112:9944 |

---

**Need help?** Open an issue on [GitHub](https://github.com/ALaustrup/Demiurge-Blockchain/issues)
