export const CONFIG = {
    width: 1920,
    height: 1080,
    playerSpeed: 600,
    bulletSpeed: 800,
    maxBullets: 5,
    coinDropChance: 0.01,
    bossInterval: 50000,
    upgradeInterval: 10000,
    swarmInterval: 5000,
    powerUpDropChance: 0.05
};
export const GAME_STATE = {
    score: 0,
    cgtBalance: 0,
    equippedSkin: 'player',
    ownedSkins: ['player'],
    upgrades: {
        ammo: 100,
        speed: 100,
        laser: 0,
        defense: 0,
        bombs: 0
    },
    isMoving: false,
    killCount: 0,
    playTime: 0,
    lastUpgradeScore: 0
};

export const SKINS = [
    { id: 'player', name: 'ORIGIN SHIP', price: 0, image: 'player' },
    { id: 'skin_red', name: 'CARMINE FURY', price: 50, image: 'ship_skin_red' },
    { id: 'skin_gold', name: 'AURIC TITAN', price: 150, image: 'ship_skin_gold' },
    { id: 'skin_void', name: 'VOID STALKER', price: 300, image: 'ship_skin_void' }
];
