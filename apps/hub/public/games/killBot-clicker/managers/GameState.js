import { GAME_CONFIG } from '../config.js';

export default class GameState {
    constructor() {
        this.cgt = 0;
        this.totalCgtMined = 0;
        this.prestigeSeeds = 0;
        this.relics = []; 
        this.boosters = {}; // { id: endTime }
        this.currentSector = { x: 0, y: 0 };
        this.hotspots = []; // List of {x, y}
        this.upgrades = {
            click_power: 0,
            auto_miner_speed: 0,
            auto_miner_power: 0,
            crit_chance: 0
        };
        this.droneUpgrades = {
            mboard_cpu: 0,
            mboard_ram: 0,
            mboard_cooling: 0,
            mboard_link: 0
        };
        this.ownedPets = [];
        this.activePetId = null;
        this.load();
    }

    save() {
        const data = {
            cgt: this.cgt,
            totalCgtMined: this.totalCgtMined,
            prestigeSeeds: this.prestigeSeeds,
            relics: this.relics,
            boosters: this.boosters,
            currentSector: this.currentSector,
            upgrades: this.upgrades,
            droneUpgrades: this.droneUpgrades,
            ownedPets: this.ownedPets,
            activePetId: this.activePetId
        };
        localStorage.setItem(GAME_CONFIG.STORAGE_KEY, JSON.stringify(data));
    }

