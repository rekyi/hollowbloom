export const COLLISION_TILE_SIZE = 16;

export class Level {
  enemies;
  items;
  data;
  layers;
  collisionGrid = [];
  collisionTileSize = COLLISION_TILE_SIZE;
  levelEndX = 6000;

  constructor(enemies, items = [], { data, layers, collisionGrid } = {}) {
    this.enemies = enemies;
    this.items = items;
    this.data = data;
    this.layers = layers ?? [];
    this.collisionGrid = collisionGrid ?? [];
  }
}
