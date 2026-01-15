export const GAME_CONFIG = {
    WIDTH: 1920,
    HEIGHT: 1080,
    STORAGE_KEY: 'cgt_miner_arcade_save',
    COLORS: {
        CYAN: 0x00FFC8,
        ORANGE: 0xFF3D00,
        GLASS: 0x001111,
        BG: 0x000505
    },
    UPGRADES: [
        {
            id: 'click_power',
            name: 'Neural Link',
            description: 'Increase hashrate per manual pulse',
            baseCost: 10,
            costMult: 1.5,
            powerBase: 1,
            powerMult: 1,
            icon: '🔗'
        },
        {
            id: 'auto_miner_speed',
            name: 'Drone Frequency',
            description: 'Increase clock speed of active drones',
            baseCost: 50,
            costMult: 1.8,
            powerBase: 1000,
            powerMult: 0.9,
            icon: '🚁'
        },
        {
            id: 'auto_miner_power',
            name: 'Drone Capacity',
            description: 'Increase data payload per drone cycle',
            baseCost: 200,
            costMult: 2.0,
            powerBase: 1,
            powerMult: 1,
            icon: '🧵'
        },
        {
            id: 'crit_chance',
            name: 'Quantum Analysis',
            description: 'Chance to find massive data clusters',
            baseCost: 1000,
            costMult: 3.0,
            powerBase: 5,
            powerMult: 2,
            icon: '💎'
        }
    ],
    DRONE_MOTHERBOARD: [
        {
            id: 'mboard_cpu',
            name: 'Fleet Processor',
            description: 'Global yield multiplier for all drones',
            baseCost: 5000,
            costMult: 2.5,
            powerBase: 1.0,
            powerMult: 0.2, // +20% per level
            icon: '🧠'
        },
        {
            id: 'mboard_ram',
            name: 'Neural Cache',
            description: 'Drones gain 2% crit chance per level',
            baseCost: 8000,
            costMult: 3.0,
            powerBase: 0,
            powerMult: 2,
            icon: '💾'
        },
        {
            id: 'mboard_cooling',
            name: 'Cryo-Rails',
            description: 'Reduces Drone Frequency cost by 5% per level',
            baseCost: 15000,
            costMult: 4.0,
            powerBase: 1.0,
            powerMult: 0.05,
            icon: '❄️'
        },
        {
            id: 'mboard_link',
            name: 'Sub-Net Link',
            description: 'Drones produce 5x during Overdrive',
            baseCost: 50000,
            costMult: 10.0,
            powerBase: 1,
            powerMult: 1,
            icon: '📡'
        }
    ],
    PRESTIGE: {
        MIN_CGT_REQUIRED: 1000000
    },
    MARKET_ITEMS: [
        {
            id: 'data_surge',
            name: 'Data Surge',
            description: '2x total production for 1 hour',
            cost: 5000,
            duration: 3600000,
            icon: '⚡'
        },
        {
            id: 'neural_overclock',
            name: 'Neural Overclock',
            description: '3x click power for 15 minutes',
            cost: 2000,
            duration: 900000,
            icon: '🧠'
        },
        {
            id: 'daemon_rush',
            name: 'Daemon Rush',
            description: '2x drone speed for 30 minutes',
            cost: 3500,
            duration: 1800000,
            icon: '😈'
        }
    ],
    RELICS: [
        { id: 'silicon_shard', name: 'Silicon Shard', description: '+10% Click Power', icon: '💎' },
        { id: 'logic_gate', name: 'Logic Gate', description: '+10% Drone Speed', icon: '💾' },
        { id: 'overclock_chip', name: 'Overclock Chip', description: 'Crits deal 8x instead of 5x', icon: '🔌' },
        { id: 'buffer_overflow', name: 'Buffer Overflow', description: '+20% Breach duration', icon: '🐛' }
    ],
    BOSSES: [
        { name: 'System Sentinel', hp: 10000, reward: 5000 },
        { name: 'Data Leviathan', hp: 50000, reward: 25000 },
        { name: 'Core Architect', hp: 250000, reward: 125000 }
    ],
    // --- DATA PETS ---
    DATA_PETS: [
        {
            id: 'pulse_core',
            name: 'PULSE CORE',
            description: 'A stabilized energy orb. +15% Manual Mining Power.',
            cost: 5000,
            bonusType: 'manual_mult',
            bonusValue: 0.15,
            color: 0x00ffff,
            icon: '💠'
        },
        {
            id: 'drone_link',
            name: 'DRONE LINK',
            description: 'Advanced signal repeater. +20% Drone Production.',
            cost: 25000,
            bonusType: 'drone_mult',
            bonusValue: 0.20,
            color: 0xff00ff,
            icon: '📡'
        },
        {
            id: 'crit_eye',
            name: 'CRIT-EYE',
            description: 'Analyzes data weakpoints. +5% Global Critical Chance.',
            cost: 100000,
            bonusType: 'crit_chance',
            bonusValue: 5, // 5%
            color: 0xffff00,
            icon: '👁️'
        },
        {
            id: 'void_siphon',
            name: 'VOID SIPHON',
            description: 'Harvests background noise. 2x Production during Overdrive.',
            cost: 500000,
            bonusType: 'overdrive_mult',
            bonusValue: 2,
            color: 0x7700ff,
            icon: '🌌'
        }
    ],
    ASSETS: {
        BACKGROUND: 'https://rosebud.ai/assets/data_forge_bg.webp?0BiM',
        MINING_CORE: 'https://rosebud.ai/assets/mining_core.webp?1hns'
    },
    EVENTS: {
        BREACH: {
            CHANCE: 0.008, // Increased chance slightly
            CHECK_INTERVAL: 5000,
            DURATION: 20000,
            MULTIPLIER: 15, // Higher reward for high-skill
            GRID_SIZE: 3, // 3x3 grid
            PATTERN_COUNT: 5 // Steps in sequence
        },
        BOSS: {
            CHANCE: 0.002, // 0.2% per check
            CHECK_INTERVAL: 10000,
            DURATION: 30000,
            BASE_HEALTH: 1000,
            REWARD_MULT: 100,
            SATELLITE_STRIKE_DAMAGE: 0.25 // 25% of Max HP
        },
        SUPER_MODE: {
            CHANCE: 0.01, // 1% chance on manual click
            DURATION: 10000,
            MULTIPLIER: 5
        }
    },
    SECTORS: {
        GRID_SIZE: 8,
        REFRESH_INTERVAL: 60000, // 1 minute
        HOTSPOT_COUNT: 5
    }
};

