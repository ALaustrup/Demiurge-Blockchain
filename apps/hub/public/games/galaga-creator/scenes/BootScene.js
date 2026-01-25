import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    preload() {
        const progress = this.add.graphics();
        this.load.on('progress', (value) => {
            progress.clear();
            progress.fillStyle(0xffffff, 1);
            progress.fillRect(0, 540, 1920 * value, 20);
        });

        // Load assets from local folder
        this.load.image('player', 'assets/player_ship.webp');
        this.load.image('ship_skin_red', 'assets/ship_skin_red.webp');
        this.load.image('ship_skin_gold', 'assets/ship_skin_gold.webp');
        this.load.image('ship_skin_void', 'assets/ship_skin_void.webp');
        this.load.image('enemy_bee', 'assets/enemy_bee.webp');
        this.load.image('enemy_butterfly', 'assets/enemy_butterfly.webp');
        this.load.image('enemy_boss', 'assets/enemy_boss.webp');
        this.load.image('coin', 'assets/gold_coin.webp');
        this.load.image('background', 'assets/space_background.webp');
        
        // Handle load errors gracefully
        this.load.on('loaderror', (file) => {
            console.warn('Failed to load asset:', file.key, file.src);
        });
    }

    create() {
        this.scene.start('MenuScene');
    }
}
