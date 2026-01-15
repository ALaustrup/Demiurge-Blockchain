import Phaser from 'phaser';
import { GAME_STATE, SKINS } from '../config.js';
import { audioManager } from '../AudioManager.js';
import { blockchainIntegration } from '../blockchain-integration.js';

export class MarketplaceScene extends Phaser.Scene {
    constructor() {
        super('MarketplaceScene');
    }

    async create() {
        // Load real balance from blockchain
        const realBalance = await blockchainIntegration.loadBalance();
        if (realBalance > 0) {
            GAME_STATE.cgtBalance = realBalance;
        }
        
        this.add.image(960, 540, 'background').setDisplaySize(1920, 1080).setAlpha(0.5);

        this.add.text(960, 100, 'CGT MARKETPLACE', {
            fontFamily: '"Press Start 2P"',
            fontSize: '64px',
            fill: '#00ff00'
        }).setOrigin(0.5);

        this.balanceText = this.add.text(960, 180, `#CGT ${GAME_STATE.cgtBalance.toFixed(2)}`, {
            fontFamily: '"Press Start 2P"',
            fontSize: '32px',
            fill: '#ffff00'
        }).setOrigin(0.5);
        
        // Update balance display periodically
        this.time.addEvent({
            delay: 2000,
            callback: async () => {
                const balance = await blockchainIntegration.loadBalance();
                if (balance > 0) {
                    GAME_STATE.cgtBalance = balance;
                    this.balanceText.setText(`#CGT ${GAME_STATE.cgtBalance.toFixed(2)}`);
                }
            },
            loop: true
        });

        const backBtn = this.add.text(100, 100, '< BACK', {
            fontFamily: '"Press Start 2P"',
            fontSize: '24px',
            fill: '#ffffff'
        }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });

        backBtn.on('pointerdown', () => this.scene.start('MenuScene'));

        this.createSkinGrid();
    }

    createSkinGrid() {
        const startX = 400;
        const startY = 400;
        const spacingX = 400;
        const spacingY = 400;

        SKINS.forEach((skin, index) => {
            const row = Math.floor(index / 4);
            const col = index % 4;
            this.createSkinCard(startX + col * spacingX, startY + row * spacingY, skin);
        });
    }

    createSkinCard(x, y, skin) {
        const isOwned = GAME_STATE.ownedSkins.includes(skin.id);
        const isEquipped = GAME_STATE.equippedSkin === skin.id;

        const container = this.add.container(x, y);
        
        const bg = this.add.rectangle(0, 0, 300, 350, 0x222222, 0.8)
            .setStrokeStyle(4, isEquipped ? 0x00ff00 : 0x444444);

        const img = this.add.image(0, -60, skin.image).setScale(0.12);
        
        const name = this.add.text(0, 40, skin.name, {
            fontFamily: '"Press Start 2P"',
            fontSize: '18px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        const priceColor = isOwned ? '#aaaaaa' : '#ffff00';
        const priceText = isOwned ? (isEquipped ? 'EQUIPPED' : 'OWNED') : `${skin.price} CGT`;
        
        const actionBtn = this.add.rectangle(0, 120, 240, 50, isOwned ? 0x444444 : 0x006600)
            .setInteractive({ useHandCursor: true });

        const label = this.add.text(0, 120, isOwned ? (isEquipped ? 'IN USE' : 'EQUIP') : 'BUY', {
            fontFamily: '"Press Start 2P"',
            fontSize: '20px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        container.add([bg, img, name, actionBtn, label]);

        actionBtn.on('pointerdown', async () => {
            if (isOwned) {
                GAME_STATE.equippedSkin = skin.id;
                await blockchainIntegration.saveGameData(GAME_STATE);
                audioManager.playCoin();
                this.scene.restart();
            } else {
                if (GAME_STATE.cgtBalance >= skin.price) {
                    try {
                        // Spend CGT on-chain
                        await blockchainIntegration.spendCGT(skin.price, `Purchase skin: ${skin.name}`);
                        
                        // Update local state
                        GAME_STATE.cgtBalance -= skin.price;
                        GAME_STATE.ownedSkins.push(skin.id);
                        GAME_STATE.equippedSkin = skin.id;
                        
                        // Save game data
                        await blockchainIntegration.saveGameData(GAME_STATE);
                        
                        audioManager.playCoin();
                        this.scene.restart();
                    } catch (error) {
                        console.error('Failed to purchase skin:', error);
                        this.cameras.main.shake(100, 0.005);
                        // Show error message
                        const errorText = this.add.text(960, 250, 'TRANSACTION FAILED', {
                            fontFamily: '"Press Start 2P"',
                            fontSize: '24px',
                            fill: '#ff0000'
                        }).setOrigin(0.5);
                        this.time.delayedCall(2000, () => errorText.destroy());
                    }
                } else {
                    this.cameras.main.shake(100, 0.005);
                }
            }
        });
    }
}
