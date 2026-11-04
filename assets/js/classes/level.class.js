export const COLLISION_TILE_SIZE = 32;
export const LEVEL_SCALE = 1;
export const TILE_SIZE = COLLISION_TILE_SIZE * LEVEL_SCALE;
const PLAYER_END_MARGIN = 128;

/**
 * Gets the scaled box of a level entity.
 * @param {{x: number, y: number, width: number, height: number}} entity - Level entity.
 * @returns {{x: number, y: number, width: number, height: number}} Scaled box.
 */
export function getEntityBox(entity) {
  return { x: entity.x * LEVEL_SCALE, y: entity.y * LEVEL_SCALE, width: entity.width * LEVEL_SCALE, height: entity.height * LEVEL_SCALE };
}

/**
 * Calculates the position that puts an object's hitbox centered on the bottom of an entity box.
 * @param {DrawableObject} object - Object to place.
 * @param {Object} entity - Level entity to place it on.
 * @returns {{x: number, y: number}} Target object position.
 */
export function getPlacementOnEntity(object, entity) {
  const box = getEntityBox(entity);
  const hitbox = object.getHitbox();
  return {
    x: object.x + box.x + box.width / 2 - (hitbox.x + hitbox.width / 2),
    y: object.y + box.y + box.height - (hitbox.y + hitbox.height),
  };
}

/**
 * Moves an object so its hitbox stands centered on an entity box.
 * @param {DrawableObject} object - Object to place.
 * @param {Object} entity - Level entity to place it on.
 */
export function placeOnEntity(object, entity) {
  const { x, y } = getPlacementOnEntity(object, entity);
  object.x = x;
  object.y = y;
}

/** A loaded level with its objects, layers, collision grid and size. */
export class Level {
  enemies;
  items;
  keys;
  exits;
  checkpoints;
  healingPlants;
  bossEffects = [];
  data;
  layers;
  collisionGrid = [];
  levelEndX = 0;
  width = 0;
  height = 0;

  /**
   * @param {Enemy[]} enemies - Enemies including the boss.
   * @param {ChargeItem[]} [items=[]] - Coins.
   * @param {{data: Object, layers: Array, collisionGrid: number[][]}} [levelAssets={}] - Loaded level assets.
   * @param {KeyItem[]} [keys=[]] - Keys.
   * @param {ExitPortal[]} [exits=[]] - Exit portals.
   * @param {Checkpoint[]} [checkpoints=[]] - Checkpoints.
   * @param {HealingPlant[]} [healingPlants=[]] - Healing plants.
   */
  constructor(enemies, items = [], { data, layers, collisionGrid } = {}, keys = [], exits = [], checkpoints = [], healingPlants = []) {
    this.enemies = enemies;
    this.items = items;
    this.keys = keys;
    this.exits = exits;
    this.checkpoints = checkpoints;
    this.healingPlants = healingPlants;
    this.data = data;
    this.layers = layers ?? [];
    this.collisionGrid = collisionGrid ?? [];
    this.width = (data?.width ?? 0) * LEVEL_SCALE;
    this.height = (data?.height ?? 0) * LEVEL_SCALE;
    this.levelEndX = this.width - PLAYER_END_MARGIN;
  }

  /**
   * Gets all raw entities of a type from the level data.
   * @param {string} name - Entity type, e.g. "Boss".
   * @returns {Object[]} Matching entities or an empty array.
   */
  getEntities(name) {
    return this.data?.entities?.[name] ?? [];
  }

  /**
   * Gets the collision tile at a grid position.
   * @param {number} column - Tile column.
   * @param {number} row - Tile row.
   * @returns {number} Tile type, or 0 outside the grid.
   */
  tileAt(column, row) {
    return this.collisionGrid[row]?.[column] ?? 0;
  }
}
