import Phaser from 'phaser';
import { Player } from '../entities/Player.js';
import { Enemy } from '../entities/Enemy.js';
import { CONFIG, GAME_STATE, SKINS } from '../config.js';
import { audioManager } from '../AudioManager.js';
import { blockchainIntegration } from '../blockchain-integration.js';

export class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    create() {
        // Initialize blockchain integration (non-blocking)
        blockchainIntegration.init().catch(err => {
            console.warn('Blockchain integration init failed:', err);
        });
        
        // Load saved game data (non-blocking)
        blockchainIntegration.loadGameData().then(savedData => {
            if (savedData) {
                // Restore game state
                GAME_STATE.score = savedData.score || 0;
                GAME_STATE.cgtBalance = savedData.cgtEarned || 0;
                GAME_STATE.upgrades = savedData.upgrades || GAME_STATE.upgrades;
                GAME_STATE.ownedSkins = savedData.ownedSkins || GAME_STATE.ownedSkins;
                GAME_STATE.equippedSkin = savedData.equippedSkin || GAME_STATE.equippedSkin;
                GAME_STATE.killCount = savedData.killCount || 0;
                GAME_STATE.playTime = savedData.playTime || 0;
            }
        }).catch(err => {
            console.warn('Failed to load game data:', err);
        });
        
        // Load real CGT balance from blockchain (non-blocking)
        blockchainIntegration.loadBalance().then(realBalance => {
            if (realBalance > 0) {
                GAME_STATE.cgtBalance = realBalance;
            }
        }).catch(err => {
            console.warn('Failed to load balance:', err);
        });
        
        // Set up game visuals first
        this.add.image(960, 540, 'background').setDisplaySize(1920, 1080);
        
        this.bossFlash = this.add.rectangle(960, 540, 1920, 1080, 0x00ffff, 0).setDepth(-1);
        
        // Initialize player (with error handling)
        try {
            this.player = new Player(this, 960, 1000);
        } catch (err) {
            console.error('Failed to create player:', err);
            // Fallback: create player sprite manually
            const equippedSkin = SKINS.find(s => s.id === GAME_STATE.equippedSkin) || SKINS[0];
            this.player = this.physics.add.sprite(960, 1000, equippedSkin.image);
            this.player.setCollideWorldBounds(true);
            this.player.setScale(0.15);
            this.player.bullets = this.physics.add.group();
        }
        
        this.enemies = this.physics.add.group({
            classType: Enemy,
            runChildUpdate: true
        });
        this.coins = this.physics.add.group();
        this.powerUps = this.physics.add.group();
        this.hasBoss = false;
        this.activeBoost = null;
        this.boostEndTime = 0;
        
        // Start audio (non-blocking, with error handling)
        try {
            audioManager.startMusic();
        } catch (err) {
            console.warn('Failed to start music:', err);
        }
        this.cursors = this.input.keyboard.createCursorKeys();
        
        // Collisions
        this.physics.add.overlap(this.player.bullets, this.enemies, this.handleBulletEnemyCollision, null, this);
        this.physics.add.overlap(this.player, this.enemies, this.handlePlayerEnemyCollision, null, this);
        this.physics.add.overlap(this.player, this.coins, this.handlePlayerCoinCollision, null, this);
        this.physics.add.overlap(this.player, this.powerUps, this.handlePlayerPowerUpCollision, null, this);

        // UI
        this.scoreText = this.add.text(20, 20, `SCORE: ${GAME_STATE.score}`, { fontFamily: '"Press Start 2P"', fontSize: '32px' });
        this.cgtText = this.add.text(20, 70, `#CGT ${GAME_STATE.cgtBalance}`, { fontFamily: '"Press Start 2P"', fontSize: '32px', fill: '#00ff00' });
        this.bombText = this.add.text(20, 120, `BOMBS: ${GAME_STATE.upgrades.bombs}`, { fontFamily: '"Press Start 2P"', fontSize: '24px', fill: '#ff0000' });
        this.laserText = this.add.text(20, 160, `LASER: 0s`, { fontFamily: '"Press Start 2P"', fontSize: '24px', fill: '#00ffff' });
        this.boostText = this.add.text(960, 100, '', { fontFamily: '"Press Start 2P"', fontSize: '42px', fill: '#ffff00' }).setOrigin(0.5).setVisible(false);
        
