import Phaser from 'phaser';
import { GAME_CONFIG } from '../config.js';
import BlockchainManager from '../managers/BlockchainManager.js';
import * as Tone from 'tone';

export default class LoginScene extends Phaser.Scene {
    constructor() {
        super('LoginScene');
        this.blockchain = new BlockchainManager({
            mockMode: false, // Set to true for development without HUD
        });
    }

    create() {
        const { width, height } = this.scale;
        
        // Background
        this.add.image(width / 2, height / 2, 'background').setDisplaySize(width, height).setAlpha(0.3);
        
        // Glassmorphism Panel
        const panelWidth = 600;
        const panelHeight = 500;
        const panel = this.add.graphics();
        panel.fillStyle(GAME_CONFIG.COLORS.GLASS, 0.8);
        panel.fillRoundedRect(width / 2 - panelWidth / 2, height / 2 - panelHeight / 2, panelWidth, panelHeight, 20);
        panel.lineStyle(2, GAME_CONFIG.COLORS.CYAN, 0.5);
        panel.strokeRoundedRect(width / 2 - panelWidth / 2, height / 2 - panelHeight / 2, panelWidth, panelHeight, 20);

        // Header
        this.add.text(width / 2, height / 2 - 200, 'CGT-MINER ARCADE', {
            fontFamily: '"Press Start 2P"',
            fontSize: '32px',
            fill: '#00FFC8'
        }).setOrigin(0.5);

        this.add.text(width / 2, height / 2 - 150, 'CORE AUTHENTICATION REQUIRED', {
            fontFamily: 'Arial',
            fontSize: '18px',
            fill: '#FF3D00'
        }).setOrigin(0.5);

        // Info
        this.add.text(width / 2, height / 2 - 50, 'QOR ID AUTHENTICATION', {
            fontFamily: 'Arial',
            fontSize: '20px',
            fill: '#ffffff'
        }).setOrigin(0.5);
        
        this.add.text(width / 2, height / 2, 'Connecting to Demiurge Wallet...', {
            fontFamily: 'Arial',
            fontSize: '16px',
            fill: '#aaaaaa',
            align: 'center'
        }).setOrigin(0.5);

        // Login Button (Hexagon style)
        const btnX = width / 2;
        const btnY = height / 2 + 150;
        const loginBtn = this.add.container(btnX, btnY);
        
        const btnBg = this.add.graphics();
        btnBg.fillStyle(GAME_CONFIG.COLORS.ORANGE, 1);
        btnBg.fillRoundedRect(-150, -30, 300, 60, 10);
        
        const btnText = this.add.text(0, 0, 'INITIALIZE SESSION', {
            fontFamily: '"Press Start 2P"',
            fontSize: '18px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        loginBtn.add([btnBg, btnText]);
        btnBg.setInteractive(new Phaser.Geom.Rectangle(-150, -30, 300, 60), Phaser.Geom.Rectangle.Contains);
        
        btnBg.on('pointerdown', async () => {
            // Start audio on user gesture
            await Tone.start();
            
            btnText.setText('CONNECTING...');
            try {
                const connected = await this.blockchain.connectDemiurgeWallet();
                if (connected) {
                    const qorId = await this.blockchain.getQORID();
                    btnText.setText(`CONNECTED: ${qorId}`);
                    
                    // Start session
                    await this.blockchain.startSession();
                    
                    // Award XP for starting game
                    this.blockchain.updateAccountXP(10, 'game_start');
                    
                    this.cameras.main.fade(500, 0, 0, 0);
                    this.time.delayedCall(500, () => {
                        this.scene.start('GameScene', { blockchain: this.blockchain });
                    });
                } else {
                    btnText.setText('ERROR: RETRY');
                }
            } catch (error) {
                console.error('Connection error:', error);
                btnText.setText('ERROR: CHECK CONSOLE');
            }
        });

        btnBg.on('pointerover', () => btnBg.setAlpha(0.8));
        btnBg.on('pointerout', () => btnBg.setAlpha(1));
    }
}
