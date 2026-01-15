import Phaser from 'phaser';

export class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
    }

    create() {
        this.add.image(960, 540, 'background').setDisplaySize(1920, 1080).setAlpha(0.5);
        
        const title = this.add.text(960, 400, 'GALAGA CREATOR', {
            fontFamily: '"Press Start 2P"',
            fontSize: '84px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        const startBtn = this.add.text(960, 550, 'PRESS START', {
            fontFamily: '"Press Start 2P"',
            fontSize: '42px',
            fill: '#ffff00'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        const marketBtn = this.add.text(960, 680, 'CGT MARKETPLACE', {
            fontFamily: '"Press Start 2P"',
            fontSize: '32px',
            fill: '#00ff00'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        this.tweens.add({
            targets: startBtn,
            alpha: 0,
            duration: 800,
            yoyo: true,
            repeat: -1
        });

        const instructions = this.add.text(960, 800, 'ARROWS: MOVE | SPACE: FIRE | SHIFT: BOMB\nCOLLECT COINS FOR CGT', {
            fontFamily: '"Press Start 2P"',
            fontSize: '24px',
            fill: '#00ffff',
            align: 'center'
        }).setOrigin(0.5);

        startBtn.on('pointerdown', () => {
            import('../AudioManager.js').then(m => m.audioManager.startMusic());
            this.scene.start('GameScene');
        });

        marketBtn.on('pointerdown', () => {
            this.scene.start('MarketplaceScene');
        });

        this.input.keyboard.on('keydown-SPACE', () => {
            import('../AudioManager.js').then(m => m.audioManager.startMusic());
            this.scene.start('GameScene');
        });
    }
}
