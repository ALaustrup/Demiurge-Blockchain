# DRC-369: Dynamic Stateful Asset Standard

**Version**: 1.0.0  
**Status**: Draft  
**Authors**: Demiurge Protocol Team

---

## Abstract

DRC-369 is a next-generation asset standard designed for the Open Metaverse. Unlike traditional NFT standards (ERC-721, ERC-1155), DRC-369 treats assets as **living entities** with:

- **Dynamic State Trees**: Hierarchical, queryable state that game engines can read in real-time
- **Nested Composition**: Assets can contain other assets (armor containing gems)
- **Delegated Permissions**: Fine-grained access control for different applications
- **Soulbound Binding**: Optional non-transferability for achievements/credentials
- **CVP Protection**: Bytecode mutation for exploit resistance

---

## 1. Core Concepts

### 1.1 Dynamic State Tree

Instead of a static JSON blob, DRC-369 assets maintain a **Dynamic State Tree** that applications can query efficiently.

```
Asset #1337 (Legendary Sword)
├── core/
│   ├── name: "Excalibur"
│   ├── type: "weapon.sword.longsword"
│   └── rarity: "legendary"
├── stats/
│   ├── damage: 150
│   ├── durability: 85
│   ├── level: 42
│   └── enchantment: "fire"
├── visual/
│   ├── model_id: "sword_legendary_001"
│   ├── texture_skin: 4
│   ├── glow_effect: true
│   └── particle_system: "ember_trail"
├── provenance/
│   ├── creator: "0xArtist..."
│   ├── creation_block: 1000000
│   ├── forge_location: "Mount Doom"
│   └── kills: 369
└── permissions/
    ├── tradeable: true
    ├── modifiable_by: ["owner", "game_contract"]
    └── viewable_by: "public"
```

### 1.2 State Paths

Applications query state using **dot-notation paths**:

```typescript
// Game engine queries
const damage = await asset.getState("stats/damage");        // 150
const glow = await asset.getState("visual/glow_effect");    // true
const kills = await asset.getState("provenance/kills");     // 369

// Batch query for rendering
const visualState = await asset.getStateTree("visual/");
// Returns entire visual subtree
```

### 1.3 State Types

| Type | Encoding | Example |
|------|----------|---------|
| `uint256` | Big-endian bytes | Damage, level, counts |
| `int256` | Two's complement | Temperature, coordinates |
| `bool` | Single byte (0/1) | Flags, toggles |
| `string` | UTF-8 bytes | Names, descriptions |
| `bytes` | Raw bytes | Hashes, signatures |
| `address` | 32 bytes | Owner, creator |
| `array` | Length-prefixed | Child tokens, resources |
| `map` | Key-value pairs | Custom attributes |

---

## 2. JSON-LD Metadata Schema

DRC-369 uses **JSON-LD** for interoperability with semantic web standards.

### 2.1 Master Asset Schema

