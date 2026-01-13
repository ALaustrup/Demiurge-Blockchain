# Demiurge Games Directory

This directory contains Rosebud.AI exported games that are integrated into the Demiurge ecosystem.

## Structure

Each game should be placed in its own subdirectory:

```
games/
├── game-one/
│   ├── index.html
│   ├── assets/
│   └── metadata.json
└── game-two/
    ├── index.html
    ├── assets/
    └── metadata.json
```

## Game Metadata

Each game directory should contain a `metadata.json` file:

```json
{
  "id": "game-one",
  "title": "Game One",
  "description": "An epic adventure...",
  "thumbnail": "/games/game-one/thumb.jpg",
  "entryPoint": "index.html",
  "version": "1.0.0",
  "author": "Developer Name"
}
```

## HUD Integration

Games automatically receive the Demiurge HUD via the injection script. The HUD provides:

- CGT balance display
- Social chat overlay
- Account level display
- Game-specific controls

See `packages/ui-shared/src/inject-hud.js` for the injection script.
