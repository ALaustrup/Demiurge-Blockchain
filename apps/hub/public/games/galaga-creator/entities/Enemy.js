import Phaser from 'phaser';
import { CONFIG, GAME_STATE } from '../config.js';

export class Enemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, type) {
        const enemyData = this.getEnemyData(type);
        
        super(scene, x, y, enemyData.key);
        scene.physics.add.existing(this);
        
        this.enemyType = type;
        this.points = enemyData.points;
        this.setScale(enemyData.scale);
        this.setTint(enemyData.tint);
        this.originalX = x;
        this.originalY = y;
        this.isDiving = false;
        const difficultyMultiplier = 1 + (GAME_STATE.playTime / 120000);
        this.diveSpeed = enemyData.speed * difficultyMultiplier;
    }
    
    getEnemyData(type) {
        const types = {
            'bee': { key: 'enemy_bee', points: 100, scale: 0.1, speed: 300, tint: 0xffff00 },
            'butterfly': { key: 'enemy_butterfly', points: 200, scale: 0.1, speed: 250, tint: 0xff00ff },
            'boss': { key: 'enemy_boss', points: 5000, scale: 0.15, speed: 200, tint: 0xffffff },
            'red_bee': { key: 'enemy_bee', points: 150, scale: 0.12, speed: 350, tint: 0xff0000 },
            'cyan_butterfly': { key: 'enemy_butterfly', points: 250, scale: 0.11, speed: 280, tint: 0x00ffff },
            'purple_bee': { key: 'enemy_bee', points: 300, scale: 0.13, speed: 400, tint: 0xff00ff }
        };
        return types[type] || types['bee'];
    }

    update(time, delta) {
        if (!this.isDiving) {
            const sway = Math.sin(time / 1000) * 20;
            this.x = this.originalX + sway;
            
            const pulse = 1 + Math.sin(time / 500) * 0.05;
            this.setScale((this.getData('originalScale') || this.scaleX) * pulse);
            
            const difficultyMultiplier = 1 + (GAME_STATE.playTime / 120000);
            const diveChance = 0.0005 * difficultyMultiplier;
            if (Math.random() < diveChance) {
                this.startDive();
            }
        } else {
            // Diving logic
            if (this.y > 1100) {
                this.y = -50; // Wrap around to top
            }
            if (Math.abs(this.y - this.originalY) < 10 && this.y > 0 && this.body.velocity.y < 0) {
                this.stopDive();
            }
        }
    }

    startDive() {
        this.isDiving = true;
        const player = this.scene.player;
        if (player) {
            // Procedural variation: some dive straight, some home in
            if (Math.random() > 0.3) {
                this.scene.physics.moveToObject(this, player, this.diveSpeed);
            } else {
                this.setVelocityY(this.diveSpeed);
            }
        } else {
            this.setVelocityY(this.diveSpeed);
        }
    }

    stopDive() {
        this.isDiving = false;
        this.setVelocity(0, 0);
        this.x = this.originalX;
        this.y = this.originalY;
    }
}