```json
{
  "@context": {
    "@vocab": "https://demiurge.io/schema/drc369/",
    "xsd": "http://www.w3.org/2001/XMLSchema#",
    "schema": "https://schema.org/",
    "dc": "http://purl.org/dc/terms/",
    "drc": "https://demiurge.io/schema/drc369/"
  },
  "@type": "drc:Asset",
  "@id": "drc369:1337",
  
  "drc:tokenId": "1337",
  "drc:version": "1.0.0",
  "drc:standard": "DRC-369",
  
  "core": {
    "@type": "drc:CoreMetadata",
    "name": "Excalibur",
    "description": "The legendary sword of King Arthur",
    "category": "weapon",
    "subcategory": "sword.longsword",
    "rarity": "legendary",
    "image": "ipfs://QmXyz.../excalibur.png",
    "animation_url": "ipfs://QmXyz.../excalibur.glb",
    "external_url": "https://demiurge.io/asset/1337"
  },
  
  "physical": {
    "@type": "drc:PhysicalProperties",
    "model": {
      "format": "glTF",
      "uri": "ipfs://QmXyz.../excalibur.glb",
      "lod_levels": [
        { "level": 0, "uri": "ipfs://QmXyz.../excalibur_lod0.glb", "triangles": 50000 },
        { "level": 1, "uri": "ipfs://QmXyz.../excalibur_lod1.glb", "triangles": 10000 },
        { "level": 2, "uri": "ipfs://QmXyz.../excalibur_lod2.glb", "triangles": 2000 }
      ]
    },
    "materials": [
      {
        "slot": "blade",
        "type": "PBR",
        "albedo": "ipfs://QmXyz.../blade_albedo.png",
        "normal": "ipfs://QmXyz.../blade_normal.png",
        "metallic": 0.9,
        "roughness": 0.2
      }
    ],
    "physics": {
      "collision_mesh": "ipfs://QmXyz.../excalibur_collision.glb",
      "mass_kg": 2.5,
      "center_of_mass": [0, 0.3, 0]
    },
    "audio": {
      "swing": "ipfs://QmXyz.../sword_swing.ogg",
      "impact": "ipfs://QmXyz.../sword_impact.ogg",
      "equip": "ipfs://QmXyz.../sword_equip.ogg"
    }
  },
  
  "stats": {
    "@type": "drc:DynamicStats",
    "schema": "drc369:weapon_stats_v1",
    "values": {
      "damage": { "base": 100, "current": 150, "max": 200, "type": "xsd:integer" },
      "durability": { "current": 85, "max": 100, "type": "xsd:integer" },
      "level": { "current": 42, "max": 100, "type": "xsd:integer" },
      "enchantment": { "value": "fire", "type": "xsd:string" },
      "critical_chance": { "value": 0.15, "type": "xsd:decimal" }
    },
    "computed": {
      "dps": "stats.damage.current * (1 + stats.critical_chance.value)"
    }
  },
  
  "visual": {
    "@type": "drc:VisualState",
    "texture_variant": 4,
    "color_tint": "#FF4500",
    "effects": {
      "glow": { "enabled": true, "color": "#FF6600", "intensity": 2.0 },
      "particles": { "system": "ember_trail", "rate": 50 },
      "trail": { "enabled": true, "color": "#FF0000", "length": 1.5 }
    },
    "attachments": [
      { "slot": "gem_socket_1", "asset_id": "drc369:9001", "visible": true }
    ]
  },
  
  "provenance": {
    "@type": "drc:Provenance",
    "creator": {
      "@type": "drc:Identity",
      "address": "0x1234567890abcdef1234567890abcdef12345678",
      "name": "MasterSmith",
      "verified": true
    },
    "creation": {
      "block": 1000000,
      "timestamp": "2025-01-15T12:00:00Z",
      "transaction": "0xabcdef..."
    },
    "history": [
      {
        "event": "forged",
        "block": 1000000,
        "location": "Mount Doom",
        "metadata": { "temperature": 1500 }
      },
      {
        "event": "enchanted",
        "block": 1050000,
        "enchanter": "0xWizard...",
        "enchantment": "fire"
      }
    ],
    "achievements": {
      "kills": 369,
      "bosses_slain": ["Dragon of Abyss", "Lich King"],
      "worlds_visited": ["Eldoria", "Nyx", "Verdant"]
    }
  },
  
  "nested": {
    "@type": "drc:NestedAssets",
    "children": [
      {
        "slot": "gem_socket_1",
        "asset_id": "drc369:9001",
        "type": "gem",
        "removable": true
      },
      {
        "slot": "rune_1",
        "asset_id": "drc369:9002",
        "type": "rune",
        "removable": false
      }
    ],
    "max_children": 5
  },
  
  "permissions": {
    "@type": "drc:Permissions",
    "soulbound": false,
    "tradeable": true,
    "burnable": true,
    "delegations": [
      {
        "delegatee": "0xGameContract...",
        "permissions": ["stats.modify", "visual.modify", "nested.attach"],
        "expiry": null
      }
    ],
    "royalties": {
      "creator": { "address": "0x1234...", "bps": 500 },
      "platform": { "address": "0xDemiurge...", "bps": 250 }
    }
  },
  
  "compatibility": {
    "@type": "drc:Compatibility",
    "engines": ["unreal5", "unity", "godot", "custom"],
    "games": ["game_001", "game_002"],
    "worlds": ["world_001"],
    "protocols": ["DRC-369", "ERC-721-compatible"]
  }
}
```

### 2.2 Minimal Asset Schema

For simple assets that don't need full complexity:

```json
{
  "@context": "https://demiurge.io/schema/drc369/",
  "@type": "drc:Asset",
  "@id": "drc369:42",
  
  "core": {
    "name": "Simple Potion",
    "category": "consumable",
    "image": "ipfs://QmXyz.../potion.png"
  },
  
  "stats": {
    "heal_amount": 50,
    "uses_remaining": 3
  }
}
```

---

## 3. On-Chain Storage

### 3.1 State Encoding

On-chain, state is stored as:

```
Key: DRC369:State:{tokenId}:{path_hash}
Value: {type_byte}{encoded_value}
```

Type bytes:
- `0x00`: null
- `0x01`: uint256
- `0x02`: int256
- `0x03`: bool
- `0x04`: string
- `0x05`: bytes
- `0x06`: address
- `0x07`: array
- `0x08`: map

### 3.2 Efficient Queries

Game engines use the RPC to query state:

```typescript
// Single value
rpc.call('drc369_getState', [tokenId, 'stats/damage'])
// Returns: "150"

// Subtree
rpc.call('drc369_getStateTree', [tokenId, 'visual/'])
// Returns: { glow_effect: true, texture_skin: 4, ... }

// Batch
rpc.call('drc369_getStateBatch', [tokenId, ['stats/damage', 'stats/durability', 'visual/glow_effect']])
// Returns: ["150", "85", "true"]
```

