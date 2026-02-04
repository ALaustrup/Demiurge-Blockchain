# CGT Tokenomics

CGT (Cogito) is the native token of the Demiurge Protocol.

---

## Token Overview

| Property | Value |
|----------|-------|
| Name | Cogito |
| Symbol | CGT |
| Total Supply | 13,000,000,000 |
| Decimals | 2 (100 Sparks = 1 CGT) |
| Type | Utility + Governance |

---

## Distribution

| Allocation | Amount | Percentage | Purpose |
|------------|--------|------------|---------|
| Treasury | 10,000,000,000 | 77% | Ecosystem development |
| Staking Rewards | 2,000,000,000 | 15% | Validator incentives |
| Team | 650,000,000 | 5% | Core development |
| Community | 350,000,000 | 3% | Airdrops, bounties |

### Treasury Address (Godmode)

```
0x00000000000000000000000000000000DEMIURGE
```

Initial treasury: 1,000,000,000 CGT

---

## Utility

### 1. Transaction Energy

CGT is used to replenish energy for transactions:
- Energy regenerates automatically (feeless UX)
- Heavy users can stake CGT for faster regeneration

### 2. Staking

Validators stake CGT to participate in consensus:
- Minimum stake: 10,000 CGT
- APY: ~5% (sustainable)
- Unbonding period: 7 days

### 3. Governance

CGT holders can vote on:
- Protocol upgrades
- Parameter changes
- Treasury spending
- Consensus mechanism changes

### 4. NFT Operations

- DRC-369 minting fees (burned)
- Royalty payments
- Marketplace transactions

---

## Energy System

Demiurge uses energy instead of gas fees:

| Property | Value |
|----------|-------|
| Max Energy | 1,000 per account |
| Regeneration | 10 per block |
| Block Time | 6 seconds |
| Full Recharge | ~10 minutes |

### Transaction Costs

| Operation | Energy Cost |
|-----------|-------------|
| CGT Transfer | 1 |
| NFT Mint | 5 |
| NFT Transfer | 2 |
| State Update | 1 |
| Complex Contract | 10 |

**Result:** Users never pay gas fees for normal usage.

---

## Staking Rewards

### Validator Rewards

```
Block Reward = Base Reward + Transaction Fees

Where:
- Base Reward = 10 CGT per block (decreasing over time)
- Transaction Fees = Sum of fees from included transactions
```

### Reward Distribution

1. Block author receives 80%
2. Remaining validators share 20%

### APY Calculation

```
APY = (Annual Rewards / Total Staked) * 100

Example:
- Total staked: 1,000,000,000 CGT
- Annual rewards: 50,000,000 CGT
- APY = 5%
```

---

## Inflation Schedule

| Year | New Supply | Total Supply | Inflation |
|------|------------|--------------|-----------|
| 1 | 500,000,000 | 13,500,000,000 | 3.8% |
| 2 | 400,000,000 | 13,900,000,000 | 2.9% |
| 3 | 300,000,000 | 14,200,000,000 | 2.1% |
| 4 | 200,000,000 | 14,400,000,000 | 1.4% |
| 5+ | 100,000,000 | +100M/year | 0.7% |

Long-term target: <1% annual inflation.

---

## Burning Mechanisms

CGT is burned in these scenarios:

| Event | Burn Amount |
|-------|-------------|
| NFT Minting | 1 CGT base fee |
| Slashing (validator) | Slashed stake |
| Governance (failed proposals) | Deposit |

---

## Starter Bonus

New accounts can claim a one-time starter bonus:

| Property | Value |
|----------|-------|
| Amount | 100 CGT |
| Limit | Once per address |
| Purpose | Onboarding new users |

### RPC

```bash
curl -X POST https://rpc.demiurge.cloud:9944 \
  -d '{
    "jsonrpc":"2.0",
    "id":1,
    "method":"balances_claimStarter",
    "params":["ADDRESS_HEX"]
  }'
```

---

## Balance Queries

### Get Balance

```bash
curl -X POST https://rpc.demiurge.cloud:9944 \
  -d '{
    "jsonrpc":"2.0",
    "id":1,
    "method":"balances_getBalance",
    "params":["ADDRESS_HEX"]
  }'
```

Response (in Sparks, divide by 100 for CGT):
```json
{"jsonrpc":"2.0","result":"10000","id":1}
```

### Transfer

```bash
curl -X POST https://rpc.demiurge.cloud:9944 \
  -d '{
    "jsonrpc":"2.0",
    "id":1,
    "method":"balances_transfer",
    "params":["FROM_HEX","TO_HEX","AMOUNT","SIGNATURE_HEX"]
  }'
```

---

## SDK Usage

```typescript
import { DemiurgeClient } from '@demiurge/sdk';

const client = new DemiurgeClient({
  rpcUrl: 'https://rpc.demiurge.cloud:9944'
});

// Get balance
const balance = await client.getBalance(address);
console.log(`Balance: ${balance / 100} CGT`);

// Transfer
const result = await client.transfer({
  from: senderAddress,
  to: recipientAddress,
  amount: 100, // 1 CGT
  wallet: wallet
});
```

---

## Storage Keys

| Key | Value |
|-----|-------|
| `Balances:Account:{address}` | Account balance (u128) |
| `Balances:TotalSupply` | Total supply (u128) |
| `Balances:StarterClaimed:{address}` | Claim flag (bool) |

---

## Governance Parameters

These parameters can be changed via governance:

| Parameter | Current | Range |
|-----------|---------|-------|
| `block_reward` | 10 CGT | 1-100 |
| `min_validator_stake` | 10,000 CGT | 1,000-1,000,000 |
| `unbonding_period` | 7 days | 1-30 days |
| `max_energy` | 1,000 | 100-10,000 |
| `energy_regen_rate` | 10/block | 1-100 |

---

## Security Considerations

### Sybil Resistance
- Staking requirement for validators
- Energy limits prevent spam
- Starter bonus limited to one per address

### Economic Attacks
- Minimum stake prevents validator flooding
- Slashing deters malicious behavior
- Long unbonding prevents stake-and-run

---

## Further Reading

- [Consensus](../architecture/consensus.md)
- [Energy System](../architecture/modules.md#energy)
- [Staking Guide](../operations/staking.md)
