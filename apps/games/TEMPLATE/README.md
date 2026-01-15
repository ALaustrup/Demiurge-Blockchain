# Game Template

This is a template for creating games that integrate with the Demiurge ecosystem.

## Quick Start

1. Copy this template directory to create your new game
2. Copy `BlockchainManager.js` into your game's root directory
3. Follow the integration guide: `docs/ROSEBUD_AI_INTEGRATION.md`

## BlockchainManager.js

The `BlockchainManager.js` file provides a clean wrapper around the Demiurge HUD API. It:
- Manages wallet connection state
- Provides methods for CGT balance, spending, XP updates, and NFT checking
- Includes mock mode for development/testing
- Handles errors gracefully

See `docs/ROSEBUD_AI_INTEGRATION.md` for full documentation and usage examples.

## Files

- `BlockchainManager.js` - Blockchain integration wrapper class
- `metadata.json` - Game metadata (required for registration)

## Integration Steps

1. **Include BlockchainManager.js** in your game's HTML:
   ```html
   <script src="BlockchainManager.js"></script>
   ```

2. **Initialize in your game code**:
   ```javascript
   const blockchain = new BlockchainManager({
     mockMode: false, // Set to true for local testing
     onConnectionChange: (connected) => {
       console.log('Wallet connected:', connected);
     }
   });
   ```

3. **Connect on game start**:
   ```javascript
   await blockchain.connectDemiurgeWallet();
   const balance = await blockchain.getBalanceInCGT();
   ```

4. **Use throughout your game**:
   - `blockchain.getBalanceInCGT()` - Display balance
   - `blockchain.spendCGT(amount, reason)` - Make purchases
   - `blockchain.updateAccountXP(xp, source)` - Award XP
   - `blockchain.ownsAsset(uuid)` - Check NFT ownership

For detailed examples, see `docs/ROSEBUD_AI_INTEGRATION.md`.
