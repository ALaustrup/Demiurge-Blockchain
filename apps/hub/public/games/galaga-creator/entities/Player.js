import Phaser from 'phaser';
import { CONFIG, GAME_STATE, SKINS } from '../config.js';

// Bullet class must be defined before Player uses it
class Bullet extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y);
        
        if (!scene.textures.exists('bullet')) {
            const graphics = scene.make.graphics({ x: 0, y: 0, add: false });
            graphics.fillStyle(0xffffff, 1);
            graphics.fillRect(0, 0, 8, 20);
            graphics.generateTexture('bullet', 8, 20);
        }
        
        this.setTexture('bullet');
        this.chromaIndex = 0;
    }
    
    fire(x, y) {
        this.body.reset(x, y);
        this.setActive(true);
        this.setVisible(true);
        this.setVelocityY(-CONFIG.bulletSpeed);
        
        const colors = [0xff0000, 0xff7f00, 0xffff00, 0x00ff00, 0x0000ff, 0x8b00ff];
        const chosenColor = colors[Math.floor(Math.random() * colors.length)];
        this.setTint(chosenColor);
        this.setScale(1.2);
        
        const sparkle = this.scene.add.circle(x, y, 8, chosenColor, 0.6);
        this.scene.tweens.add({
            targets: sparkle,
            scale: 0,
            alpha: 0,
            duration: 200,
            onComplete: () => sparkle.destroy()
        });
    }
    
    preUpdate(time, delta) {
        super.preUpdate(time, delta);
        
        if (this.active) {
            this.setScale(1.2 + Math.sin(time / 100) * 0.3);
            
            if (Math.random() < 0.3) {
                const trail = this.scene.add.circle(this.x, this.y, 3, this.tintTopLeft, 0.6);
                this.scene.tweens.add({
                    targets: trail,
                    y: trail.y + 20,
                    alpha: 0,
                    scale: 0,
                    duration: 300,
                    onComplete: () => trail.destroy()
                });
            }
            
            if (this.y < -50) {
                this.setActive(false);
                this.setVisible(false);
            }
        }
    }
}

export class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        const equippedSkin = SKINS.find(s => s.id === GAME_STATE.equippedSkin) || SKINS[0];
        super(scene, x, y, equippedSkin.image);
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.setCollideWorldBounds(true);
        this.setScale(0.15); // Adjust for 1080p
        
        this.bullets = scene.physics.add.group({
            classType: Bullet,
            maxSize: 10,
            runChildUpdate: true
        });

        this.lastFired = 0;
        this.isInvulnerable = false;
        this.shield = null;
        this.laserActive = false;
        this.laserBeam = null;
    }

    update(time, delta, cursors) {
        const speed = CONFIG.playerSpeed * (GAME_STATE.upgrades.speed / 100);
        let moving = false;
        
        if (cursors.left.isDown) {
            this.setVelocityX(-speed);
            moving = true;
        } else if (cursors.right.isDown) {
            this.setVelocityX(speed);
            moving = true;
        } else {
            this.setVelocityX(0);
        }

        GAME_STATE.isMoving = moving;

        if (GAME_STATE.upgrades.laser > 0 && !this.laserActive) {
            this.activateLaser();
        }

        if (this.laserActive) {
            this.updateLaser(delta);
        } else if (cursors.space.isDown && time > this.lastFired) {
            this.fireBullet(time);
        }

        if (cursors.shift?.isDown && GAME_STATE.upgrades.bombs > 0) {
            this.useBomb();
        }

        if (GAME_STATE.upgrades.defense > 0 && !this.shield) {
            this.createShield();
        }
    }

    activateLaser() {
        this.laserActive = true;
        this.laserBeam = this.scene.add.rectangle(this.x, this.y - 540, 40, 1080, 0x00ffff, 0.6);
        this.scene.physics.add.existing(this.laserBeam);
        this.laserBeam.body.setAllowGravity(false);
    }

    updateLaser(delta) {
        if (GAME_STATE.upgrades.laser > 0) {
            GAME_STATE.upgrades.laser -= delta / 1000;
            this.laserBeam.x = this.x;
            this.laserBeam.y = this.y - 540;
            
            // Check collisions manually or with overlap
            this.scene.physics.overlap(this.laserBeam, this.scene.enemies, (beam, enemy) => {
                this.scene.handleBulletEnemyCollision({ 
                    setActive: () => ({ setVisible: () => ({ body: { reset: () => {} } }) }),
                    destroy: () => {}
                }, enemy);
            });
        } else {
            this.laserActive = false;
            this.laserBeam.destroy();
            this.laserBeam = null;
        }
    }

    useBomb() {
        GAME_STATE.upgrades.bombs--;
        this.scene.useBombEffect();
    }

    fireBullet(time) {
        const ammoScale = GAME_STATE.upgrades.ammo / 100;
        const cooldown = 250 / ammoScale;
        
        const bullet = this.bullets.get(this.x, this.y - 40);
        if (bullet) {
            bullet.fire(this.x, this.y - 40);
            this.lastFired = time + cooldown;
            import('../AudioManager.js').then(m => m.audioManager.playShoot());
        }
    }

    createShield() {
        this.shield = this.scene.add.circle(this.x, this.y, 60, 0x00ffff, 0.3);
        this.scene.physics.add.existing(this.shield);
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);
        if (this.shield) {
            this.shield.x = this.x;
            this.shield.y = this.y;
        }
    }

    hit() {
        if (this.isInvulnerable) return;

        if (GAME_STATE.upgrades.defense > 0) {
            GAME_STATE.upgrades.defense--;
            if (GAME_STATE.upgrades.defense === 0 && this.shield) {
                this.shield.destroy();
                this.shield = null;
            }
            this.becomeInvulnerable(1000);
            return false; // Not dead
        }
        return true; // Dead
    }

    becomeInvulnerable(duration) {
        this.isInvulnerable = true;
        this.alpha = 0.5;
        this.scene.time.delayedCall(duration, () => {
            this.isInvulnerable = false;
            this.alpha = 1;
        });
    }
}
