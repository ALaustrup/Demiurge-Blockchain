# RPC Reference

Complete JSON-RPC 2.0 API reference for Demiurge Protocol.

---

## Endpoint

| Environment | URL |
|-------------|-----|
| Mainnet | `https://rpc.demiurge.cloud:9944` |
| Direct IP | `http://51.210.209.112:9944` |
| Local | `http://localhost:9944` |

---

## Request Format

```bash
curl -X POST https://rpc.demiurge.cloud:9944 \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "METHOD_NAME",
    "params": [PARAMS]
  }'
```

---

## Chain Methods

### chain_getBlockNumber

Get current block height.

**Parameters:** None

**Returns:** `number` - Current block number

```bash
curl -X POST https://rpc.demiurge.cloud:9944 \
  -d '{"jsonrpc":"2.0","id":1,"method":"chain_getBlockNumber","params":[]}'
```

```json
{"jsonrpc":"2.0","result":277,"id":1}
```

---

### chain_getHealth

Get node health status.

**Parameters:** None

**Returns:**
| Field | Type | Description |
|-------|------|-------------|
| `connected` | boolean | Node is synced |
| `block_number` | number | Current block |
| `block_time_ms` | number | Block interval |

```bash
curl -X POST https://rpc.demiurge.cloud:9944 \
  -d '{"jsonrpc":"2.0","id":1,"method":"chain_getHealth","params":[]}'
```

```json
{
  "jsonrpc": "2.0",
  "result": {
    "connected": true,
    "block_number": 277,
    "block_time_ms": 6000
  },
  "id": 1
}
```

---

### chain_getBlock

Get block by number.

**Parameters:**
| Index | Type | Description |
|-------|------|-------------|
| 0 | number | Block number |

**Returns:** Block object or `null`

```bash
curl -X POST https://rpc.demiurge.cloud:9944 \
  -d '{"jsonrpc":"2.0","id":1,"method":"chain_getBlock","params":[100]}'
```

---

### chain_getLatestBlock

Get the most recent block.

**Parameters:** None

**Returns:** Block object with header and transactions

```bash
curl -X POST https://rpc.demiurge.cloud:9944 \
  -d '{"jsonrpc":"2.0","id":1,"method":"chain_getLatestBlock","params":[]}'
```

---

### chain_getTransactionHistory

Get transaction history for an account.

**Parameters:**
| Index | Type | Description |
|-------|------|-------------|
| 0 | string | Account address (hex) |
| 1 | number | Limit (optional) |

**Returns:** Array of transactions

```bash
curl -X POST https://rpc.demiurge.cloud:9944 \
  -d '{"jsonrpc":"2.0","id":1,"method":"chain_getTransactionHistory","params":["0x0000...0001", 10]}'
```

---

## Consensus Methods

### consensus_getValidators

Get list of active validators.

**Parameters:** None

**Returns:** Array of validator objects

```bash
curl -X POST https://rpc.demiurge.cloud:9944 \
  -d '{"jsonrpc":"2.0","id":1,"method":"consensus_getValidators","params":[]}'
```

---

### consensus_getValidator

Get specific validator info.

**Parameters:**
| Index | Type | Description |
|-------|------|-------------|
| 0 | string | Validator address (hex) |

**Returns:** Validator info or `null`

```bash
curl -X POST https://rpc.demiurge.cloud:9944 \
  -d '{"jsonrpc":"2.0","id":1,"method":"consensus_getValidator","params":["0x0000...0001"]}'
```

---

### consensus_getCurrentEra

Get current era information.

**Parameters:** None

**Returns:**
| Field | Type | Description |
|-------|------|-------------|
| `era` | number | Current era |
| `block_number` | number | Current block |
| `total_rewards` | string | Era rewards |

```bash
curl -X POST https://rpc.demiurge.cloud:9944 \
  -d '{"jsonrpc":"2.0","id":1,"method":"consensus_getCurrentEra","params":[]}'
```

---

### consensus_getStatus

Get consensus status.

**Parameters:** None

