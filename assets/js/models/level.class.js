export class Level {
  enemies;
  clouds;
  background;
  items;
  levelEndX = 3000;

  constructor(enemies, clouds, background, items = []) {
    this.enemies = enemies;
    this.clouds = clouds;
    this.background = background;
    this.items = items;
  }
}
