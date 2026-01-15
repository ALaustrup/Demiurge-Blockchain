import Phaser from 'phaser';
import BootScene from './scenes/BootScene.js';
import LoginScene from './scenes/LoginScene.js';
import GameScene from './scenes/GameScene.js';
import { GAME_CONFIG } from './config.js';

const config = {
    type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: GAME_CONFIG.WIDTH,
        height: GAME_CONFIG.HEIGHT
    },
    parent: 'game-container',
    backgroundColor: '#000505',
    scene: [BootScene, LoginScene, GameScene]
};

const game = new Phaser.Game(config);
