# 🎮 Game Integration Guide

**Phase 4 Status:** Ready for your first game! 🚀

---

## Quick Start: Adding Your First Game

### Step 1: Prepare Your Game Files

Place your Rosebud.AI exported game in the games directory:

```bash
apps/games/your-game-id/
├── index.html          # Main entry point (required)
├── assets/             # Game assets (images, sounds, etc.)
│   └── ...
└── metadata.json       # Game metadata (see below)
```

### Step 2: Create metadata.json

Create `apps/games/your-game-id/metadata.json`:

```json
{
  "id": "your-game-id",
  "title": "Your Game Title",
  "description": "A brief description of your game",
  "thumbnail": "/games/your-game-id/thumb.jpg",
  "entryPoint": "index.html",
  "version": "1.0.0",
  "author": "Your Name",
  "tags": ["action", "adventure"],
  "minLevel": 1
}
```

**Required Fields:**
- `id`: Unique identifier (lowercase, no spaces, e.g., "my-awesome-game")
- `title`: Display name
- `description`: Game description
- `entryPoint`: Path to main HTML file (usually "index.html")
- `version`: Version string

**Optional Fields:**
- `thumbnail`: Path to thumbnail image
- `author`: Creator name
- `tags`: Array of tags for categorization
- `minLevel`: Minimum QOR ID level required (default: 1)

### Step 3: Register Your Game

#### Option A: Via API (Recommended)

```bash
curl -X POST http://localhost:3000/api/games \
  -H "Content-Type: application/json" \
  -d '{
    "id": "your-game-id",
    "title": "Your Game Title",
    "description": "Game description",
    "entryPoint": "index.html",
    "version": "1.0.0"
  }'
```

#### Option B: Manual Registration (Development)

Add to `apps/hub/src/lib/game-registry.ts`:

```typescript
gameRegistry.register({
  id: 'your-game-id',
  title: 'Your Game Title',
  description: 'Game description',
  thumbnail: '/games/your-game-id/thumb.jpg',
  entryPoint: 'index.html',
  version: '1.0.0',
  author: 'Your Name',
});
```

### Step 4: Access Your Game

Once registered, your game will be available at:

```
http://localhost:3000/play/your-game-id
```

The game will be loaded in an iframe with the Demiurge HUD automatically injected.

---

## HUD Integration

Your game automatically receives the Demiurge HUD via `inject-hud.js`. The HUD provides:

### Available APIs

```javascript
// Get user's CGT balance
const balance = await window.DemiurgeHUD.getCGTBalance();
// Returns: Promise<string> (balance in smallest units, e.g., "100000000000" = 1000 CGT)

// Get user's DRC-369 assets
const assets = await window.DemiurgeHUD.getUserAssets();
// Returns: Promise<Array> (array of asset UUIDs)

// Update user's XP (for leveling)
window.DemiurgeHUD.updateAccountXP(100);
// Adds 100 XP to user's account

// Open social feed
window.DemiurgeHUD.openSocial();
// Opens the social platform overlay
```

### Example Usage

```javascript
// In your game code
async function checkBalance() {
  try {
    const balance = await window.DemiurgeHUD.getCGTBalance();
    const balanceNum = BigInt(balance);
    const cgtAmount = Number(balanceNum) / 100_000_000; // Convert to CGT
    console.log(`Player has ${cgtAmount} CGT`);
  } catch (error) {
    console.error('Failed to get balance:', error);
  }
}

// Award XP when player completes a level
function onLevelComplete() {
  window.DemiurgeHUD.updateAccountXP(50); // Award 50 XP
}
```

---

## Game Requirements

### File Structure

- **index.html**: Must be the main entry point
- **Assets**: Place in `assets/` subdirectory
- **Metadata**: `metadata.json` in the game root

### Technical Requirements

1. **No External Dependencies**: Your game should be self-contained (all assets bundled)
2. **PostMessage API**: The HUD uses `postMessage` for communication
3. **CORS**: Ensure your game doesn't block iframe embedding
4. **Responsive**: Games should work in iframe containers

### Best Practices

- Use relative paths for assets (`./assets/image.png` not `/assets/image.png`)
- Test in iframe before deploying
- Handle HUD API calls gracefully (check if `window.DemiurgeHUD` exists)
- Optimize assets for web (compress images, minify code)

---

## Testing Your Game

### Local Testing

1. **Start the Hub:**
   ```bash
   cd apps/hub
   npm run dev
   ```

2. **Place Your Game:**
   ```bash
   # Copy your game files
   cp -r /path/to/your/game apps/games/your-game-id/
   ```

3. **Register:**
   - Use API or manual registration (see Step 3)

4. **Access:**
   - Navigate to `http://localhost:3000/play/your-game-id`
   - Verify game loads correctly
   - Test HUD APIs in browser console

### Debugging

- **Browser Console**: Check for errors in the game iframe
- **Network Tab**: Verify assets load correctly
- **HUD API**: Test `window.DemiurgeHUD` in console
- **PostMessage**: Monitor `postMessage` events in DevTools

---

## Game Portal Integration

Your game will automatically appear in:

- **Casino Portal** (`/portal`): Game cards with thumbnails
- **Game Directory** (`/games`): List of all games
- **Search**: Searchable by title, description, tags

### Dynamic Stats

Games can display:
- **CGT Pool**: Current CGT in the game's pool
- **Active Users**: Number of players currently in-game

These are updated via the game registry API (future feature).

---

## Next Steps

1. **Add Your Game**: Follow Steps 1-4 above
2. **Test Integration**: Verify HUD APIs work
3. **Customize**: Add game-specific features using HUD APIs
4. **Deploy**: Once ready, deploy to production

---

## Support

- **Documentation**: See `docs/` directory
- **HUD API**: `packages/ui-shared/src/inject-hud.js`
- **Game Wrapper**: `apps/hub/src/components/GameWrapper.tsx`
- **Registry**: `apps/hub/src/lib/game-registry.ts`

---

**Ready to add your game?** Follow the steps above and you'll be live in minutes! 🎮