---

## 4. Game Engine Integration

### 4.1 Unreal Engine 5 Plugin

```cpp
// Query asset state
FDemiurgeAsset Asset = DemiurgeClient->GetAsset(TokenId);
int32 Damage = Asset.GetInt("stats/damage");
bool HasGlow = Asset.GetBool("visual/effects/glow/enabled");

// Subscribe to state changes
Asset.OnStateChanged.AddDynamic(this, &AMyActor::HandleStateChange);

// Optimistic update (reflects immediately, confirms in background)
Asset.SetStateOptimistic("stats/durability", 80);
```

### 4.2 Optimistic Updates

```
┌─────────────────────────────────────────────────────────────────┐
│                    OPTIMISTIC UPDATE FLOW                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. User Action (Use item)                                       │
│       ↓                                                          │
│  2. Local State Update (Durability 85 → 80) ← INSTANT           │
│       ↓                                                          │
│  3. Transaction Submitted to Demiurge                            │
│       ↓                                                          │
│  4. Game Continues (no freeze)                                   │
│       ↓                                                          │
│  5. Transaction Confirmed (2-3 seconds later)                    │
│       ↓                                                          │
│  6. State Reconciliation                                         │
│       ├─ Match → Done                                            │
│       └─ Conflict → Rollback local + notify user                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Identity Integration (Sovereign ID)

### 5.1 Global Namespace

Every DRC-369 asset is linked to a Sovereign ID:

```json
{
  "owner": {
    "@type": "drc:SovereignIdentity",
    "id": "did:demiurge:0x1234...",
    "qor_id": "alice.demiurge",
    "linked_identities": [
      { "platform": "steam", "verified": true },
      { "platform": "epic", "verified": true },
      { "platform": "playstation", "verified": false }
    ],
    "reputation": {
      "creator_score": 850,
      "trader_score": 720,
      "achievements": 42
    }
  }
}
```

### 5.2 Cross-Game Persistence

When a user enters a Demiurge-powered game:

```typescript
// Game receives user's entire context
const identity = await DemiurgeAuth.authenticate(userSignature);

// Load all owned assets
const assets = await identity.getAssets({ 
  compatible_with: "game_001" 
});

// Load creative history
const creations = await identity.getCreations();

// Load achievements
const achievements = await identity.getAchievements();
```

---

## 6. Royalty Automation

### 6.1 Revenue Streams

```json
{
  "royalties": {
    "on_trade": {
      "creator": 500,      // 5% to original creator
      "platform": 250,     // 2.5% to Demiurge
      "game": 100          // 1% to game where trade occurred
    },
    "on_use": {
      "creator": 10,       // 0.1% when used in games
      "model_artist": 5    // 0.05% to 3D model artist
    },
    "on_derivative": {
      "original_creator": 200  // 2% on derived works
    }
  }
}
```

### 6.2 Automatic Distribution

Every trade triggers automatic royalty distribution:

```
Sale: 1000 CGT
├── Seller receives: 915 CGT (91.5%)
├── Creator receives: 50 CGT (5%)
├── Platform receives: 25 CGT (2.5%)
└── Game receives: 10 CGT (1%)
```

---

## 7. Implementation Checklist

### Current Status

| Feature | Status | Notes |
|---------|--------|-------|
| Core token operations | ✅ | mint, transfer, burn |
| Dynamic state (flat) | ✅ | Key-value storage |
| Dynamic state (tree) | 🔄 | Need hierarchical queries |
| Soulbound | ✅ | Implemented |
| Nesting | ✅ | Parent/child relations |
| Delegation | ✅ | Permission system |
| CVP Protection | ✅ | Bytecode mutation |
| JSON-LD Schema | 📝 | This document |
| Optimistic Updates | ⏳ | Needs implementation |
| Engine Plugins | ⏳ | UE5, Unity planned |
| Royalty Automation | ⏳ | Needs implementation |

### Priority Tasks

1. **Implement hierarchical state queries** (`getStateTree`, `getStateBatch`)
2. **Add optimistic update support** in SDK
3. **Create Unreal Engine 5 plugin**
4. **Implement royalty distribution**

---

## 8. Appendix: Function Selectors

| Function | Selector | Description |
|----------|----------|-------------|
| `mint(address,uint256,bytes)` | `0x40c10f19` | Mint new token |
| `transfer(address,uint256)` | `0xa9059cbb` | Transfer token |
| `setDynamicState(uint256,bytes32,bytes)` | `0x8b3dd749` | Update state |
| `getDynamicState(uint256,bytes32)` | `0x4e99b800` | Read state |
| `delegate(uint256,address,bytes32[])` | `0x5c19a95c` | Grant delegation |
| `nest(uint256,uint256)` | `0x68313209` | Nest child under parent |
| `isSoulbound(uint256)` | `0x4d445bc7` | Check soulbound status |

---

*DRC-369: Where assets come alive.*
