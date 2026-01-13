# 🎮 Rosebud.AI Master System Prompt

> *The definitive prompt for creating Demiurge Ecosystem games*

---

## 📋 Copy/Paste This Prompt into Rosebud.AI

```
Act as a Lead Developer for the Demiurge Blockchain Ecosystem. We are building a Web3 game that will live inside a monorepo hub at Demiurge.Cloud.

Core Constraints:

Authentication: The game must look for a window.parent.QOR_ID object to identify the user. Use window.DemiurgeHUD.getQORID() to get the user's QOR ID.

Currency: All in-game economy must use 'Creator God Token' (CGT). Implement a getCGTBalance() and spendCGT() function that communicates with the parent window via postMessage. Use window.DemiurgeHUD.getCGTBalance() and window.DemiurgeHUD.spendCGT(amount, reason).

Assets: If the user owns a DRC-369 NFT (check window.parent.userAssets or window.DemiurgeHUD.getUserAssets()), enable the [INSERT ASSET TYPE, e.g., 'Golden Aura'] effect or item. Use window.DemiurgeHUD.ownsAsset(uuid) to check for specific assets.

Progression: Upon [INSERT WIN CONDITION], send an 'UPDATE_XP' message to the parent hub to increase the user's QOR ID level. Use window.DemiurgeHUD.updateAccountXP(xp, source) where source is 'game_win', 'tutorial', etc.

Aesthetic: Use a professional Glassmorphism UI. All menus should have deep-space black backgrounds (85% opacity), heavy backdrop blur, and 1px pulsing chroma borders (Cyan #00f2ff to Violet #7000ff).

Please initialize the base game loop for a [INSERT GAME GENRE] that follows these Web3 integration rules.
```

---

## 🎯 Usage Instructions

### Step 1: Replace Placeholders

Before using the prompt, replace:
- `[INSERT ASSET TYPE]` - e.g., "Golden Aura", "Chronos Glaive", "Time Distortion"
- `[INSERT WIN CONDITION]` - e.g., "defeating the final boss", "reaching level 10", "completing the puzzle"
- `[INSERT GAME GENRE]` - e.g., "action RPG", "puzzle game", "battle royale"

### Step 2: Example Usage

**For an Action RPG:**
```
Act as a Lead Developer for the Demiurge Blockchain Ecosystem...

[Full prompt with:]
- Asset Type: "Chronos Glaive" (if user owns this DRC-369 weapon, enable it in-game)
- Win Condition: "defeating the final boss"
- Game Genre: "action RPG"
```

**For a Puzzle Game:**
```
Act as a Lead Developer for the Demiurge Blockchain Ecosystem...

[Full prompt with:]
- Asset Type: "Time Distortion" (if user owns this DRC-369 item, grant extra time)
- Win Condition: "completing all 50 levels"
- Game Genre: "puzzle game"
```

---

## 🔧 Integration Checklist

After Rosebud.AI generates your game, ensure:

- [ ] Game checks for `window.DemiurgeHUD` on load
- [ ] Game calls `getCGTBalance()` to display wallet
- [ ] Game uses `spendCGT()` for in-game purchases
- [ ] Game checks `getUserAssets()` for owned NFTs
- [ ] Game calls `updateAccountXP()` on win conditions
- [ ] UI uses Glassmorphism styling (dark backgrounds, blur, chroma borders)
- [ ] Game works in iframe (tested in `/play/[gameId]`)

---

## 📚 API Reference

### DemiurgeHUD Methods

```javascript
// Get user's QOR ID
const qorId = await window.DemiurgeHUD.getQORID();

// Get CGT balance
const balance = await window.DemiurgeHUD.getCGTBalance();

// Spend CGT
const txHash = await window.DemiurgeHUD.spendCGT(100, 'in-game purchase');

// Get user's assets
const assets = await window.DemiurgeHUD.getUserAssets();

// Check if user owns specific asset
const ownsGlaive = await window.DemiurgeHUD.ownsAsset('0x7a1f9c3e...');

// Update XP (fire and forget)
window.DemiurgeHUD.updateAccountXP(25, 'game_win');

// Open social platform
window.DemiurgeHUD.openSocial();
```

### Legacy Compatibility

For games using the old API:

```javascript
// Old way (still works)
window.QOR_ID.get().then(qorId => { ... });
window.userAssets.get().then(assets => { ... });
window.userAssets.owns(uuid).then(owns => { ... });
```

---

## 🎨 Glassmorphism CSS Reference

```css
/* Base Glass Panel */
.glass-panel {
  background: rgba(15, 15, 15, 0.85);
  backdrop-filter: blur(20px);
  border: 1px solid transparent;
  border-image: linear-gradient(45deg, #00f2ff, #7000ff, #00f2ff) 1;
  animation: border-pulse 6s infinite alternate;
}

/* Chroma Glow Effect */
.chroma-glow {
  box-shadow: 0 0 20px rgba(0, 242, 255, 0.3);
  animation: glow-pulse 3s ease-in-out infinite;
}

/* Border Pulse Animation */
@keyframes border-pulse {
  0% { filter: hue-rotate(0deg) brightness(1); }
  100% { filter: hue-rotate(45deg) brightness(1.5); }
}

/* Glow Pulse Animation */
@keyframes glow-pulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}
```

---

## 🚀 Example Game Integration

```javascript
// Example: Check for Chronos Glaive NFT on game start
async function initGame() {
  const qorId = await window.DemiurgeHUD.getQORID();
  console.log('Player:', qorId);
  
  // Check if player owns Chronos Glaive
  const ownsGlaive = await window.DemiurgeHUD.ownsAsset('0x7a1f9c3e...');
  if (ownsGlaive) {
    // Enable Glaive in-game
    player.equipWeapon('chronos_glaive');
    player.addEffect('temporal_rift'); // 30% slow aura
  }
  
  // Display CGT balance
  const balance = await window.DemiurgeHUD.getCGTBalance();
  updateUI({ balance });
}

// Example: On game win
function onGameWin() {
  // Award XP
  window.DemiurgeHUD.updateAccountXP(25, 'game_win');
  
  // Optional: Spend CGT for bonus rewards
  window.DemiurgeHUD.spendCGT(10, 'victory_bonus').then(txHash => {
    console.log('Bonus purchased:', txHash);
  });
}
```

---

## 📝 Notes

- **Security**: Games run in sandboxed iframes. They cannot access the parent window directly except via `postMessage`.
- **Performance**: Asset checks are cached. Don't check on every frame.
- **Error Handling**: Always wrap API calls in try/catch. The HUD may not be available in all contexts.
- **Testing**: Test your game in the `/play/[gameId]` route to ensure proper integration.

---

**Last Updated:** January 13, 2026  
**Version:** 1.0  
**Maintainer:** Demiurge Development Team
