export const COLLISION_TILE_SIZE = 16;
export const LEVEL_SCALE = 4;
export const TILE_SIZE = COLLISION_TILE_SIZE * LEVEL_SCALE;
const PLAYER_END_MARGIN = 128;

export function getEntityBox(entity) {
  return { x: entity.x * LEVEL_SCALE, y: entity.y * LEVEL_SCALE, width: entity.width * LEVEL_SCALE, height: entity.height * LEVEL_SCALE };
}

export function placeOnEntity(object, entity) {
  const box = getEntityBox(entity);
  const hitbox = object.getHitbox();
  object.x += box.x + box.width / 2 - (hitbox.x + hitbox.width / 2);
  object.y += box.y + box.height - (hitbox.y + hitbox.height);
}

export class Level {
  enemies;
  items;
  data;
  layers;
  collisionGrid = [];
  collisionTileSize = COLLISION_TILE_SIZE;
  levelEndX = 6000;
  width = 0;
  height = 0;

  constructor(enemies, items = [], { data, layers, collisionGrid } = {}) {
    this.enemies = enemies;
    this.items = items;
    this.data = data;
    this.layers = layers ?? [];
    this.collisionGrid = collisionGrid ?? [];
    this.width = (data?.width ?? 0) * LEVEL_SCALE;
    this.height = (data?.height ?? 0) * LEVEL_SCALE;
    if (data) this.levelEndX = this.width - PLAYER_END_MARGIN;
  }

  getEntities(name) {
    return this.data?.entities?.[name] ?? [];
  }

  tileAt(column, row) {
    return this.collisionGrid[row]?.[column] ?? 0;
  }
}
