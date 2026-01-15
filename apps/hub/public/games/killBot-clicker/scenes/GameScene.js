import Phaser from 'phaser';
import { GAME_CONFIG } from '../config.js';
import GameState from '../managers/GameState.js';
import SoundManager from '../managers/SoundManager.js';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
        this.gameState = new GameState();
        this.sounds = new SoundManager();
        this.isBreachActive = false;
        this.breachMultiplier = 1;
        this.isBossActive = false;
        this.bossHealth = 0;
        this.bossMaxHealth = 0;
        this.isSuperModeActive = false;
        this.superModeMultiplier = 1;
        this.isStrikeReady = false;
        this.strikeCharge = 0;
    }

    init(data) {
        this.api = data.api;
    }

    async create() {
        const { width, height } = this.scale;

        // Initialize sounds
        await this.sounds.init();
        this.sounds.playAmbient();

        // Background
        const bg = this.add.image(width / 2, height / 2, 'background');
        bg.setDisplaySize(width, height);
        bg.setAlpha(0.2).setTint(GAME_CONFIG.COLORS.CYAN);

        // Strike Beam Graphics
        this.strikeBeam = this.add.graphics().setDepth(6000).setAlpha(0);

        // Super Mode Graphics
        this.superModeGraphics = this.add.graphics().setDepth(5000).setAlpha(0);
        this.superModeEdges = this.add.graphics().setDepth(4999).setAlpha(0);

        // Particle System
        this.particles = this.add.particles(0, 0, 'mining_core', {
            scale: { start: 0.2, end: 0 },
            alpha: { start: 0.4, end: 0 },
            speed: { min: 50, max: 150 },
            lifespan: 1200,
            blendMode: 'ADD',
            emitting: false,
            tint: GAME_CONFIG.COLORS.ORANGE
        });

        // Mining Core
        this.core = this.add.image(width / 2, height / 2, 'mining_core');
        this.core.setInteractive({ useHandCursor: true });
        this.core.setScale(0.6).setTint(GAME_CONFIG.COLORS.CYAN);

        // Core rotation
        this.tweens.add({
            targets: this.core,
            angle: 360,
            duration: 20000,
            repeat: -1
        });

        // Core pulse
        this.tweens.add({
            targets: this.core,
            alpha: 0.6,
            duration: 2000,
            yoyo: true,
            repeat: -1
        });

        this.core.on('pointerdown', (pointer) => this.handleMine(pointer));

        // UI
        this.createUI();
        this.createUpgradePanel();
        this.createMarketPanel();
        this.createHeatmap();
        this.createRelicDisplay();
        this.createLeaderboard();
        this.createMotherboardPanel();
        this.createPetPanel();
        this.createBreachMiniGameUI();
        
        // Systems
        this.setupAutoMining();
        this.setupBreachSystem();
        this.setupBossSystem();
        this.setupHeatmapSystem();
        
        this.updateUI();
    }

    createUI() {
        const { width, height } = this.scale;
        
        // Header
        const header = this.add.graphics();
        header.fillStyle(GAME_CONFIG.COLORS.GLASS, 0.9);
        header.fillRoundedRect(50, 20, width - 100, 100, 15);
        header.lineStyle(2, GAME_CONFIG.COLORS.CYAN, 0.5);
        header.strokeRoundedRect(50, 20, width - 100, 100, 15);

        this.titleText = this.add.text(width / 2, 50, 'CGT-MINER ARCADE // SESSION ACTIVE', {
            fontFamily: '"Press Start 2P"',
            fontSize: '28px',
            fill: '#00FFC8'
        }).setOrigin(0.5);

        this.balanceText = this.add.text(width / 2, 90, `HASH_YIELD: ${Math.floor(this.gameState.cgt)} CGT`, {
            fontFamily: '"Press Start 2P"',
            fontSize: '20px',
            fill: '#FF3D00'
        }).setOrigin(0.5);

        // Multiplier & Seeds Info
        this.prestigeInfoText = this.add.text(width / 2, 130, '', {
            fontFamily: '"Press Start 2P"',
            fontSize: '14px',
            fill: '#00FF00'
        }).setOrigin(0.5);

        // Prestige Button
        this.createPrestigeButton();
    }

    createPrestigeButton() {
        const { width, height } = this.scale;
        this.prestigeBtnContainer = this.add.container(width / 2, height - 60);
        
        const bg = this.add.rectangle(0, 0, 450, 60, 0x111111, 0.9)
            .setStrokeStyle(2, 0x00FF00)
            .setInteractive({ useHandCursor: true });
        
        this.prestigeBtnText = this.add.text(0, 0, '', {
            fontFamily: '"Press Start 2P"',
            fontSize: '14px',
            fill: '#00FF00'
        }).setOrigin(0.5);

        this.prestigeBtnContainer.add([bg, this.prestigeBtnText]);

        bg.on('pointerdown', () => {
            const pending = this.gameState.getPendingSeeds();
            if (pending > 0) {
                if (confirm(`INITIATE PRESTIGE?\n\nReset progress for ${pending} Forge Cores?\n(+10% production each)`)) {
                    if (this.gameState.prestige()) {
                        this.scene.restart();
                    }
                }
            }
        });
    }

    createUpgradePanel() {
        const { width, height } = this.scale;
        const panelWidth = 400;
        
        this.add.rectangle(width - panelWidth / 2, height / 2, panelWidth, height, 0x000000, 0.7);
        this.add.rectangle(width - panelWidth, height / 2, 2, height, GAME_CONFIG.COLORS.CYAN, 0.5);

        this.add.text(width - panelWidth + 20, 160, 'SYSTEM UPGRADES', {
            fontFamily: '"Press Start 2P"',
            fontSize: '20px',
            fill: '#00FFC8'
        });

        this.upgradeItems = [];
        GAME_CONFIG.UPGRADES.forEach((upgrade, index) => {
            const y = 240 + (index * 140);
            this.createUpgradeItem(upgrade, y);
        });
    }

    createUpgradeItem(upgrade, y) {
        const { width } = this.scale;
        const panelWidth = 400;
        const startX = width - panelWidth + 20;

        const container = this.add.container(startX, y);
        const bg = this.add.rectangle(180, 0, 360, 120, 0x0a1a1a, 0.8)
            .setStrokeStyle(1, 0x00FFC8, 0.3)
            .setInteractive({ useHandCursor: true });
        
        const title = this.add.text(0, -40, `${upgrade.icon} ${upgrade.name}`, {
            fontFamily: '"Press Start 2P"',
            fontSize: '14px',
            fill: '#ffffff'
        });

        const levelText = this.add.text(0, -20, `LEVEL: ${this.gameState.getUpgradeLevel(upgrade.id)}`, {
            fontFamily: 'Arial',
            fontSize: '14px',
            fill: '#888888'
        });

        const desc = this.add.text(0, 5, upgrade.description, {
            fontFamily: 'Arial',
            fontSize: '12px',
            fill: '#aaaaaa',
            wordWrap: { width: 340 }
        });

        const costText = this.add.text(0, 35, `COST: ${this.gameState.getUpgradeCost(upgrade.id)} CGT`, {
            fontFamily: '"Press Start 2P"',
            fontSize: '12px',
            fill: '#FF3D00'
        });

        container.add([bg, title, levelText, desc, costText]);

        const updateVisuals = () => {
            levelText.setText(`LEVEL: ${this.gameState.getUpgradeLevel(upgrade.id)}`);
            costText.setText(`COST: ${this.gameState.getUpgradeCost(upgrade.id)} CGT`);
        };

        bg.on('pointerdown', () => {
            if (this.gameState.upgrade(upgrade.id)) {
                this.updateUI();
                updateVisuals();
                this.setupAutoMining();
                this.sounds.playUI('success');
                this.showFeedback(startX + 180, y, 'UPGRADED!', '#00FFC8');
            } else {
                this.sounds.playUI('error');
                this.showFeedback(startX + 180, y, 'INSUFFICIENT DATA', '#FF3D00');
            }
        });

        bg.on('pointerover', () => bg.setStrokeStyle(2, 0x00FFC8, 1));
        bg.on('pointerout', () => bg.setStrokeStyle(1, 0x00FFC8, 0.3));
    }

    createMarketPanel() {
        const { width, height } = this.scale;
        
        this.marketBtn = this.add.container(width - 225, height - 60);
        const btnBg = this.add.rectangle(0, 0, 400, 60, 0x001111, 0.9)
            .setStrokeStyle(2, GAME_CONFIG.COLORS.ORANGE)
            .setInteractive({ useHandCursor: true });
        const btnText = this.add.text(0, 0, '🛒 CYBER-MARKET', {
            fontFamily: '"Press Start 2P"',
            fontSize: '14px',
            fill: '#FF3D00'
        }).setOrigin(0.5);
        this.marketBtn.add([btnBg, btnText]);

        this.marketPanel = this.add.container(width / 2, height / 2).setDepth(2000).setVisible(false);
        const panelBg = this.add.rectangle(0, 0, 1000, 700, 0x000505, 0.95).setStrokeStyle(4, GAME_CONFIG.COLORS.ORANGE);
        const title = this.add.text(0, -300, '--- CYBER-MARKET ---', {
            fontFamily: '"Press Start 2P"',
            fontSize: '32px',
            fill: '#FF3D00'
        }).setOrigin(0.5);

        const closeBtn = this.add.text(450, -320, 'X', {
            fontFamily: '"Press Start 2P"',
            fontSize: '24px',
            fill: '#ff0000'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        closeBtn.on('pointerdown', () => this.marketPanel.setVisible(false));
        btnBg.on('pointerdown', () => this.marketPanel.setVisible(true));

        this.marketPanel.add([panelBg, title, closeBtn]);

        GAME_CONFIG.MARKET_ITEMS.forEach((item, index) => {
            const x = -320 + (index * 320);
            this.createMarketItem(item, x, 0);
        });
    }

    createMarketItem(item, x, y) {
        const container = this.add.container(x, y);
        const bg = this.add.rectangle(0, 0, 280, 450, 0x0a0a0a, 1).setStrokeStyle(2, GAME_CONFIG.COLORS.ORANGE, 0.5);
        const icon = this.add.text(0, -120, item.icon, { fontSize: '80px' }).setOrigin(0.5);
        const name = this.add.text(0, -20, item.name, {
            fontFamily: '"Press Start 2P"',
            fontSize: '18px',
            fill: '#ffffff'
        }).setOrigin(0.5);
        const desc = this.add.text(0, 40, item.description, {
            fontFamily: 'Arial',
            fontSize: '14px',
            fill: '#aaaaaa',
            align: 'center',
            wordWrap: { width: 240 }
        }).setOrigin(0.5);

        const buyBtn = this.add.container(0, 160);
        const buyBg = this.add.rectangle(0, 0, 220, 50, 0xFF3D00, 1).setInteractive({ useHandCursor: true });
        const buyText = this.add.text(0, 0, `BUY: ${item.cost} CGT`, {
            fontFamily: '"Press Start 2P"',
            fontSize: '12px',
            fill: '#ffffff'
        }).setOrigin(0.5);
        buyBtn.add([buyBg, buyText]);

        buyBg.on('pointerdown', () => {
            if (this.gameState.spendCGT(item.cost)) {
                this.gameState.applyBooster(item.id, item.duration);
                this.updateUI();
                this.showFeedback(0, 0, 'BOOST INJECTED!', '#00FFC8');
                if (item.id === 'daemon_rush') this.setupAutoMining();
            } else {
                this.showFeedback(0, 0, 'INSUFFICIENT CGT', '#FF3D00');
            }
        });

        container.add([bg, icon, name, desc, buyBtn]);
        this.marketPanel.add(container);
    }

    createHeatmap() {
        const { width, height } = this.scale;
        
        this.heatmapBtn = this.add.container(225, height - 60);
        const btnBg = this.add.rectangle(0, 0, 400, 60, 0x001111, 0.9)
            .setStrokeStyle(2, GAME_CONFIG.COLORS.CYAN)
            .setInteractive({ useHandCursor: true });
        const btnText = this.add.text(0, 0, '🛰️ DATA HEATMAP', {
            fontFamily: '"Press Start 2P"',
            fontSize: '14px',
            fill: '#00FFC8'
        }).setOrigin(0.5);
        this.heatmapBtn.add([btnBg, btnText]);

        this.heatmapPanel = this.add.container(width / 2, height / 2).setDepth(2000).setVisible(false);
        const panelBg = this.add.rectangle(0, 0, 900, 800, 0x000505, 0.95).setStrokeStyle(4, GAME_CONFIG.COLORS.CYAN);
        const title = this.add.text(0, -350, '--- GLOBAL DATA HEATMAP ---', {
            fontFamily: '"Press Start 2P"',
            fontSize: '28px',
            fill: '#00FFC8'
        }).setOrigin(0.5);

        const closeBtn = this.add.text(420, -370, 'X', {
            fontFamily: '"Press Start 2P"',
            fontSize: '24px',
            fill: '#ff0000'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        closeBtn.on('pointerdown', () => this.heatmapPanel.setVisible(false));
        btnBg.on('pointerdown', () => this.heatmapPanel.setVisible(true));

        this.heatmapPanel.add([panelBg, title, closeBtn]);
        this.heatmapGrid = this.add.container(0, 0);
        this.heatmapPanel.add(this.heatmapGrid);
        this.renderHeatmapGrid();
    }

    renderHeatmapGrid() {
        this.heatmapGrid.removeAll(true);
        const size = GAME_CONFIG.SECTORS.GRID_SIZE;
        const cellSize = 80;
        const offset = (size * cellSize) / 2 - cellSize / 2;

        for (let x = 0; x < size; x++) {
            for (let y = 0; y < size; y++) {
                const isCurrent = this.gameState.currentSector.x === x && this.gameState.currentSector.y === y;
                const isHot = this.gameState.hotspots.some(h => h.x === x && h.y === y);
                
                let color = 0x0a1a1a;
                let alpha = 0.8;
                if (isHot) color = 0xFF3D00;
                if (isCurrent) {
                    color = 0x00FFC8;
                    alpha = 1;
                }

                const cell = this.add.rectangle(x * cellSize - offset, y * cellSize - offset + 50, cellSize - 6, cellSize - 6, color, alpha)
                    .setStrokeStyle(1, 0xffffff, 0.2)
                    .setInteractive({ useHandCursor: true });
                
                if (isHot && !isCurrent) {
                    const glow = this.add.circle(cell.x, cell.y, 8, 0xFF3D00, 1);
                    this.tweens.add({
                        targets: glow,
                        alpha: 0,
                        scale: 3,
                        duration: 1200,
                        repeat: -1
                    });
                    this.heatmapGrid.add(glow);
                }

                cell.on('pointerdown', () => {
                    this.gameState.currentSector = { x, y };
                    this.gameState.save();
                    this.renderHeatmapGrid();
                    this.updateUI();
                    this.showFeedback(this.core.x, this.core.y - 250, `LINKING SECTOR [${x},${y}]`, '#00FFC8');
                });

                this.heatmapGrid.add(cell);
            }
        }

        const info = this.add.text(0, 360, 'HOTSPOTS (ORANGE) PROVIDE 1.5X YIELD\nCLICK TO SYNCHRONIZE YOUR NODE', {
            fontFamily: '"Press Start 2P"',
            fontSize: '12px',
            fill: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);
        this.heatmapGrid.add(info);
    }

    createLeaderboard() {
        const { height } = this.scale;
        const panelWidth = 350;
        
        this.add.rectangle(panelWidth / 2, height / 2, panelWidth, height, 0x000000, 0.7);
        this.add.rectangle(panelWidth, height / 2, 2, height, GAME_CONFIG.COLORS.ORANGE, 0.5);

        this.add.text(20, 160, 'TOP NETWORK NODES', {
            fontFamily: '"Press Start 2P"',
            fontSize: '18px',
            fill: '#FF3D00'
        });

        const players = [
            { name: 'X_Cyber_X', val: '1.2M' },
            { name: 'NeonGhost', val: '850K' },
            { name: 'DataLord', val: '540K' },
            { name: 'RootAccess', val: '210K' },
            { name: 'NullPtr', val: '105K' }
        ];

        players.forEach((p, i) => {
            const y = 220 + (i * 50);
            this.add.text(20, y, `${i + 1}. ${p.name}`, { fontFamily: 'Arial', fontSize: '18px', fill: '#ffffff' });
            this.add.text(panelWidth - 20, y, p.val, { fontFamily: 'Arial', fontSize: '18px', fill: '#FF3D00' }).setOrigin(1, 0);
        });

        this.playerRankText = this.add.text(20, height - 120, '', {
            fontFamily: '"Press Start 2P"',
            fontSize: '14px',
            fill: '#00FFC8'
        });
    }

    createMotherboardPanel() {
        const { width, height } = this.scale;
        
        // Motherboard Toggle Button (Left Side)
        this.mboardBtn = this.add.container(175, 100);
        const btnBg = this.add.rectangle(0, 0, 300, 50, 0x001a1a, 0.9)
            .setStrokeStyle(2, GAME_CONFIG.COLORS.CYAN)
            .setInteractive({ useHandCursor: true });
        const btnText = this.add.text(0, 0, '📟 DRONE MOTHERBOARD', {
            fontFamily: '"Press Start 2P"',
            fontSize: '12px',
            fill: '#00FFC8'
        }).setOrigin(0.5);
        this.mboardBtn.add([btnBg, btnText]);

        // Panel Container
        this.mboardPanel = this.add.container(width / 2, height / 2).setDepth(2100).setVisible(false);
        const panelBg = this.add.rectangle(0, 0, 900, 800, 0x000505, 0.98).setStrokeStyle(4, GAME_CONFIG.COLORS.CYAN);
        
        // Motherboard visual (Circuitry)
        const gfx = this.add.graphics();
        gfx.lineStyle(2, 0x00FFC8, 0.2);
        for(let i = -400; i <= 400; i += 40) {
            gfx.moveTo(i, -350); gfx.lineTo(i, 350);
            gfx.moveTo(-400, i/1.2); gfx.lineTo(400, i/1.2);
        }
        
        const title = this.add.text(0, -350, '--- GLOBAL DRONE MOTHERBOARD ---', {
            fontFamily: '"Press Start 2P"',
            fontSize: '24px',
            fill: '#00FFC8'
        }).setOrigin(0.5);

        const closeBtn = this.add.text(420, -370, 'X', {
            fontFamily: '"Press Start 2P"',
            fontSize: '24px',
            fill: '#ff0000'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        closeBtn.on('pointerdown', () => this.mboardPanel.setVisible(false));
        btnBg.on('pointerdown', () => {
            this.mboardPanel.setVisible(true);
            this.refreshMotherboardUI();
        });

        this.mboardPanel.add([panelBg, gfx, title, closeBtn]);
        
        this.mboardUpgradeItems = [];
        GAME_CONFIG.DRONE_MOTHERBOARD.forEach((upgrade, index) => {
            const row = Math.floor(index / 2);
            const col = index % 2;
            const x = -220 + (col * 440);
            const y = -150 + (row * 300);
            this.createMotherboardUpgrade(upgrade, x, y);
        });
    }

    createMotherboardUpgrade(upgrade, x, y) {
        const container = this.add.container(x, y);
        const bg = this.add.rectangle(0, 0, 400, 250, 0x0a1a1a, 1).setStrokeStyle(2, GAME_CONFIG.COLORS.CYAN, 0.5);
        
        const icon = this.add.text(0, -70, upgrade.icon, { fontSize: '60px' }).setOrigin(0.5);
        const name = this.add.text(0, 0, upgrade.name, {
            fontFamily: '"Press Start 2P"',
            fontSize: '16px',
            fill: '#ffffff'
        }).setOrigin(0.5);
        
        const levelText = this.add.text(0, 30, `FIRMWARE_VER: ${this.gameState.getUpgradeLevel(upgrade.id)}`, {
            fontFamily: 'Arial',
            fontSize: '14px',
            fill: '#888888'
        }).setOrigin(0.5);

        const desc = this.add.text(0, 70, upgrade.description, {
            fontFamily: 'Arial',
            fontSize: '12px',
            fill: '#aaaaaa',
            align: 'center',
            wordWrap: { width: 340 }
        }).setOrigin(0.5);

        const buyBtn = this.add.container(0, 140);
        const buyBg = this.add.rectangle(0, -20, 300, 50, 0x00FFC8, 1).setInteractive({ useHandCursor: true });
        const buyText = this.add.text(0, -20, `FLASH: ${this.gameState.getUpgradeCost(upgrade.id)} CGT`, {
            fontFamily: '"Press Start 2P"',
            fontSize: '12px',
            fill: '#000000'
        }).setOrigin(0.5);
        buyBtn.add([buyBg, buyText]);

        const refresh = () => {
            levelText.setText(`FIRMWARE_VER: ${this.gameState.getUpgradeLevel(upgrade.id)}`);
            buyText.setText(`FLASH: ${this.gameState.getUpgradeCost(upgrade.id)} CGT`);
        };

        buyBg.on('pointerdown', () => {
            if (this.gameState.upgrade(upgrade.id)) {
                this.updateUI();
                refresh();
                this.setupAutoMining();
                this.sounds.playUI('success');
                this.showFeedback(0, 0, 'FIRMWARE UPDATED!', '#00FFC8');
            } else {
                this.sounds.playUI('error');
                this.showFeedback(0, 0, 'INSUFFICIENT BUFFER', '#FF3D00');
            }
        });

        container.add([bg, icon, name, levelText, desc, buyBtn]);
        this.mboardPanel.add(container);
        this.mboardUpgradeItems.push({ upgrade, refresh });
    }

    refreshMotherboardUI() {
        this.mboardUpgradeItems.forEach(item => item.refresh());
    }

    createRelicDisplay() {
        const { height } = this.scale;
        this.relicContainer = this.add.container(20, height - 250);
        this.updateRelicDisplay();
    }

    createPetPanel() {
        const { width, height } = this.scale;
        
        // Pet Panel Toggle (Left side, below Motherboard)
        this.petBtn = this.add.container(175, 170);
        const btnBg = this.add.rectangle(0, 0, 300, 50, 0x001a1a, 0.9)
            .setStrokeStyle(2, GAME_CONFIG.COLORS.ORANGE)
            .setInteractive({ useHandCursor: true });
        const btnText = this.add.text(0, 0, '🐾 DATA-PET FORGE', {
            fontFamily: '"Press Start 2P"',
            fontSize: '12px',
            fill: GAME_CONFIG.COLORS.ORANGE
        }).setOrigin(0.5);
        this.petBtn.add([btnBg, btnText]);

        // Active Pet Visualization Container
        this.petVisual = this.add.container(width / 2, height / 2).setDepth(100);
        this.updateActivePetVisual();

        // Pet Panel
        this.petPanel = this.add.container(width / 2, height / 2).setDepth(2200).setVisible(false);
        const panelBg = this.add.rectangle(0, 0, 900, 800, 0x000505, 0.98).setStrokeStyle(4, GAME_CONFIG.COLORS.ORANGE);
        
        const title = this.add.text(0, -350, '--- DATA-PET FORGE ---', {
            fontFamily: '"Press Start 2P"',
            fontSize: '24px',
            fill: GAME_CONFIG.COLORS.ORANGE
        }).setOrigin(0.5);

        const closeBtn = this.add.text(420, -370, 'X', {
            fontFamily: '"Press Start 2P"',
            fontSize: '24px',
            fill: '#ff0000'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        closeBtn.on('pointerdown', () => this.petPanel.setVisible(false));
        btnBg.on('pointerdown', () => {
            this.petPanel.setVisible(true);
            this.refreshPetUI();
        });

        this.petPanel.add([panelBg, title, closeBtn]);
        
        this.petItems = [];
        GAME_CONFIG.DATA_PETS.forEach((pet, index) => {
            const row = Math.floor(index / 2);
            const col = index % 2;
            const x = -220 + (col * 440);
            const y = -150 + (row * 300);
            this.createPetItem(pet, x, y);
        });
    }

    createPetItem(pet, x, y) {
        const container = this.add.container(x, y);
        const bg = this.add.rectangle(0, 0, 400, 250, 0x0a0a0a, 1).setStrokeStyle(2, pet.color, 0.5);
        
        const icon = this.add.text(0, -70, pet.icon, { fontSize: '60px' }).setOrigin(0.5);
        const name = this.add.text(0, 0, pet.name, {
            fontFamily: '"Press Start 2P"',
            fontSize: '16px',
            fill: '#ffffff'
        }).setOrigin(0.5);
        
        const desc = this.add.text(0, 40, pet.description, {
            fontFamily: 'Arial',
            fontSize: '14px',
            fill: '#aaaaaa',
            align: 'center',
            wordWrap: { width: 340 }
        }).setOrigin(0.5);

        const actionBtn = this.add.container(0, 100);
        const actionBg = this.add.rectangle(0, 0, 300, 50, pet.color, 1).setInteractive({ useHandCursor: true });
        const actionText = this.add.text(0, 0, '', {
            fontFamily: '"Press Start 2P"',
            fontSize: '12px',
            fill: '#000000'
        }).setOrigin(0.5);
        actionBtn.add([actionBg, actionText]);

        const refresh = () => {
            const isOwned = this.gameState.ownedPets.includes(pet.id);
            const isActive = this.gameState.activePetId === pet.id;
            
            if (isActive) {
                actionText.setText('ACTIVE');
                actionBg.setFillStyle(0xffffff);
                bg.setStrokeStyle(4, pet.color, 1);
            } else if (isOwned) {
                actionText.setText('ACTIVATE');
                actionBg.setFillStyle(pet.color);
                bg.setStrokeStyle(2, pet.color, 0.5);
            } else {
                actionText.setText(`FORGE: ${pet.cost} CGT`);
                actionBg.setFillStyle(pet.color);
                bg.setStrokeStyle(2, 0x333333, 0.5);
            }
        };

        actionBg.on('pointerdown', () => {
            const isOwned = this.gameState.ownedPets.includes(pet.id);
            if (isOwned) {
                this.gameState.setActivePet(pet.id);
                this.sounds.playUI('success');
                this.updateActivePetVisual();
            } else {
                if (this.gameState.buyPet(pet.id)) {
                    this.sounds.playUI('discovery');
                    this.updateActivePetVisual();
                    this.showFeedback(0, 0, 'PET FORGED!', pet.color);
                    this.setupAutoMining(); // Refresh drone rates if pet provides drone bonus
                } else {
                    this.sounds.playUI('error');
                    this.showFeedback(0, 0, 'INSUFFICIENT DATA', '#ff0000');
                }
            }
            this.refreshPetUI();
            this.updateUI();
        });

        container.add([bg, icon, name, desc, actionBtn]);
        this.petPanel.add(container);
        this.petItems.push({ pet, refresh });
    }

    refreshPetUI() {
        this.petItems.forEach(item => item.refresh());
    }

    updateActivePetVisual() {
        this.petVisual.removeAll(true);
        const petId = this.gameState.activePetId;
        if (!petId) return;

        const pet = GAME_CONFIG.DATA_PETS.find(p => p.id === petId);
        if (!pet) return;

        // Visual for pet (a glowy orb with the icon)
        const orb = this.add.circle(0, 0, 30, pet.color, 0.3).setStrokeStyle(2, 0xffffff, 0.8);
        const icon = this.add.text(0, 0, pet.icon, { fontSize: '30px' }).setOrigin(0.5);
        
        const glow = this.add.circle(0, 0, 40, pet.color, 0.1);
        this.tweens.add({
            targets: glow,
            scale: 1.5,
            alpha: 0,
            duration: 1000,
            repeat: -1
        });

        this.petVisual.add([glow, orb, icon]);
    }

    updateRelicDisplay() {
        if (!this.relicContainer) return;
        this.relicContainer.removeAll(true);
        
        const owned = GAME_CONFIG.RELICS.filter(r => this.gameState.hasRelic(r.id));
        this.add.text(0, -30, 'RELICS:', { fontFamily: '"Press Start 2P"', fontSize: '12px', fill: '#888888' }).setParentContainer(this.relicContainer);
        
        owned.forEach((relic, i) => {
            const txt = this.add.text(0, i * 30, `${relic.icon} ${relic.name}`, { fontFamily: 'Arial', fontSize: '14px', fill: '#00FFC8' }).setInteractive();
            txt.on('pointerover', () => {
                this.relicTooltip = this.add.text(txt.x + 140, txt.y + this.relicContainer.y, relic.description, {
                    backgroundColor: '#000000', padding: 5, fontFamily: 'Arial', fontSize: '14px', fill: '#00FFC8'
                }).setDepth(3000);
            });
            txt.on('pointerout', () => { if (this.relicTooltip) this.relicTooltip.destroy(); });
            this.relicContainer.add(txt);
        });
    }

    async handleMine(pointer) {
        if (this.isBossActive) {
            this.damageBoss(1);
            this.showMiningFeedback(1, true);
            this.sounds.playClick(true);
        } else {
            const power = this.gameState.getClickPower();
            const critChance = this.gameState.getCritChance() / 100; // Assuming crit_chance is percentage
            const isCrit = Math.random() < critChance;
            const finalPower = (isCrit ? power * this.gameState.getCritMultiplier() : power) * this.breachMultiplier * this.superModeMultiplier;

            this.sounds.playClick(isCrit);

            // Trigger Super Mode chance
            if (!this.isSuperModeActive && Math.random() < GAME_CONFIG.EVENTS.SUPER_MODE.CHANCE) {
                this.startSuperMode();
            }

            const result = await this.api.submitWork({ power: finalPower });
            if (result.success) {
                this.gameState.addCGT(result.yield);
                this.updateUI();
                this.showMiningFeedback(result.yield, isCrit);
                this.checkRelicDrops();
            }
        }

        this.cameras.main.shake(100, 0.005);
        this.particles.emitParticleAt(pointer.x, pointer.y, 10);
        this.tweens.add({ targets: this.core, scale: 0.55, duration: 50, yoyo: true });
    }

    startSuperMode() {
        this.isSuperModeActive = true;
        this.superModeMultiplier = GAME_CONFIG.EVENTS.SUPER_MODE.MULTIPLIER;
        this.sounds.playUI('discovery');
        
        // Visual effects activation
        this.tweens.add({
            targets: [this.superModeGraphics, this.superModeEdges],
            alpha: 1,
            duration: 500
        });

        // Banner
        const { width } = this.scale;
        this.superModeBanner = this.add.text(width / 2, 200, '--- OVERDRIVE MODE ACTIVE ---', {
            fontFamily: '"Press Start 2P"',
            fontSize: '32px',
            fill: '#ffffff',
            stroke: '#000',
            strokeThickness: 8
        }).setOrigin(0.5).setDepth(5001);

        this.tweens.add({
            targets: this.superModeBanner,
            scale: 1.2,
            duration: 200,
            yoyo: true,
            repeat: -1
        });

        this.time.delayedCall(GAME_CONFIG.EVENTS.SUPER_MODE.DURATION, () => {
            this.endSuperMode();
        });
    }

    endSuperMode() {
        this.isSuperModeActive = false;
        this.superModeMultiplier = 1;
        this.tweens.add({
            targets: [this.superModeGraphics, this.superModeEdges],
            alpha: 0,
            duration: 1000
        });
        if (this.superModeBanner) this.superModeBanner.destroy();
    }

    updateSuperModeVisuals() {
        if (!this.isSuperModeActive) return;
        
        const { width, height } = this.scale;
        this.superModeGraphics.clear();
        this.superModeEdges.clear();

        // Edge Illumination (Vibrant Colors)
        const colors = [0x00FFC8, 0xFF3D00, 0xFF00FF, 0xFFFF00];
        const color = colors[Math.floor(this.time.now / 100) % colors.length];
        
        this.superModeEdges.lineStyle(20, color, 0.5);
        this.superModeEdges.strokeRect(0, 0, width, height);
        
        // Electricity Surges
        this.superModeGraphics.lineStyle(3, 0xffffff, 0.8);
        
        const surgeCount = 8;
        for (let i = 0; i < surgeCount; i++) {
            let startX, startY;
            const side = Math.floor(Math.random() * 4);
            if (side === 0) { startX = Math.random() * width; startY = 0; }
            else if (side === 1) { startX = width; startY = Math.random() * height; }
            else if (side === 2) { startX = Math.random() * width; startY = height; }
            else { startX = 0; startY = Math.random() * height; }

            let curX = startX;
            let curY = startY;
            const targetX = width / 2;
            const targetY = height / 2;

            this.superModeGraphics.moveTo(curX, curY);
            
            const segments = 10;
            for (let j = 0; j < segments; j++) {
                curX += (targetX - curX) / (segments - j) + (Math.random() - 0.5) * 100;
                curY += (targetY - curY) / (segments - j) + (Math.random() - 0.5) * 100;
                this.superModeGraphics.lineTo(curX, curY);
            }
        }
    }

    updateUI() {
        this.balanceText.setText(`HASH_YIELD: ${Math.floor(this.gameState.cgt)} CGT`);
        if (this.playerRankText) this.playerRankText.setText(`YOU: 6. ${Math.floor(this.gameState.totalCgtMined)} CGT`);
        
        const sectorMult = this.gameState.getSectorMultiplier();
        const baseMult = this.gameState.getPrestigeMultiplier();
        const totalMult = baseMult * sectorMult;

        this.prestigeInfoText.setText(`TOTAL MULTIPLIER: x${totalMult.toFixed(1)} | FORGE CORES: ${this.gameState.prestigeSeeds}`);
        this.prestigeInfoText.setFill(sectorMult > 1 ? '#00FFC8' : '#00FF00');

        const pending = this.gameState.getPendingSeeds();
        if (pending > 0) {
            this.prestigeBtnText.setText(`INITIATE PRESTIGE (+${pending} CORES)`);
            this.prestigeBtnContainer.setAlpha(1);
        } else {
            const req = GAME_CONFIG.PRESTIGE.MIN_CGT_REQUIRED;
            this.prestigeBtnText.setText(`REQ: ${req} TOTAL CGT`);
            this.prestigeBtnContainer.setAlpha(0.5);
        }
    }

    setupBreachSystem() {
        this.time.addEvent({
            delay: GAME_CONFIG.EVENTS.BREACH.CHECK_INTERVAL,
            callback: () => {
                if (!this.isBreachActive && !this.isBossActive && Math.random() < GAME_CONFIG.EVENTS.BREACH.CHANCE) {
                    this.startBreach();
                }
            },
            loop: true
        });
    }

    createBreachMiniGameUI() {
        const { width, height } = this.scale;
        this.breachContainer = this.add.container(0, 0).setDepth(4500).setVisible(false);
        
        // Dark Overlay
        const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.9);
        
        // Panel
        const panel = this.add.container(width / 2, height / 2);
        const bg = this.add.rectangle(0, 0, 700, 800, 0x000a0a, 0.95).setStrokeStyle(4, 0xff00ff);
        
        const title = this.add.text(0, -350, '⚠️ DATA BREACH IN PROGRESS ⚠️', {
            fontFamily: '"Press Start 2P"', fontSize: '24px', fill: '#ff00ff'
        }).setOrigin(0.5);

        const instruction = this.add.text(0, -300, 'REPEAT THE ENCRYPTION PATTERN', {
            fontFamily: '"Press Start 2P"', fontSize: '14px', fill: '#ffffff'
        }).setOrigin(0.5);

        this.breachTimerText = this.add.text(0, -250, 'TIME REMAINING: 0s', {
            fontFamily: '"Press Start 2P"', fontSize: '18px', fill: '#00ffff'
        }).setOrigin(0.5);

        this.breachGridButtons = [];
        const gridSize = GAME_CONFIG.EVENTS.BREACH.GRID_SIZE;
        const spacing = 120;
        const offset = (gridSize - 1) * spacing / 2;

        for (let row = 0; row < gridSize; row++) {
            for (let col = 0; col < gridSize; col++) {
                const btn = this.add.rectangle(
                    col * spacing - offset, 
                    row * spacing - offset + 50, 
                    100, 100, 0x111111
                ).setStrokeStyle(2, 0xff00ff, 0.5).setInteractive({ useHandCursor: true });
                
                const id = row * gridSize + col;
                btn.on('pointerdown', () => this.handleBreachGridClick(id));
                
                panel.add(btn);
                this.breachGridButtons.push(btn);
            }
        }

        this.breachStatusText = this.add.text(0, 300, 'WAITING FOR SEQUENCE...', {
            fontFamily: '"Press Start 2P"', fontSize: '16px', fill: '#ffffff'
        }).setOrigin(0.5);

        panel.add([bg, title, instruction, this.breachTimerText, this.breachStatusText]);
        this.breachContainer.add([overlay, panel]);
        
        this.breachTargetSequence = [];
        this.breachPlayerSequence = [];
        this.isBreachSequencePlaying = false;
    }

    startBreach() {
        this.isBreachActive = true;
        this.breachMultiplier = GAME_CONFIG.EVENTS.BREACH.MULTIPLIER;
        this.sounds.playUI('discovery');
        
        this.breachContainer.setVisible(true);
        this.breachPlayerSequence = [];
        this.breachTargetSequence = [];
        
        const duration = GAME_CONFIG.EVENTS.BREACH.DURATION * this.gameState.getBreachDurationModifier();
        let timeLeft = Math.floor(duration / 1000);
        
        this.breachTimerText.setText(`TIME REMAINING: ${timeLeft}s`);
        
        this.breachClock = this.time.addEvent({
            delay: 1000,
            callback: () => {
                timeLeft--;
                this.breachTimerText.setText(`TIME REMAINING: ${timeLeft}s`);
                if (timeLeft <= 0) this.endBreach(true);
            },
            loop: true
        });

        this.nextBreachLevel();
    }

    nextBreachLevel() {
        if (!this.isBreachActive) return;
        
        this.breachPlayerSequence = [];
        this.isBreachSequencePlaying = true;
        this.breachStatusText.setText('SCANNING ENCRYPTION...');
        this.breachStatusText.setFill('#00ffff');

        // Generate new sequence
        const len = 3 + Math.floor((this.breachTargetSequence.length) / 2);
        this.breachTargetSequence = [];
        for (let i = 0; i < len; i++) {
            this.breachTargetSequence.push(Phaser.Math.Between(0, 8));
        }

        // Play sequence
        this.breachTargetSequence.forEach((btnId, index) => {
            this.time.delayedCall(index * 600 + 500, () => {
                this.flashBreachButton(btnId);
                if (index === this.breachTargetSequence.length - 1) {
                    this.time.delayedCall(600, () => {
                        this.isBreachSequencePlaying = false;
                        this.breachStatusText.setText('YOUR TURN: MATCH THE PATTERN');
                        this.breachStatusText.setFill('#ffffff');
                    });
                }
            });
        });
    }

    flashBreachButton(id) {
        const btn = this.breachGridButtons[id];
        if (!btn) return;
        btn.setFillStyle(0xff00ff, 1);
        this.sounds.playClick(true);
        this.time.delayedCall(300, () => {
            if (btn) btn.setFillStyle(0x111111, 1);
        });
    }

    handleBreachGridClick(id) {
        if (!this.isBreachActive || this.isBreachSequencePlaying) return;

        this.flashBreachButton(id);
        this.breachPlayerSequence.push(id);

        const step = this.breachPlayerSequence.length - 1;
        if (this.breachPlayerSequence[step] !== this.breachTargetSequence[step]) {
            // Failure
            this.sounds.playUI('error');
            this.breachStatusText.setText('ENCRYPTION FAILED - BREACH TERMINATED');
            this.breachStatusText.setFill('#ff0000');
            this.time.delayedCall(1000, () => this.endBreach(false));
            return;
        }

        if (this.breachPlayerSequence.length === this.breachTargetSequence.length) {
            // Level Clear
            this.sounds.playUI('success');
            const reward = this.gameState.getClickPower() * 50 * this.breachTargetSequence.length;
            this.gameState.addCGT(reward);
            this.showFeedback(this.scale.width/2, this.scale.height/2 + 200, `DATA SNATCHED: +${Math.floor(reward)} CGT`, '#ff00ff');
            
            this.breachStatusText.setText('SUCCESS! DEEPENING BREACH...');
            this.breachStatusText.setFill('#00ff00');
            this.time.delayedCall(1000, () => this.nextBreachLevel());
        }
    }

    endBreach(success) {
        this.isBreachActive = false;
        this.breachMultiplier = 1;
        this.breachContainer.setVisible(false);
        if (this.breachClock) this.breachClock.remove();
        this.updateUI();
    }

    setupBossSystem() {
        this.time.addEvent({
            delay: GAME_CONFIG.EVENTS.BOSS.CHECK_INTERVAL,
            callback: () => {
                if (!this.isBossActive && !this.isBreachActive && Math.random() < GAME_CONFIG.EVENTS.BOSS.CHANCE) {
                    this.startBoss();
                }
            },
            loop: true
        });
    }

    startBoss() {
        this.isBossActive = true;
        const healthScale = Math.max(1, Math.floor(this.gameState.totalCgtMined / 10000));
        this.bossMaxHealth = GAME_CONFIG.EVENTS.BOSS.BASE_HEALTH * healthScale;
        this.bossHealth = this.bossMaxHealth;
        this.strikeCharge = 0;
        this.isStrikeReady = false;

        this.core.setTint(0xff0000);
        const { width, height } = this.scale;
        
        // Boss UI
        this.bossUI = this.add.container(width / 2, 200).setDepth(2000);
        const barBg = this.add.rectangle(0, 50, 600, 30, 0x330000).setStrokeStyle(2, 0xffffff);
        this.bossBar = this.add.rectangle(-300, 50, 600, 30, 0xff0000).setOrigin(0, 0.5);
        const title = this.add.text(0, 0, '⚠️ MEGA-BOSS DETECTED! PURGE CORE! ⚠️', {
            fontFamily: '"Press Start 2P"', fontSize: '18px', fill: '#ff0000'
        }).setOrigin(0.5);
        this.bossUI.add([barBg, this.bossBar, title]);

        // Satellite Strike Button
        this.strikeBtn = this.add.container(width / 2, height - 200).setDepth(2000);
        const sBg = this.add.rectangle(0, 0, 400, 60, 0x000000, 0.8).setStrokeStyle(2, 0x00ffff);
        this.sBar = this.add.rectangle(-200, 0, 0, 60, 0x00ffff, 0.5).setOrigin(0, 0.5);
        const sTxt = this.add.text(0, 0, 'CHARGING SATELLITE...', {
            fontFamily: '"Press Start 2P"', fontSize: '14px', fill: '#00ffff'
        }).setOrigin(0.5);
        this.strikeBtn.add([sBg, this.sBar, sTxt]);
        this.strikeBtnText = sTxt;
        this.strikeBtnBg = sBg;

        sBg.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
            if (this.isStrikeReady) {
                this.triggerSatelliteStrike();
            }
        });

        this.bossCollabTimer = this.time.addEvent({
            delay: 1000, callback: () => { if (this.isBossActive) this.damageBoss(this.bossMaxHealth * 0.02); }, loop: true
        });

        this.bossTimer = this.time.delayedCall(GAME_CONFIG.EVENTS.BOSS.DURATION, () => {
            if (this.isBossActive) this.endBoss(false);
        });
    }

    triggerSatelliteStrike() {
        this.isStrikeReady = false;
        this.strikeCharge = 0;
        this.sounds.playUI('strike');
        this.cameras.main.shake(1000, 0.02);

        const { width, height } = this.scale;
        this.strikeBeam.setAlpha(1);
        
        // Beam Animation
        this.tweens.add({
            targets: this.strikeBeam,
            alpha: 0,
            duration: 1500,
            ease: 'Expo.easeIn',
            onUpdate: () => {
                this.strikeBeam.clear();
                this.strikeBeam.lineStyle(Phaser.Math.Between(20, 100), 0x00ffff, this.strikeBeam.alpha);
                this.strikeBeam.moveTo(width / 2, 0);
                this.strikeBeam.lineTo(width / 2, height);
                this.strikeBeam.lineStyle(Phaser.Math.Between(5, 20), 0xffffff, this.strikeBeam.alpha);
                this.strikeBeam.moveTo(width / 2, 0);
                this.strikeBeam.lineTo(width / 2, height);
            }
        });

        // Damage Boss
        const dmg = this.bossMaxHealth * GAME_CONFIG.EVENTS.BOSS.SATELLITE_STRIKE_DAMAGE;
        this.damageBoss(dmg);
        this.showFeedback(width / 2, height / 2, `ORBITAL STRIKE: -${Math.floor(dmg)} HP`, '#00ffff');
    }

    damageBoss(amt) {
        this.bossHealth -= amt;
        this.bossBar.setScale(Math.max(0, this.bossHealth / this.bossMaxHealth), 1);
        if (this.bossHealth <= 0) {
            const reward = this.gameState.getClickPower() * GAME_CONFIG.EVENTS.BOSS.REWARD_MULT;
            this.gameState.addCGT(reward);
            this.showFeedback(this.core.x, this.core.y - 200, `BOSS PURGED! +${Math.floor(reward)} CGT`, '#00ff00');
            this.endBoss(true);
        }
    }

    endBoss(success) {
        this.isBossActive = false;
        this.isStrikeReady = false;
        this.strikeCharge = 0;
        this.core.clearTint();
        if (this.bossUI) this.bossUI.destroy();
        if (this.strikeBtn) this.strikeBtn.destroy();
        if (this.bossCollabTimer) this.bossCollabTimer.remove();
        if (this.bossTimer) this.bossTimer.remove();
        this.updateUI();
    }

    checkRelicDrops() {
        GAME_CONFIG.RELICS.forEach(r => {
            if (!this.gameState.hasRelic(r.id) && Math.random() < 0.001) {
                if (this.gameState.addRelic(r.id)) {
                    this.showRelicDiscovery(r);
                    this.updateRelicDisplay();
                }
            }
        });
    }

    showRelicDiscovery(relic) {
        this.sounds.playUI('discovery');
        const { width, height } = this.scale;
        const container = this.add.container(width / 2, height / 2).setDepth(4000);
        const bg = this.add.rectangle(0, 0, 600, 300, 0x000000, 0.9).setStrokeStyle(4, 0xFFFF00);
        const title = this.add.text(0, -100, 'RELIC DISCOVERED!', { fontFamily: '"Press Start 2P"', fontSize: '24px', fill: '#ffff00' }).setOrigin(0.5);
        const icon = this.add.text(0, -20, relic.icon, { fontSize: '80px' }).setOrigin(0.5);
        const name = this.add.text(0, 60, relic.name, { fontFamily: '"Press Start 2P"', fontSize: '18px', fill: '#fff' }).setOrigin(0.5);
        container.add([bg, title, icon, name]);
        this.time.delayedCall(3000, () => container.destroy());
    }

    setupHeatmapSystem() {
        this.refreshHotspots();
        this.time.addEvent({ delay: GAME_CONFIG.SECTORS.REFRESH_INTERVAL, callback: () => this.refreshHotspots(), loop: true });
    }

    refreshHotspots() {
        const size = GAME_CONFIG.SECTORS.GRID_SIZE;
        const newHots = [];
        for (let i = 0; i < GAME_CONFIG.SECTORS.HOTSPOT_COUNT; i++) {
            newHots.push({ x: Phaser.Math.Between(0, size - 1), y: Phaser.Math.Between(0, size - 1) });
        }
        this.gameState.hotspots = newHots;
        if (this.heatmapPanel && this.heatmapPanel.visible) this.renderHeatmapGrid();
        this.updateUI();
    }

    setupAutoMining() {
        if (this.autoMineTimer) this.autoMineTimer.remove();
        const interval = this.gameState.getAutoMinerInterval();
        const power = this.gameState.getAutoMinerPower();
        const droneCritChance = this.gameState.getDroneCritChance() / 100;
        const droneOverdriveMult = this.gameState.getDroneOverdriveMult();

        if (power > 0) {
            this.autoMineTimer = this.time.addEvent({
                delay: interval,
                callback: () => {
                    const isCrit = Math.random() < droneCritChance;
                    const critMult = isCrit ? this.gameState.getCritMultiplier() : 1;
                    const overdriveMult = this.isSuperModeActive ? droneOverdriveMult : 1;
                    
                    const finalPower = power * this.breachMultiplier * critMult * overdriveMult;
                    
                    if (this.isBossActive) {
                        this.damageBoss(power * 0.1 * critMult * overdriveMult);
                    } else {
                        this.gameState.addCGT(finalPower);
                        this.updateUI();
                        if (isCrit) {
                            this.showAutoMiningFeedback(finalPower, true);
                        }
                    }
                },
                loop: true
            });
        }
    }

    showAutoMiningFeedback(amount, isCrit = false) {
        const x = this.core.x + Phaser.Math.Between(-150, 150);
        const y = this.core.y + Phaser.Math.Between(-150, 150);
        
        const fb = this.add.text(x, y, isCrit ? `DRONE CRIT! +${amount.toFixed(1)}` : `+${amount.toFixed(1)}`, {
            fontFamily: isCrit ? '"Press Start 2P"' : 'Arial',
            fontSize: isCrit ? '14px' : '18px',
            fill: isCrit ? '#FFFF00' : '#ff00ff',
            alpha: 0.8
        }).setOrigin(0.5);

        this.tweens.add({
            targets: fb,
            y: y - 80,
            alpha: 0,
            duration: 2000,
            onComplete: () => fb.destroy()
        });
    }

    showMiningFeedback(amount, isCrit) {
        const x = this.core.x + Phaser.Math.Between(-60, 60);
        const y = this.core.y + Phaser.Math.Between(-60, 60);
        const txt = isCrit ? `CRIT! +${amount.toFixed(1)}` : `+${amount.toFixed(1)}`;
        const color = isCrit ? '#FFFF00' : '#00FFC8';
        
        const fb = this.add.text(x, y, txt, {
            fontFamily: '"Press Start 2P"', fontSize: isCrit ? '28px' : '20px', fill: color, stroke: '#000', strokeThickness: 4
        }).setOrigin(0.5).setDepth(1000);

        this.tweens.add({ targets: fb, y: y - 120, alpha: 0, duration: 800, onComplete: () => fb.destroy() });
    }

    showFeedback(x, y, text, color) {
        const fb = this.add.text(x, y, text, {
            fontFamily: '"Press Start 2P"', fontSize: '14px', fill: color, stroke: '#000', strokeThickness: 4
        }).setOrigin(0.5).setDepth(3000);
        this.tweens.add({ targets: fb, y: y - 60, alpha: 0, duration: 1500, onComplete: () => fb.destroy() });
    }

    update() {
        this.updateSuperModeVisuals();
        
        // Handle Pet Floating
        if (this.petVisual && this.gameState.activePetId) {
            const time = this.time.now / 1000;
            const radius = 250;
            const orbitSpeed = 1.5;
            this.petVisual.x = this.scale.width / 2 + Math.cos(time * orbitSpeed) * radius;
            this.petVisual.y = this.scale.height / 2 + Math.sin(time * orbitSpeed * 0.7) * (radius * 0.6);
        }

        // Handle Satellite Strike Charging
        if (this.isBossActive && !this.isStrikeReady) {
            this.strikeCharge += 0.002; // Charge over time
            if (this.strikeBtn) {
                this.sBar.width = Math.min(1, this.strikeCharge) * 400;
                if (this.strikeCharge >= 1) {
                    this.isStrikeReady = true;
                    this.strikeBtnText.setText('SATELLITE STRIKE READY!');
                    this.strikeBtnText.setFill('#ffffff');
                    this.strikeBtnBg.setStrokeStyle(4, 0xffffff);
                }
            }
        }
    }
}