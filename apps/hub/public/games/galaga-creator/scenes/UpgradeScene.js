import Phaser from 'phaser';
import { GAME_STATE } from '../config.js';

export class UpgradeScene extends Phaser.Scene {
    constructor() {
        super('UpgradeScene');
    }

    create() {
        this.add.image(960, 540, 'background').setDisplaySize(1920, 1080).setAlpha(0.5);

        this.add.text(960, 200, 'SELECT UPGRADE', {
            fontFamily: '"Press Start 2P"',
            fontSize: '64px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        const options = [
            { id: 'ammo', name: 'AMMO +20%', desc: 'Faster firing rate' },
            { id: 'speed', name: 'SPEED +20%', desc: 'Faster movement' },
            { id: 'laser', name: 'LASER (10s)', desc: 'Powerful beam' },
            { id: 'defense', name: 'DEFENSE', desc: 'Shield layer' },
            { id: 'bomb', name: 'ADD BOMB', desc: 'Clear screen' }
        ];

        // Shuffle and pick 3
        const selected = Phaser.Utils.Array.Shuffle(options).slice(0, 3);

        selected.forEach((opt, index) => {
            this.createUpgradeButton(960, 400 + index * 180, opt);
        });
    }

    createUpgradeButton(x, y, option) {
        const container = this.add.container(x, y);
        
        const bg = this.add.rectangle(0, 0, 800, 140, 0x333333, 0.8)
            .setStrokeStyle(4, 0xffffff)
            .setInteractive({ useHandCursor: true });

        const title = this.add.text(0, -25, option.name, {
            fontFamily: '"Press Start 2P"',
            fontSize: '32px',
            fill: '#ffff00'
        }).setOrigin(0.5);

        const desc = this.add.text(0, 25, option.desc, {
            fontFamily: '"Press Start 2P"',
            fontSize: '18px',
            fill: '#cccccc'
        }).setOrigin(0.5);

        container.add([bg, title, desc]);

        bg.on('pointerover', () => bg.setStrokeStyle(6, 0xffff00));
        bg.on('pointerout', () => bg.setStrokeStyle(4, 0xffffff));
        
        bg.on('pointerdown', () => {
            this.applyUpgrade(option.id);
            this.scene.start('GameScene');
        });
    }

    applyUpgrade(id) {
        switch (id) {
            case 'ammo':
                GAME_STATE.upgrades.ammo += 20;
                break;
            case 'speed':
                GAME_STATE.upgrades.speed += 20;
                break;
            case 'laser':
                GAME_STATE.upgrades.laser += 10;
                break;
            case 'defense':
                GAME_STATE.upgrades.defense += 1;
                break;
            case 'bomb':
                GAME_STATE.upgrades.bombs += 1;
                break;
        }
    }
}
