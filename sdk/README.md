# @demiurge/sdk

Core TypeScript SDK for the Demiurge Protocol - a next-generation blockchain for gaming and AI.

## Installation

```bash
npm install @demiurge/sdk
# or
yarn add @demiurge/sdk
# or
pnpm add @demiurge/sdk
```

## Features

- **DemiurgeClient** - Connect to the Demiurge blockchain RPC
- **DRC369** - Interact with evolving NFTs
- **CVP** - Consensus-Verified Polymorphism utilities
- **Wallet** - Key management and transaction signing

## Quick Start

```typescript
import { DemiurgeClient, DRC369, Wallet } from '@demiurge/sdk';

// Connect to the network
const client = new DemiurgeClient({
  rpcUrl: 'https://rpc.demiurge.cloud',
});

// Get blockchain info
const blockNumber = await client.getBlockNumber();
console.log('Block:', blockNumber);

// Get balance
const balance = await client.getBalance('5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY');
console.log('Balance:', balance, 'CGT');

// Work with DRC-369 NFTs
const drc369 = new DRC369(client);
const nft = await drc369.getToken('nft-001');
console.log('NFT:', nft.name);
```

## API Reference

### DemiurgeClient

```typescript
const client = new DemiurgeClient({
  rpcUrl: 'https://rpc.demiurge.cloud',
  timeout: 30000, // optional
});

// Methods
await client.getBlockNumber();
await client.getBalance(address);
await client.getEnergy(address);
await client.submitTransaction(signedTx);
await client.getTransactionStatus(txHash);
```

### DRC369

```typescript
const drc369 = new DRC369(client);

// Get token info
const token = await drc369.getToken(tokenId);

// Query user's NFTs
const nfts = await drc369.getTokensByOwner(address);

// Get dynamic state
const state = await drc369.getDynamicState(tokenId);
```

### Wallet

```typescript
import { Wallet } from '@demiurge/sdk';

// Generate new keypair
const wallet = Wallet.generate();

// From seed phrase
const wallet = Wallet.fromMnemonic('word1 word2 ...');

// Sign transaction
const signature = wallet.sign(txBytes);
```

### CVP (Consensus-Verified Polymorphism)

```typescript
import { CVP } from '@demiurge/sdk';

const cvp = new CVP(client);

// Check CVP status for code
const status = await cvp.getStatus(codeHash);

// Verify mutation proof
const isValid = await cvp.verifyProof(proof);
```

## Types

```typescript
import type {
  BlockInfo,
  TransactionInfo,
  TokenInfo,
  DynamicState,
  EnergyInfo,
  CvpStatus,
} from '@demiurge/sdk';
```

## Configuration

### Environment Variables

```bash
DEMIURGE_RPC_URL=https://rpc.demiurge.cloud
```

## Related Packages

- [@demiurge/qor-sdk](https://www.npmjs.com/package/@demiurge/qor-sdk) - Identity SDK
- [@demiurge/drc369-sdk](https://www.npmjs.com/package/@demiurge/drc369-sdk) - NFT SDK with React hooks
- [@demiurge/agent-foundry](https://www.npmjs.com/package/@demiurge/agent-foundry) - AI Agent SDK

## License

MIT - Demiurge Protocol

## Links

- [Documentation](https://demiurge.cloud/docs)
- [GitHub](https://github.com/ALaustrup/Demiurge-Blockchain)
- [Website](https://demiurge.cloud)