**Returns:**
| Field | Type | Description |
|-------|------|-------------|
| `current_era` | number | Era number |
| `block_number` | number | Block height |
| `total_validators` | number | Validator count |

```bash
curl -X POST https://rpc.demiurge.cloud:9944 \
  -d '{"jsonrpc":"2.0","id":1,"method":"consensus_getStatus","params":[]}'
```

---

### consensus_getStakingPool

Get staking pool info.

**Parameters:**
| Index | Type | Description |
|-------|------|-------------|
| 0 | string | Pool address (hex) |

**Returns:** Pool info or `null`

---

## Balance Methods

### balances_getBalance

Get account balance.

**Parameters:**
| Index | Type | Description |
|-------|------|-------------|
| 0 | string | Account address (hex, 64 chars) |

**Returns:** `string` - Balance in smallest units (100 = 1 CGT)

```bash
curl -X POST https://rpc.demiurge.cloud:9944 \
  -d '{"jsonrpc":"2.0","id":1,"method":"balances_getBalance","params":["0000000000000000000000000000000000000000000000000000000000000001"]}'
```

```json
{"jsonrpc":"2.0","result":"10000","id":1}
```

---

### balances_transfer

Transfer CGT between accounts.

**Parameters:**
| Index | Type | Description |
|-------|------|-------------|
| 0 | string | From address (hex) |
| 1 | string | To address (hex) |
| 2 | string | Amount (smallest units) |
| 3 | string | Signature (hex) |

**Returns:**
| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Transfer succeeded |
| `tx_hash` | string | Transaction hash |
| `from` | string | Sender address |
| `to` | string | Recipient address |
| `amount` | string | Amount transferred |
| `new_sender_balance` | string | Updated sender balance |
| `new_recipient_balance` | string | Updated recipient balance |

```bash
curl -X POST https://rpc.demiurge.cloud:9944 \
  -d '{
    "jsonrpc":"2.0",
    "id":1,
    "method":"balances_transfer",
    "params":["FROM_HEX","TO_HEX","100","SIGNATURE_HEX"]
  }'
```

---

### balances_claimStarter

Claim one-time starter bonus.

**Parameters:**
| Index | Type | Description |
|-------|------|-------------|
| 0 | string | Account address (hex) |

**Returns:**
| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Claim succeeded |
| `amount` | string | Amount claimed |
| `message` | string | Status message |

```bash
curl -X POST https://rpc.demiurge.cloud:9944 \
  -d '{"jsonrpc":"2.0","id":1,"method":"balances_claimStarter","params":["0000...0001"]}'
```

---

### balances_hasClaimedStarter

Check if starter bonus was claimed.

**Parameters:**
| Index | Type | Description |
|-------|------|-------------|
| 0 | string | Account address (hex) |

**Returns:** `boolean`

---

## Energy Methods

### energy_getEnergy

Get account energy status.

**Parameters:**
| Index | Type | Description |
|-------|------|-------------|
| 0 | string | Account address (hex) |

**Returns:**
| Field | Type | Description |
|-------|------|-------------|
| `current` | number | Current energy |
| `max` | number | Maximum energy |
| `regeneration_rate` | number | Energy per block |

```bash
curl -X POST https://rpc.demiurge.cloud:9944 \
  -d '{"jsonrpc":"2.0","id":1,"method":"energy_getEnergy","params":["0000...0001"]}'
```

```json
{
  "jsonrpc": "2.0",
  "result": {
    "current": 850,
    "max": 1000,
    "regeneration_rate": 10
  },
  "id": 1
}
```

---

## DRC-369 Methods

### drc369_totalSupply

Get total NFTs minted.

**Parameters:** None

**Returns:** `string` - Total supply

```bash
curl -X POST https://rpc.demiurge.cloud:9944 \
  -d '{"jsonrpc":"2.0","id":1,"method":"drc369_totalSupply","params":[]}'
```

---

### drc369_balanceOf

Get NFT count for owner.

**Parameters:**
| Index | Type | Description |
|-------|------|-------------|
| 0 | string | Owner address (hex) |

**Returns:** `string` - Token count

---

### drc369_ownerOf

Get token owner.

