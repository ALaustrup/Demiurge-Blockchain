# Phaser.js Integration Guide

Integrate your Phaser.js game with the Demiurge blockchain to enable CGT rewards, DRC-369 NFTs, and on-chain gameplay.

## Quick Start

### 1. Add the HUD Script

Include the Demiurge HUD in your `index.html`:

```html
<script src="/inject-hud.js"></script>
<script type="module" src="main.js"></script>
```

Or load it dynamically:

```javascript
// Fallback for standalone mode
const script = document.createElement('script');
script.src = '/inject-hud.js';
script.onerror = () => {
  window.DemiurgeHUD = { init: () => {}, update: () => {}, isAvailable: false };
};
document.head.appendChild(script);
```

### 2. Initialize the HUD

In your game's boot scene:

```javascript
class BootScene extends Phaser.Scene {
  create() {
    if (window.DemiurgeHUD?.isAvailable) {
      window.DemiurgeHUD.init({
        position: 'top-right',
        onEarn: (amount) => {
          console.log(`Earned ${amount} CGT!`);
        }
      });
    }
    
    this.scene.start('GameScene');
  }
}
```

### 3. Award CGT to Players

When players achieve something reward-worthy:

```javascript
// In your game logic
function onEnemyKilled(enemy) {
  const cgtReward = enemy.isBoss ? 50 : 1;
  
  if (window.DemiurgeHUD?.isAvailable) {
    window.DemiurgeHUD.earnCGT(cgtReward, 'enemy_kill');
  }
  
  // Update local score
  this.score += cgtReward;
  this.updateScoreDisplay();
}
```

## Full Integration Example

### Project Structure

```
my-phaser-game/
├── index.html
├── main.js
├── config.js
├── scenes/
│   ├── BootScene.js
│   ├── MenuScene.js
│   └── GameScene.js
├── entities/
│   └── Player.js
└── assets/
    └── ...
```

### index.html

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Phaser Game</title>
  <script type="importmap">
    {
      "imports": {
        "phaser": "https://esm.sh/phaser@3.70.0"
      }
    }
  </script>
  <style>
    html, body { margin: 0; padding: 0; background: black; }
    #game-container { width: 100%; height: 100vh; }
  </style>
</head>
<body>
  <div id="game-container"></div>
  <script src="/inject-hud.js"></script>
  <script type="module" src="main.js"></script>
</body>
</html>
```

### main.js

```javascript
import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { GameScene } from './scenes/GameScene.js';

const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 1920,
  height: 1080,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 0 }, debug: false }
  },
  scene: [BootScene, MenuScene, GameScene]
};

new Phaser.Game(config);
```

### scenes/GameScene.js

```javascript
import Phaser from 'phaser';

export class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
    this.score = 0;
    this.cgtEarned = 0;
  }

  create() {
    // Set up game world
    this.player = this.physics.add.sprite(400, 300, 'player');
    this.cursors = this.input.keyboard.createCursorKeys();
    
    // Connect to blockchain (non-blocking)
    this.initBlockchain();
    
    // UI
    this.scoreText = this.add.text(20, 20, 'Score: 0', { fontSize: '32px' });
    this.cgtText = this.add.text(20, 60, 'CGT: 0', { fontSize: '32px', color: '#00ff00' });
  }

  async initBlockchain() {
    if (window.DemiurgeHUD?.isAvailable) {
      // Load player's balance
      const balance = await window.DemiurgeHUD.getBalance();
      this.cgtText.setText(`CGT: ${balance}`);
      
      // Load player's NFT assets
      const assets = await window.DemiurgeHUD.getAssets('ship_skin');
      if (assets.length > 0) {
        this.applyPlayerSkin(assets[0]);
      }
    }
  }

  update() {
    // Player movement
    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-300);
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(300);
    } else {
      this.player.setVelocityX(0);
    }
  }

  awardCGT(amount, reason) {
    this.cgtEarned += amount;
    
    if (window.DemiurgeHUD?.isAvailable) {
      window.DemiurgeHUD.earnCGT(amount, reason);
    }
    
    this.cgtText.setText(`CGT: ${this.cgtEarned}`);
    
    // Visual feedback
    const popup = this.add.text(this.player.x, this.player.y - 50, `+${amount} CGT`, {
      fontSize: '24px',
      color: '#00ff00'
    });
    
    this.tweens.add({
      targets: popup,
      y: popup.y - 50,
      alpha: 0,
      duration: 1000,
      onComplete: () => popup.destroy()
    });
  }

  applyPlayerSkin(asset) {
    // Apply DRC-369 NFT skin to player
    if (asset.metadata?.image) {
      this.textures.addBase64(asset.id, asset.metadata.image);
      this.player.setTexture(asset.id);
    }
  }
}
```

## HUD API Reference

### DemiurgeHUD.init(options)

Initialize the HUD overlay.

```javascript
DemiurgeHUD.init({
  position: 'top-right',  // 'top-left', 'top-right', 'bottom-left', 'bottom-right'
  compact: false,         // Use compact mode
  onEarn: (amount) => {}, // Callback when CGT is earned
  onSpend: (amount) => {},// Callback when CGT is spent
  onAssets: () => {}      // Callback when viewing assets
});
```

### DemiurgeHUD.earnCGT(amount, reason)

Award CGT to the player.

```javascript
DemiurgeHUD.earnCGT(10, 'boss_defeat');
DemiurgeHUD.earnCGT(1, 'coin_collect');
```

### DemiurgeHUD.getBalance()

Get player's CGT balance.

```javascript
const balance = await DemiurgeHUD.getBalance();
console.log(`Player has ${balance} CGT`);
```

### DemiurgeHUD.getAssets(type)

Get player's DRC-369 assets.

```javascript
const skins = await DemiurgeHUD.getAssets('ship_skin');
const weapons = await DemiurgeHUD.getAssets('weapon');
```

### DemiurgeHUD.update(data)

Update HUD display.

```javascript
DemiurgeHUD.update({
  balance: '1500',
  energy: { current: 80, max: 100, percentage: 80 }
});
```

## Best Practices

### Performance
- Load blockchain data asynchronously (don't block game start)
- Cache asset data locally
- Batch CGT awards (don't call for every small action)

### User Experience
- Show loading states while fetching blockchain data
- Provide visual feedback for CGT earnings
- Support offline/standalone mode

### Error Handling
```javascript
try {
  await DemiurgeHUD.earnCGT(amount, reason);
} catch (err) {
  console.warn('CGT award failed:', err);
  // Game continues normally
}
```

## Testing

### Local Development
Run your game locally and it will work in standalone mode:

```bash
npx serve .
# Open http://localhost:3000
```

### With Demiurge HUD
Test with the HUD by accessing through the Demiurge hub:

```
https://demiurge.cloud/play/your-game-id
```

## Submission Checklist

- [ ] Game loads without errors
- [ ] HUD integration works (or graceful fallback)
- [ ] CGT rewards are balanced
- [ ] Assets load from local paths (not external CDNs)
- [ ] Responsive scaling works
- [ ] Keyboard/mouse input works in iframe

## Support

- **Examples**: See `/games/galaga-creator/` for a complete example
- **Discord**: [discord.gg/demiurge](https://discord.gg/demiurge)
- **Documentation**: [docs.demiurge.cloud](https://docs.demiurge.cloud)