        this.timeText = this.add.text(1900, 20, `TIME: 0:00`, { fontFamily: '"Press Start 2P"', fontSize: '32px' }).setOrigin(1, 0);
        this.add.text(1900, 70, "DEMIURGE BLOCKCHAIN", { fontFamily: '"Press Start 2P"', fontSize: '18px', fill: '#aaaaaa' }).setOrigin(1, 0);
        // Continuous infinite spawning
        this.spawnTimer = this.time.addEvent({
            delay: 1000,
            callback: this.spawnContinuousEnemy,
            callbackScope: this,
            loop: true
        });
        
        // Swarm spawning
        this.swarmTimer = this.time.addEvent({
            delay: CONFIG.swarmInterval,
            callback: this.spawnSwarm,
            callbackScope: this,
            loop: true
        });
        
        // Random boost events
        this.boostTimer = this.time.addEvent({
            delay: 20000,
            callback: this.triggerRandomBoost,
            callbackScope: this,
            loop: true
        });
        
        // Random CGT coin drops
        this.coinSpawnTimer = this.time.addEvent({
            delay: Phaser.Math.Between(3000, 8000),
            callback: this.spawnRandomCoin,
            callbackScope: this,
            loop: true
        });
    }

    spawnContinuousEnemy() {
        if (this.physics.world.isPaused || this.hasBoss) return;
        
        const types = ['bee', 'butterfly', 'red_bee', 'cyan_butterfly', 'purple_bee'];
        const type = types[Math.floor(Math.random() * types.length)];
        const x = Phaser.Math.Between(100, 1820);
        const y = -100;
        
        const enemy = new Enemy(this, x, y, type);
        this.enemies.add(enemy);
        enemy.startDive(); 
        
        // Difficulty scales with time
        const difficultyMultiplier = 1 + (GAME_STATE.playTime / 60000);
        enemy.diveSpeed *= Phaser.Math.FloatBetween(0.8, 1.5) * difficultyMultiplier;
        
        // Spawn rate increases with time
        const newDelay = Math.max(300, 1000 - (GAME_STATE.playTime / 2000));
        this.spawnTimer.delay = newDelay;
    }
    
    spawnSwarm() {
        if (this.physics.world.isPaused || this.hasBoss) return;
        
        const swarmTypes = [
            this.spawnVFormation,
            this.spawnCircleFormation,
            this.spawnWaveFormation,
            this.spawnDiagonalFormation
        ];
        
        const formation = swarmTypes[Math.floor(Math.random() * swarmTypes.length)];
        formation.call(this);
        
        // Decrease swarm interval over time
        const newDelay = Math.max(3000, CONFIG.swarmInterval - (GAME_STATE.playTime / 100));
        this.swarmTimer.delay = newDelay;
    }
    
    spawnVFormation() {
        const types = ['bee', 'butterfly', 'red_bee', 'cyan_butterfly', 'purple_bee'];
        const type = types[Math.floor(Math.random() * types.length)];
        const centerX = Phaser.Math.Between(400, 1520);
        
        for (let i = 0; i < 7; i++) {
            const offset = (i - 3) * 80;
            const yOffset = Math.abs(i - 3) * 60;
            const enemy = new Enemy(this, centerX + offset, -100 - yOffset, type);
            this.enemies.add(enemy);
            
            this.time.delayedCall(i * 100, () => {
                if (enemy.active) enemy.startDive();
            });
        }
    }
    
    spawnCircleFormation() {
        const types = ['bee', 'butterfly', 'red_bee', 'cyan_butterfly', 'purple_bee'];
        const type = types[Math.floor(Math.random() * types.length)];
        const centerX = Phaser.Math.Between(400, 1520);
        const centerY = -200;
        const radius = 120;
        
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            const enemy = new Enemy(this, x, y, type);
            this.enemies.add(enemy);
            
            this.time.delayedCall(i * 150, () => {
                if (enemy.active) enemy.startDive();
            });
        }
    }
    
    spawnWaveFormation() {
        const types = ['bee', 'butterfly', 'red_bee', 'cyan_butterfly', 'purple_bee'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        for (let i = 0; i < 10; i++) {
            const x = 200 + i * 160;
            const y = -100 + Math.sin(i * 0.5) * 80;
            const enemy = new Enemy(this, x, y, type);
            this.enemies.add(enemy);
            
            this.time.delayedCall(i * 80, () => {
                if (enemy.active) enemy.startDive();
            });
        }
    }
    
    spawnDiagonalFormation() {
        const types = ['bee', 'butterfly', 'red_bee', 'cyan_butterfly', 'purple_bee'];
        const type = types[Math.floor(Math.random() * types.length)];
        const startX = Phaser.Math.Between(200, 800);
        
        for (let i = 0; i < 6; i++) {
            const x = startX + i * 120;
            const y = -100 - i * 80;
            const enemy = new Enemy(this, x, y, type);
            this.enemies.add(enemy);
            
            this.time.delayedCall(i * 120, () => {
                if (enemy.active) enemy.startDive();
            });
        }
    }
    
    spawnRandomCoin() {
        const x = Phaser.Math.Between(100, 1820);
        const y = -50;
        
        const coin = this.coins.create(x, y, 'coin').setScale(0.1);
        coin.setVelocityY(150);
        coin.setData('value', 1);
        
        this.tweens.add({
            targets: coin,
            angle: 360,
            duration: 2000,
            repeat: -1
        });
        
        this.tweens.add({
            targets: coin,
            scale: 0.12,
            duration: 500,
            yoyo: true,
            repeat: -1
        });
        
        this.coinSpawnTimer.delay = Phaser.Math.Between(3000, 8000);
    }

    useBombEffect() {
        this.cameras.main.flash(500, 255, 255, 255);
        this.enemies.getChildren().slice().forEach(enemy => {
            this.handleBulletEnemyCollision({ 
                setActive: () => ({ setVisible: () => ({ body: { reset: () => {} } }) }),
                destroy: () => {}
            }, enemy);
        });
        this.bombText.setText(`BOMBS: ${GAME_STATE.upgrades.bombs}`);
    }
    
    spawnBoss() {
        if (this.hasBoss) return;
        
        this.hasBoss = true;
        this.spawnTimer.paused = true;
        this.swarmTimer.paused = true;
        
        this.enemies.getChildren().forEach(enemy => {
            if (enemy.enemyType !== 'boss') {
                enemy.destroy();
            }
        });
        
        boss.setScale(0.5);
        
        const bossHealth = 50 + Math.floor(GAME_STATE.score / 10000) * 25;
        boss.setData('health', bossHealth);
        this.enemies.add(boss);
        
        this.tweens.add({
            targets: this.bossFlash,
            alpha: 0.2,
            duration: 100,
            yoyo: true,
            repeat: -1,
            onStart: () => {
                this.bossFlash.setFillStyle(0x00ffff);
                this.cameras.main.shake(1000, 0.005);
            }
        });
        
        this.time.addEvent({
            delay: 500,
            callback: () => {
                const colors = [0x00ffff, 0xff00ff, 0xffff00, 0x00ff00];
                this.bossFlash.setFillStyle(colors[Math.floor(Math.random() * colors.length)]);
            },
            loop: true
        });
    }

    update(time, delta) {
        this.player.update(time, delta, this.cursors);
        
        GAME_STATE.playTime += delta;
        
        // Auto-save game data every 30 seconds
        if (!this.lastSaveTime) this.lastSaveTime = 0;
        if (time - this.lastSaveTime > 30000) {
            blockchainIntegration.saveGameData(GAME_STATE);
            this.lastSaveTime = time;
        }
        
        const minutes = Math.floor(GAME_STATE.playTime / 60000);
        const seconds = Math.floor((GAME_STATE.playTime % 60000) / 1000);
        this.timeText.setText(`TIME: ${minutes}:${seconds.toString().padStart(2, '0')}`);
        if (GAME_STATE.upgrades.laser > 0) {
            this.laserText.setText(`LASER: ${Math.ceil(GAME_STATE.upgrades.laser)}s`);
            this.laserText.setVisible(true);
        } else {
            this.laserText.setVisible(false);
        }
        
        if (!this.hasBoss && GAME_STATE.score > 0 && GAME_STATE.score % CONFIG.bossInterval < 100) {
            this.spawnBoss();
        }
        
        if (this.hasBoss && this.enemies.countActive() === 0) {
            this.hasBoss = false;
            this.spawnTimer.paused = false;
            this.swarmTimer.paused = false;
            this.bossFlash.setAlpha(0);
            this.cameras.main.flash(1000, 0, 255, 0);
        }
        
        if (GAME_STATE.score - GAME_STATE.lastUpgradeScore >= CONFIG.upgradeInterval) {
            this.grantRandomUpgrade();
            GAME_STATE.lastUpgradeScore = GAME_STATE.score;
        }
        
        if (this.activeBoost && time > this.boostEndTime) {
            this.endBoost();
        }
        
        if (this.activeBoost) {
            const remaining = Math.ceil((this.boostEndTime - time) / 1000);
            this.boostText.setText(`${this.activeBoost.toUpperCase()} BOOST: ${remaining}s`);
        }
        
        audioManager.updateSpeedContinuous(GAME_STATE.playTime);
    }

    handleBulletEnemyCollision(bullet, enemy) {
        bullet.setActive(false).setVisible(false).body.reset(0, -100);
        
        const flash = this.add.circle(enemy.x, enemy.y, 30, 0xffffff, 1);
        this.tweens.add({
            targets: flash,
            scale: 2,
            alpha: 0,
            duration: 200,
            onComplete: () => flash.destroy()
        });
        
        this.createExplosion(enemy.x, enemy.y);
        
        const isBoss = enemy.getData('health') !== undefined;

        // CGT Earning Logic: Much slower, requires movement + hit
        if (GAME_STATE.isMoving) {
            // Random chance for 1 CGT on normal kill, 10 for Boss
            if (!isBoss && Math.random() < 0.1) {
                this.earnCGT(1);
            }
        }

        // Handle health for bosses
        const health = enemy.getData('health');
        if (health !== undefined && health > 1) {
            enemy.setData('health', health - 1);
            this.cameras.main.shake(50, 0.005);
            audioManager.playHit();
            return;
        }

        if (isBoss) {
            this.earnCGT(10);
            this.cameras.main.flash(1000, 255, 255, 255);
        }
        audioManager.playExplosion();
        
        let points = enemy.points;
        if (this.activeBoost === 'double_points') {
            points *= 2;
        }
        
        GAME_STATE.score += points;
        this.scoreText.setText(`SCORE: ${GAME_STATE.score}`);
        GAME_STATE.killCount++;
        
        if (Math.random() < CONFIG.powerUpDropChance) {
            this.dropPowerUp(enemy.x, enemy.y);
        }
        
        if (Math.random() < CONFIG.coinDropChance) {
            this.dropCoin(enemy.x, enemy.y);
        }

        enemy.destroy();
    }

    async earnCGT(amount) {
        // Update local state
        GAME_STATE.cgtBalance += amount;
        this.cgtText.setText(`#CGT ${GAME_STATE.cgtBalance.toFixed(2)}`);
        
        // Award CGT on-chain (batched for efficiency)
        await blockchainIntegration.awardCGT(amount, 'gameplay_reward');
        
        // Update XP (1 XP per CGT earned)
        blockchainIntegration.updateXP(amount, 'galaga-creator');
    }

    handlePlayerCoinCollision(player, coin) {
        const coinValue = coin.getData('value') || 50;
        
        const colors = [0xffff00, 0xffd700, 0xffa500];
        for (let i = 0; i < 5; i++) {
            const particle = this.add.circle(coin.x, coin.y, 4, colors[Math.floor(Math.random() * colors.length)], 1);
            const angle = (Math.PI * 2 * i) / 5;
            const speed = 100;
            
            this.tweens.add({
                targets: particle,
                x: coin.x + Math.cos(angle) * speed,
                y: coin.y + Math.sin(angle) * speed,
                alpha: 0,
                scale: 0,
                duration: 500,
                onComplete: () => particle.destroy()
            });
        }
        
        coin.destroy();
        this.earnCGT(coinValue);
        audioManager.playCoin();
        
        this.tweens.add({
            targets: this.cgtText,
            scale: 1.2,
            duration: 100,
            yoyo: true
        });
    }
    dropCoin(x, y) {
        const coin = this.coins.create(x, y, 'coin').setScale(0.1);
        coin.setVelocityY(200);
        coin.setData('value', 50);
        
        this.tweens.add({
            targets: coin,
            angle: 360,
            duration: 1500,
            repeat: -1
        });
        
        const sparkle = this.add.circle(x, y, 3, 0xffff00, 0.8);
        this.tweens.add({
            targets: sparkle,
            alpha: 0,
            scale: 2,
            duration: 300,
            onComplete: () => sparkle.destroy()
        });
    }
    createExplosion(x, y) {
        const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff, 0xff6600, 0x00ff88];
        
        const ring = this.add.circle(x, y, 10, 0xffffff, 0.8);
        this.tweens.add({
            targets: ring,
            scale: 5,
            alpha: 0,
            duration: 300,
            onComplete: () => ring.destroy()
        });
        
        for (let burst = 0; burst < 2; burst++) {
            for (let i = 0; i < 8; i++) {
                const color = colors[Math.floor(Math.random() * colors.length)];
                const circle = this.add.circle(x, y, 4 + burst * 2, color, 1);
                
                const angle = (Math.PI * 2 * i / 8) + (burst * 0.4);
                const speed = 200 + Math.random() * 150 + (burst * 100);
                
                this.tweens.add({
                    targets: circle,
                    x: x + Math.cos(angle) * speed * 0.6,
                    y: y + Math.sin(angle) * speed * 0.6,
                    alpha: 0,
                    scale: 2 + burst,
                    duration: 400 + burst * 100,
                    ease: 'Power2',
                    onComplete: () => circle.destroy()
                });
            }
        }
        
        const core = this.add.circle(x, y, 15, 0xffffff, 1);
        this.tweens.add({
            targets: core,
            scale: 0,
            alpha: 0,
            duration: 200,
            onComplete: () => core.destroy()
        });
        
        this.cameras.main.shake(100, 0.01);
    }

    handlePlayerEnemyCollision(player, enemy) {
        if (player.hit()) {
            this.gameOver();
        }
        enemy.destroy();
    }

    dropPowerUp(x, y) {
        const types = ['speed', 'ammo', 'shield', 'bomb'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        const colors = { speed: 0x00ff00, ammo: 0xffff00, shield: 0x00ffff, bomb: 0xff0000 };
        const powerUp = this.powerUps.create(x, y, 'bullet');
        powerUp.setScale(2);
        powerUp.setTint(colors[type]);
        powerUp.setData('type', type);
        powerUp.setVelocityY(150);
        
        this.tweens.add({
            targets: powerUp,
            alpha: 0.3,
            duration: 300,
            yoyo: true,
            repeat: -1
        });
        
        this.tweens.add({
            targets: powerUp,
            angle: 360,
            duration: 2000,
            repeat: -1
        });
        
        const trail = this.add.circle(x, y, 10, colors[type], 0.3);
        this.tweens.add({
            targets: trail,
            scale: 2,
            alpha: 0,
            duration: 500,
            onComplete: () => trail.destroy()
        });
    }
    
    handlePlayerPowerUpCollision(player, powerUp) {
        const type = powerUp.getData('type');
        powerUp.destroy();
        
        switch (type) {
            case 'speed':
                GAME_STATE.upgrades.speed += 30;
                this.showUpgradeNotification('SPEED +30%');
                break;
            case 'ammo':
                GAME_STATE.upgrades.ammo += 30;
                this.showUpgradeNotification('AMMO +30%');
                break;
            case 'shield':
                GAME_STATE.upgrades.defense += 1;
                this.showUpgradeNotification('SHIELD +1');
                break;
            case 'bomb':
                GAME_STATE.upgrades.bombs += 1;
                this.showUpgradeNotification('BOMB +1');
                this.bombText.setText(`BOMBS: ${GAME_STATE.upgrades.bombs}`);
                break;
        }
        
        audioManager.playCoin();
    }
    
    grantRandomUpgrade() {
        const upgrades = ['ammo', 'speed', 'laser', 'defense', 'bomb'];
        const upgrade = upgrades[Math.floor(Math.random() * upgrades.length)];
        
        switch (upgrade) {
            case 'ammo':
                GAME_STATE.upgrades.ammo += 20;
                this.showUpgradeNotification('AMMO +20%');
                break;
            case 'speed':
                GAME_STATE.upgrades.speed += 20;
                this.showUpgradeNotification('SPEED +20%');
                break;
            case 'laser':
                GAME_STATE.upgrades.laser += 10;
                this.showUpgradeNotification('LASER +10s');
                break;
            case 'defense':
                GAME_STATE.upgrades.defense += 1;
                this.showUpgradeNotification('SHIELD +1');
                break;
            case 'bomb':
                GAME_STATE.upgrades.bombs += 1;
                this.showUpgradeNotification('BOMB +1');
                this.bombText.setText(`BOMBS: ${GAME_STATE.upgrades.bombs}`);
                break;
        }
    }
    
    showUpgradeNotification(text) {
        const notif = this.add.text(960, 540, text, {
            fontFamily: '"Press Start 2P"',
            fontSize: '42px',
            fill: '#ffff00'
        }).setOrigin(0.5).setAlpha(0);
        
        this.tweens.add({
            targets: notif,
            alpha: 1,
            y: 400,
            duration: 500,
            onComplete: () => {
                this.time.delayedCall(1000, () => {
                    this.tweens.add({
                        targets: notif,
                        alpha: 0,
                        duration: 500,
                        onComplete: () => notif.destroy()
                    });
                });
            }
        });
    }
    
    triggerRandomBoost() {
        if (this.activeBoost) return;
        
        const boosts = ['rapid_fire', 'invincible', 'double_points', 'mega_speed'];
        const boost = boosts[Math.floor(Math.random() * boosts.length)];
        
        this.activeBoost = boost;
        this.boostEndTime = this.time.now + 15000;
        this.boostText.setVisible(true);
        
        this.cameras.main.flash(500, 255, 215, 0);
        
        for (let i = 0; i < 12; i++) {
            const angle = (Math.PI * 2 * i) / 12;
            const ray = this.add.rectangle(960, 540, 20, 200, 0xffff00, 0.6);
            ray.setRotation(angle);
            
            this.tweens.add({
                targets: ray,
                alpha: 0,
                scaleY: 3,
                duration: 500,
                onComplete: () => ray.destroy()
            });
        }
        
        switch (boost) {
            case 'rapid_fire':
                this.originalAmmo = GAME_STATE.upgrades.ammo;
                GAME_STATE.upgrades.ammo *= 3;
                break;
            case 'invincible':
                this.player.isInvulnerable = true;
                this.player.setAlpha(0.7);
                break;
            case 'mega_speed':
                this.originalSpeed = GAME_STATE.upgrades.speed;
                GAME_STATE.upgrades.speed *= 2;
                break;
        }
    }
    
    endBoost() {
        switch (this.activeBoost) {
            case 'rapid_fire':
                GAME_STATE.upgrades.ammo = this.originalAmmo;
                break;
            case 'invincible':
                this.player.isInvulnerable = false;
                this.player.setAlpha(1);
                break;
            case 'mega_speed':
                GAME_STATE.upgrades.speed = this.originalSpeed;
                break;
        }
        
        this.activeBoost = null;
        this.boostText.setVisible(false);
    }

    async gameOver() {
        // Save game data on-chain before game over
        await blockchainIntegration.saveGameData(GAME_STATE);
        
        // Process any pending CGT rewards
        await blockchainIntegration.processRewardQueue();
        audioManager.stopMusic();
        this.physics.pause();
        
        const gameOverText = this.add.text(960, 450, 'GAME OVER', { 
            fontFamily: '"Press Start 2P"', 
            fontSize: '84px',
            fill: '#ff0000' 
        }).setOrigin(0.5);

        const restartBtn = this.add.text(960, 650, 'RESTART MISSION', { 
            fontFamily: '"Press Start 2P"', 
            fontSize: '42px',
            fill: '#ffffff' 
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        restartBtn.on('pointerdown', () => {
            this.resetGameState();
            audioManager.startMusic();
            this.scene.restart(); // Using restart() is cleaner when staying in the same scene
        });

        const menuBtn = this.add.text(960, 750, 'QUIT TO MENU', { 
            fontFamily: '"Press Start 2P"', 
            fontSize: '32px',
            fill: '#aaaaaa' 
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        menuBtn.on('pointerdown', () => {
            this.resetGameState();
            this.scene.start('MenuScene');
        });
    }

    resetGameState() {
        GAME_STATE.score = 0;
        GAME_STATE.playTime = 0;
        GAME_STATE.killCount = 0;
        GAME_STATE.lastUpgradeScore = 0;
        GAME_STATE.upgrades = { ammo: 100, speed: 100, laser: 0, defense: 0, bombs: 0 };
    }
}
