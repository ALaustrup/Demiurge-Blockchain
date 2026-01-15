import Phaser from 'phaser';
import { GAME_CONFIG } from '../config.js';

export default class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    preload() {
        // Load background and core
        this.load.image('background', GAME_CONFIG.ASSETS.BACKGROUND);
        this.load.image('mining_core', GAME_CONFIG.ASSETS.MINING_CORE);

        // Progress bar
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);

        this.load.on('progress', (value) => {
            progressBar.clear();
            progressBar.fillStyle(0x00ffff, 1);
            progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30);
        });

        this.load.on('complete', () => {
            progressBar.destroy();
            progressBox.destroy();
        });
    }

    create() {
        this.scene.start('LoginScene');
    }
}
