class World {
  character = new Character();
  enemies = [new Chicken(), new Chicken(), new Chicken()];
  clouds = [new Clouds()];
  background = [];
  backgroundTileIndices = new Set();
  canvas;
  ctx;
  keyboard;
  camera_x = 0;
  constructor(canvas, keyboard) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.keyboard = keyboard;
    this.updateBackground();
    this.draw();
    this.setWorld();
  }

  updateBackground() {
    const tileWidth = 720;
    const firstTile = Math.floor(-this.camera_x / tileWidth);
    const lastTile = Math.floor((-this.camera_x + this.canvas.width) / tileWidth);

    for (let tileIndex = firstTile; tileIndex <= lastTile; tileIndex++) {
      if (this.backgroundTileIndices.has(tileIndex)) continue;

      const imageSet = Math.abs(tileIndex % 2) + 1;
      const x = tileIndex * tileWidth;
      this.background.push(
        new Background("assets/images/5_background/layers/air.png", x),
        new Background(`assets/images/5_background/layers/3_third_layer/${imageSet}.png`, x),
        new Background(`assets/images/5_background/layers/2_second_layer/${imageSet}.png`, x),
        new Background(`assets/images/5_background/layers/1_first_layer/${imageSet}.png`, x),
      );
      this.backgroundTileIndices.add(tileIndex);
    }
  }

  setWorld() {
    this.character.world = this;
  }

  draw() {
    this.updateBackground();
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.translate(this.camera_x, 0);

    this.addObjectsToMap(this.background);
    this.addToMap(this.character);
    this.addObjectsToMap(this.enemies);
    this.addObjectsToMap(this.clouds);

    this.ctx.translate(-this.camera_x, 0);

    requestAnimationFrame(() => this.draw());
  }

  addObjectsToMap(objects) {
    objects.forEach((object) => {
      this.addToMap(object);
    });
  }

  addToMap(movableObject) {
    if (movableObject.oppositeDirection) {
      this.ctx.save();
      this.ctx.translate(movableObject.width, 0);
      this.ctx.scale(-1, 1);
      movableObject.x = movableObject.x * -1;
    }
    this.ctx.drawImage(movableObject.img, movableObject.x, movableObject.y, movableObject.width, movableObject.height);
    if (movableObject.oppositeDirection) {
      movableObject.x = movableObject.x * -1;
      this.ctx.restore();
    }
  }
}
