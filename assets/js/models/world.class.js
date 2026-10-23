class World {
  character = new Character();
  level = level1;
  canvas;
  ctx;
  keyboard;
  camera_x = 0;
  statusBar = new StatusBar();

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
    this.level.enemies.forEach((enemy) => {
      if (enemy instanceof Enemy || enemy instanceof FinalBoss) enemy.target = this.character;
    });
  }

  draw() {
    level1.updateBackground(this.camera_x, this.canvas.width);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    const cameraX = Math.round(this.camera_x);
    this.ctx.translate(cameraX, 0);
    this.addObjectsToMap(this.level.background);
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
    }, 1000 / 60);
    setInterval(() => {
      this.removeDeadEnemies();
    }, 1000 / 25);
  }

  checkCollision() {
    this.level.enemies.forEach((enemy) => {
      const characterHitbox = this.character.getHitbox();
      const enemyHitbox = enemy instanceof FinalBoss && enemy.isAttacking ? enemy.getAttackHitbox() : enemy.getHitbox();
      if (enemy.isDead() || !this.hitboxesOverlap(characterHitbox, enemyHitbox)) return;
      const isEnemyAttack = enemy.isAttacking && !enemy.attackHitRegistered;
      if (this.character.hitByEnemy(enemy)) {
        this.statusBar.setHearts(this.character.hp);
        if (isEnemyAttack) enemy.attackHitRegistered = true;
      }
    });
  }

  hitboxesOverlap(a, b) {
    return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
  }

  removeDeadEnemies() {
    this.level.enemies = this.level.enemies.filter(
      (enemy) => !(enemy instanceof Enemy ? enemy.deathAnimationFinished : enemy.isDead()),
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
