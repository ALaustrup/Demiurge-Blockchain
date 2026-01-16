# pallet-session-keys

**Phase 11: Revolutionary Features Foundation**

Session Keys pallet for temporary authorization in game sessions. Eliminates wallet popups by allowing users to create temporary keys that automatically expire.

## Features

- ✅ **Temporary Key Generation** - Create session-specific authorization keys
- ✅ **Auto-Expiry** - Keys automatically expire after session timeout
- ✅ **Granular Permissions** - Fine-grained control over what keys can do
- ✅ **Game Session Integration** - Designed for seamless game integration

## Status

**Current:** Initial implementation complete  
**Next:** Integration with runtime and testing

## Usage

### Create Session Key

```rust
SessionKeys::create_session_key(
    origin,
    game_id: Vec<u8>,
    permissions: Vec<Permission>,
    duration_blocks: BlockNumber,
)?;
```

### Revoke Session Key

```rust
SessionKeys::revoke_session_key(
    origin,
    session_key_id: SessionKeyId,
)?;
```

## Development

Build the pallet independently (avoids node dependency conflicts):

```bash
cd blockchain/pallets/pallet-session-keys
cargo check
```

## Next Steps

1. Add runtime integration
2. Add tests
3. Add benchmarks
4. Integrate with wallet system
5. Add game session management

---

**Part of Phase 11: Revolutionary Features Foundation**
