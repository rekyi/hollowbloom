class World {
  character = new Character();
  level = level1;
  canvas;
  ctx;
  keyboard;
  camera_x = 0;
  statusBar = new StatusBar();
  throwableObject = [];

  constructor(canvas, keyboard) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.keyboard = keyboard;
    this.draw();
    this.setWorld();
    this.run();
  }

  setWorld() {
    this.character.world = this;
  }

  draw() {
    level1.updateBackground(this.camera_x, this.canvas.width);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    const cameraX = Math.round(this.camera_x);
    this.ctx.translate(cameraX, 0);
    this.addObjectsToMap(this.level.background);
    this.addObjectsToMap(this.throwableObject);
    this.addToMap(this.character);
    this.addObjectsToMap(this.level.enemies);
    this.addObjectsToMap(this.level.clouds);
    this.ctx.translate(-cameraX, 0);
    this.statusBar.draw(this.ctx);

    requestAnimationFrame(() => this.draw());
  }

  run() {
    setInterval(() => {
      this.checkCollision();
    }, 1000);
    setInterval(() => {
      this.checkThrowableCollision();
    }, 1000 / 25);
  }

  checkCollision() {
    this.level.enemies.forEach((enemy) => {
      if (!(enemy instanceof Enemy && enemy.isDead()) && this.character.isColliding(enemy)) {
        this.character.hit();
        this.statusBar.setHearts(this.character.hp);
      }
    });
  }

  checkThrowableCollision() {
    this.throwableObject = this.throwableObject.filter((throwable) => {
      const enemy = this.level.enemies.find(
        (candidate) =>
          candidate instanceof Enemy &&
          !candidate.isDead() &&
          throwable.isColliding(candidate),
      );
      if (!enemy) return true;

      enemy.hit();
      return false;
    });
    this.level.enemies = this.level.enemies.filter(
      (enemy) => !(enemy instanceof Enemy && enemy.deathAnimationFinished),
    );
  }

  throwBottle() {
    this.throwableObject.push(
      new ThrowableObject(this.character.x + 50, this.character.y + 100),
    );
  }

  addObjectsToMap(objects) {
    objects.forEach((object) => {
      this.addToMap(object);
    });
  }

  addToMap(movableObject) {
    if (movableObject.oppositeDirection) {
      this.flipImage(movableObject);
    }

    movableObject.draw(this.ctx);
    movableObject.drawFrame(this.ctx);

    if (movableObject.oppositeDirection) {
      this.flipImageBack(movableObject);
    }
  }

  flipImage(movableObject) {
    this.ctx.save();
    this.ctx.translate(movableObject.width, 0);
    this.ctx.scale(-1, 1);
    movableObject.x = movableObject.x * -1;
  }

  flipImageBack(movableObject) {
    movableObject.x = movableObject.x * -1;
    this.ctx.restore();
  }
}