**Parameters:**
| Index | Type | Description |
|-------|------|-------------|
| 0 | string | Token ID (hex) |

**Returns:** `string` - Owner address or `null`

---

### drc369_tokenURI

Get token metadata URI.

**Parameters:**
| Index | Type | Description |
|-------|------|-------------|
| 0 | string | Token ID (hex) |

**Returns:** `string` - URI or `null`

---

### drc369_getTokenInfo

Get complete token information.

**Parameters:**
| Index | Type | Description |
|-------|------|-------------|
| 0 | string | Token ID (hex) |

**Returns:**
| Field | Type | Description |
|-------|------|-------------|
| `token_id` | string | Token ID |
| `owner` | string | Owner address |
| `token_uri` | string | Metadata URI |
| `is_soulbound` | boolean | Non-transferable |
| `parent_token_id` | string | Parent (if nested) |
| `cvp_protected` | boolean | CVP enabled |

---

### drc369_isSoulbound

Check if token is soulbound.

**Parameters:**
| Index | Type | Description |
|-------|------|-------------|
| 0 | string | Token ID (hex) |

**Returns:** `boolean`

---

### drc369_getPhysics

Get physics properties.

**Parameters:**
| Index | Type | Description |
|-------|------|-------------|
| 0 | string | Token ID (hex) |

**Returns:**
| Field | Type | Description |
|-------|------|-------------|
| `token_id` | string | Token ID |
| `has_physics` | boolean | Has physics data |
| `physics` | object | Physics properties |
| `simulation_ready` | boolean | Valid for engines |

```bash
curl -X POST https://rpc.demiurge.cloud:9944 \
  -d '{"jsonrpc":"2.0","id":1,"method":"drc369_getPhysics","params":["TOKEN_ID_HEX"]}'
```

---

### drc369_hasPhysics

Check if token has physics.

**Parameters:**
| Index | Type | Description |
|-------|------|-------------|
| 0 | string | Token ID (hex) |

**Returns:** `boolean`

---

### drc369_setPhysics

Set physics properties.

**Parameters:**
| Index | Type | Description |
|-------|------|-------------|
| 0 | string | Token ID (hex) |
| 1 | string | Physics JSON |
| 2 | string | Signature (hex) |

**Returns:**
| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Operation succeeded |
| `token_id` | string | Token ID |
| `physics_size_bytes` | number | Data size |

---

### drc369_getDynamicState

Get dynamic state value.

**Parameters:**
| Index | Type | Description |
|-------|------|-------------|
| 0 | string | Token ID (hex) |
| 1 | string | State key |

**Returns:** `string` - State value or `null`

---

### drc369_getStateBatch

Get multiple state values.

**Parameters:**
| Index | Type | Description |
|-------|------|-------------|
| 0 | string | Token ID (hex) |
| 1 | array | Array of keys |

**Returns:** Object with key-value pairs

---

## Session Key Methods

### sessionKeys_getActiveKeys

Get active session keys for account.

**Parameters:**
| Index | Type | Description |
|-------|------|-------------|
| 0 | string | Account address (hex) |

**Returns:** Array of session key objects

```bash
curl -X POST https://rpc.demiurge.cloud:9944 \
  -d '{"jsonrpc":"2.0","id":1,"method":"sessionKeys_getActiveKeys","params":["0000...0001"]}'
```

---

## Error Codes

| Code | Message | Description |
|------|---------|-------------|
| -32700 | Parse error | Invalid JSON |
| -32600 | Invalid request | Missing fields |
| -32601 | Method not found | Unknown method |
| -32602 | Invalid params | Wrong parameters |
| -32603 | Internal error | Server error |
| -32010 | Transaction error | Invalid transaction |
| -32011 | Not found | Resource not found |
| -32012 | Storage error | Database error |

---

## Rate Limits

| Limit | Value |
|-------|-------|
| Requests/second | 100 |
| Batch size | 50 |
| Max response size | 10 MB |

---

## Further Reading

- [Developer Guide](./README.md)
- [TypeScript SDK](./sdk/typescript.md)
- [Architecture](../architecture/README.md)
