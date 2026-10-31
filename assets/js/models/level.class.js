export const COLLISION_TILE_SIZE = 32;
export const LEVEL_SCALE = 1;
export const TILE_SIZE = COLLISION_TILE_SIZE * LEVEL_SCALE;
const PLAYER_END_MARGIN = 128;

export function getEntityBox(entity) {
  return { x: entity.x * LEVEL_SCALE, y: entity.y * LEVEL_SCALE, width: entity.width * LEVEL_SCALE, height: entity.height * LEVEL_SCALE };
}

export function getPlacementOnEntity(object, entity) {
  const box = getEntityBox(entity);
  const hitbox = object.getHitbox();
  return {
    x: object.x + box.x + box.width / 2 - (hitbox.x + hitbox.width / 2),
    y: object.y + box.y + box.height - (hitbox.y + hitbox.height),
  };
}

export function placeOnEntity(object, entity) {
  const { x, y } = getPlacementOnEntity(object, entity);
  object.x = x;
  object.y = y;
}

export class Level {
  enemies;
  items;
  keys;
  exits;
  bossEffects = [];
  data;
  layers;
  collisionGrid = [];
  levelEndX = 0;
  width = 0;
  height = 0;

  constructor(enemies, items = [], { data, layers, collisionGrid } = {}, keys = [], exits = []) {
    this.enemies = enemies;
    this.items = items;
    this.keys = keys;
    this.exits = exits;
    this.data = data;
    this.layers = layers ?? [];
    this.collisionGrid = collisionGrid ?? [];
    this.width = (data?.width ?? 0) * LEVEL_SCALE;
    this.height = (data?.height ?? 0) * LEVEL_SCALE;
    this.levelEndX = this.width - PLAYER_END_MARGIN;
  }

  getEntities(name) {
    return this.data?.entities?.[name] ?? [];
  }

  tileAt(column, row) {
    return this.collisionGrid[row]?.[column] ?? 0;
  }
}
