// Allowed plant species for a habit, cosmetic only, no effect on growth
// math. This list is duplicated (on purpose, no shared package between
// client/server) in client/src/pixelart/plantSprites.js, which holds the
// matching pixel art + labels. If you add/remove/rename a species here,
// update that file too so they don't silently drift apart.
export const PLANT_SPECIES = ['sunflower', 'cactus', 'mushroom', 'clover', 'bonsai'];

export const DEFAULT_SPECIES = 'sunflower';
