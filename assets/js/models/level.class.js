export class Level {
  enemies;
  items;
  data;
  layers;
  levelEndX = 6000;

  constructor(enemies, items = [], { data, layers } = {}) {
    this.enemies = enemies;
    this.items = items;
    this.data = data;
    this.layers = layers ?? [];
  }
}
