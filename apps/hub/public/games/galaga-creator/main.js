import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { GameScene } from './scenes/GameScene.js';
import { UpgradeScene } from './scenes/UpgradeScene.js';
import { MarketplaceScene } from './scenes/MarketplaceScene.js';
import { CONFIG } from './config.js';

const config = {
    type: Phaser.AUTO,
    width: CONFIG.width,
    height: CONFIG.height,
    parent: 'game-container',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [BootScene, MenuScene, GameScene, UpgradeScene, MarketplaceScene]
};

new Phaser.Game(config);
