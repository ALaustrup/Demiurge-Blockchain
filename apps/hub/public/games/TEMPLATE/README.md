# Game Template

This is a template directory for adding games to the Demiurge ecosystem.

## Structure

```
your-game/
├── index.html          # Main entry point (Rosebud.AI export)
├── assets/             # Game assets (images, sounds, etc.)
│   └── ...
├── metadata.json       # Game metadata (see below)
└── README.md          # Optional: Game documentation
```

## metadata.json

Required fields:
- `id`: Unique game identifier (lowercase, no spaces)
- `title`: Display name
- `description`: Game description
- `entryPoint`: Path to main HTML file (usually "index.html")
- `version`: Version string (e.g., "1.0.0")

Optional fields:
- `thumbnail`: Path to thumbnail image
- `author`: Creator name
- `tags`: Array of tags for categorization
- `minLevel`: Minimum QOR ID level required to play

## HUD Integration

Your game will automatically receive the Demiurge HUD via `inject-hud.js`. The HUD provides:

- `window.DemiurgeHUD.getCGTBalance()` - Get user's CGT balance
- `window.DemiurgeHUD.getUserAssets()` - Get user's DRC-369 assets
- `window.DemiurgeHUD.updateAccountXP(xp)` - Update user's XP
- `window.DemiurgeHUD.openSocial()` - Open social feed

See `packages/ui-shared/src/inject-hud.js` for the full API.

## Adding Your Game

1. Copy this template directory
2. Rename it to your game's ID
3. Place your Rosebud.AI export files in the directory
4. Update `metadata.json` with your game's information
5. Register the game via API: `POST /api/games` with the metadata

## Example

```bash
# Copy template
cp -r apps/games/TEMPLATE apps/games/my-awesome-game

# Edit metadata.json
# Place your game files
# Register via API
```
