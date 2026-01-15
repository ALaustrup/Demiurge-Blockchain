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

        this.load.image('player', 'https://rosebud.ai/assets/player_ship.webp?Lybs');
        this.load.image('ship_skin_red', 'https://rosebud.ai/assets/ship_skin_red.webp?bMnV');
        this.load.image('ship_skin_gold', 'https://rosebud.ai/assets/ship_skin_gold.webp?kN2N');
        this.load.image('ship_skin_void', 'https://rosebud.ai/assets/ship_skin_void.webp?w7qc');
        this.load.image('enemy_bee', 'https://rosebud.ai/assets/enemy_bee.webp?QHjV');
        this.load.image('enemy_butterfly', 'https://rosebud.ai/assets/enemy_butterfly.webp?l3fx');
        this.load.image('enemy_boss', 'https://rosebud.ai/assets/enemy_boss.webp?RSuY');
        this.load.image('coin', 'https://rosebud.ai/assets/gold_coin.webp?Fy77');
        this.load.image('background', 'https://rosebud.ai/assets/space_background.webp?0RIu');
        
        // Simple shapes for bullets if needed, but let's use graphics
    }

    create() {
        this.scene.start('MenuScene');
    }
}