    load() {
        const saved = localStorage.getItem(GAME_CONFIG.STORAGE_KEY);
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.cgt = data.cgt || 0;
                this.totalCgtMined = data.totalCgtMined || 0;
                this.prestigeSeeds = data.prestigeSeeds || 0;
                this.relics = data.relics || [];
                this.boosters = data.boosters || {};
                this.currentSector = data.currentSector || { x: 0, y: 0 };
                this.upgrades = { ...this.upgrades, ...data.upgrades };
                this.droneUpgrades = { ...this.droneUpgrades, ...(data.droneUpgrades || {}) };
                this.ownedPets = data.ownedPets || [];
                this.activePetId = data.activePetId || null;
            } catch (e) {
                console.error('Failed to load save', e);
            }
        }
    }

    buyPet(id) {
        const pet = GAME_CONFIG.DATA_PETS.find(p => p.id === id);
        if (pet && !this.ownedPets.includes(id) && this.spendCGT(pet.cost)) {
            this.ownedPets.push(id);
            this.activePetId = id;
            this.save();
            return true;
        }
        return false;
    }

    setActivePet(id) {
        if (this.ownedPets.includes(id) || id === null) {
            this.activePetId = id;
            this.save();
            return true;
        }
        return false;
    }

    getPetBonus(type) {
        if (!this.activePetId) return 0;
        const pet = GAME_CONFIG.DATA_PETS.find(p => p.id === this.activePetId);
        if (pet && pet.bonusType === type) return pet.bonusValue;
        return 0;
    }

    isBoosterActive(id) {
        return this.boosters[id] && this.boosters[id] > Date.now();
    }

    applyBooster(id, duration) {
        const startTime = this.isBoosterActive(id) ? this.boosters[id] : Date.now();
        this.boosters[id] = startTime + duration;
        this.save();
    }

    hasRelic(id) {
        return this.relics.includes(id);
    }

    addRelic(id) {
        if (!this.hasRelic(id)) {
            this.relics.push(id);
            this.save();
            return true;
        }
        return false;
    }

    getPrestigeMultiplier() {
        // Each seed gives 10% bonus
        return 1 + (this.prestigeSeeds * 0.1);
    }

    getPendingSeeds() {
        if (this.totalCgtMined < GAME_CONFIG.PRESTIGE.MIN_CGT_REQUIRED) return 0;
        // Formula: floor(sqrt(total / min))
        return Math.floor(Math.sqrt(this.totalCgtMined / GAME_CONFIG.PRESTIGE.MIN_CGT_REQUIRED));
    }

    prestige() {
        const pending = this.getPendingSeeds();
        if (pending > 0) {
            this.prestigeSeeds += pending;
            // Reset core progress
            this.cgt = 0;
            this.totalCgtMined = 0;
            this.upgrades = {
                click_power: 0,
                auto_miner_speed: 0,
                auto_miner_power: 0,
                crit_chance: 0
            };
            // Note: Drone Motherboard upgrades typically persist through prestige in this design
            this.save();
            return true;
        }
        return false;
    }

    addCGT(amount) {
        let multipliedAmount = amount * this.getPrestigeMultiplier() * this.getSectorMultiplier();
        if (this.isBoosterActive('data_surge')) multipliedAmount *= 2;
        this.cgt += multipliedAmount;
        this.totalCgtMined += multipliedAmount;
        this.save();
    }

    isAtHotspot() {
        return this.hotspots.some(h => h.x === this.currentSector.x && h.y === this.currentSector.y);
    }

    getSectorMultiplier() {
        return this.isAtHotspot() ? 1.5 : 1.0;
    }

    spendCGT(amount) {
        if (this.cgt >= amount) {
            this.cgt -= amount;
            this.save();
            return true;
        }
        return false;
    }

    getUpgradeLevel(id) {
        if (this.upgrades[id] !== undefined) return this.upgrades[id];
        if (this.droneUpgrades[id] !== undefined) return this.droneUpgrades[id];
        return 0;
    }

    getUpgradeCost(id) {
        let upgrade = GAME_CONFIG.UPGRADES.find(u => u.id === id);
        if (!upgrade) {
            upgrade = GAME_CONFIG.DRONE_MOTHERBOARD.find(u => u.id === id);
        }
        if (!upgrade) return Infinity;

        const level = this.getUpgradeLevel(id);
        let cost = Math.floor(upgrade.baseCost * Math.pow(upgrade.costMult, level));

        // Apply Cryo-Rails discount to Drone Frequency
        if (id === 'auto_miner_speed') {
            const coolingLevel = this.droneUpgrades['mboard_cooling'] || 0;
            const discount = 1 - (coolingLevel * 0.05);
            cost = Math.floor(cost * Math.max(0.1, discount));
        }

        return cost;
    }

    upgrade(id) {
        const cost = this.getUpgradeCost(id);
        if (cost !== Infinity && this.spendCGT(cost)) {
            if (this.upgrades[id] !== undefined) {
                this.upgrades[id]++;
            } else if (this.droneUpgrades[id] !== undefined) {
                this.droneUpgrades[id]++;
            }
            this.save();
            return true;
        }
        return false;
    }

    getClickPower() {
        const level = this.getUpgradeLevel('click_power');
        const upgrade = GAME_CONFIG.UPGRADES.find(u => u.id === 'click_power');
        if (!upgrade) return 1;
        let power = upgrade.powerBase + (level * upgrade.powerMult);
        if (this.hasRelic('silicon_shard')) power *= 1.1;
        if (this.isBoosterActive('neural_overclock')) power *= 3;
        
        // Pet Bonus
        const petMult = this.getPetBonus('manual_mult');
        if (petMult > 0) power *= (1 + petMult);
        
        return power;
    }

    getAutoMinerInterval() {
        const level = this.getUpgradeLevel('auto_miner_speed');
        const upgrade = GAME_CONFIG.UPGRADES.find(u => u.id === 'auto_miner_speed');
        if (!upgrade) return 1000;
        // Floor at 100ms
        let interval = Math.max(100, upgrade.powerBase * Math.pow(upgrade.powerMult, level));
        if (this.hasRelic('logic_gate')) interval *= 0.9;
        if (this.isBoosterActive('daemon_rush')) interval *= 0.5;
        return interval;
    }

    getCritMultiplier() {
        return this.hasRelic('overclock_chip') ? 8 : 5;
    }

    getBreachDurationModifier() {
        return this.hasRelic('buffer_overflow') ? 1.2 : 1.0;
    }

    getAutoMinerPower() {
        const level = this.getUpgradeLevel('auto_miner_power');
        if (level === 0) return 0;
        const upgrade = GAME_CONFIG.UPGRADES.find(u => u.id === 'auto_miner_power');
        if (!upgrade) return 0;
        
        let power = upgrade.powerBase + ((level - 1) * upgrade.powerMult);
        
        // Fleet Processor global multiplier
        const cpuLevel = this.droneUpgrades['mboard_cpu'] || 0;
        const cpuMult = 1 + (cpuLevel * 0.2);
        power *= cpuMult;

        // Pet Bonus
        const petMult = this.getPetBonus('drone_mult');
        if (petMult > 0) power *= (1 + petMult);
        
        return power;
    }

    getDroneCritChance() {
        const ramLevel = this.droneUpgrades['mboard_ram'] || 0;
        let chance = ramLevel * 2; // 2% per level

        // Pet Bonus (Crit eye adds to global crit, applying to drones too if needed, but let's keep it global)
        const petBonus = this.getPetBonus('crit_chance');
        if (petBonus > 0) chance += petBonus;

        return chance;
    }

    getDroneOverdriveMult() {
        const linkLevel = this.droneUpgrades['mboard_link'] || 0;
        let mult = linkLevel > 0 ? 5 : 1;

        // Pet Bonus
        const petMult = this.getPetBonus('overdrive_mult');
        if (petMult > 0) mult *= petMult;

        return mult;
    }

    getCritChance() {
        const level = this.getUpgradeLevel('crit_chance');
        const upgrade = GAME_CONFIG.UPGRADES.find(u => u.id === 'crit_chance');
        if (!upgrade) return 0;
        let chance = upgrade.powerBase + (level * upgrade.powerMult);

        // Pet Bonus
        const petBonus = this.getPetBonus('crit_chance');
        if (petBonus > 0) chance += petBonus;

        return chance;
    }
}
