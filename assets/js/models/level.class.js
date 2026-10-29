export const COLLISION_TILE_SIZE = 16;
export const LEVEL_SCALE = 4;
export const TILE_SIZE = COLLISION_TILE_SIZE * LEVEL_SCALE;
const PLAYER_END_MARGIN = 128;

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

  tileAt(column, row) {
    return this.collisionGrid[row]?.[column] ?? 0;
  }
}
