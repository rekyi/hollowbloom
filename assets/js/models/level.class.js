export class Level {
  enemies;
  items;
  levelEndX = 6000;

  constructor(enemies, items = []) {
    this.enemies = enemies;
    this.items = items;
  }
}
