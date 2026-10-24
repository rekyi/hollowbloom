class World {
  character = new Character();
  level = level1;
  canvas;
  ctx;
  keyboard;
  camera_x = 0;
  statusBar = new StatusBar();
  droppedItems = [];
  chargeFallbackMs = 4000;
  noChargeSince = null;
  shakeStartedAt = Number.NEGATIVE_INFINITY;
  shakeDurationMs = 180;
  shakeMagnitude = 7;
  timerStartMs = null;
  timerStopMs = null;

  constructor(canvas, keyboard) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.keyboard = keyboard;
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
    const shakeElapsed = gameLoop.now() - this.shakeStartedAt;
    const isShaking = Number.isFinite(shakeElapsed) && shakeElapsed >= 0 && shakeElapsed < this.shakeDurationMs;
    const shakeIntensity = isShaking ? 1 - shakeElapsed / this.shakeDurationMs : 0;
    const shakeX = isShaking ? Math.round(Math.sin(shakeElapsed * 0.08) * this.shakeMagnitude * shakeIntensity) : 0;
    const shakeY = isShaking ? Math.round(Math.cos(shakeElapsed * 0.11) * this.shakeMagnitude * 0.5 * shakeIntensity) : 0;
    const cameraX = Math.round(this.camera_x);
    const backgroundMargin = this.shakeMagnitude + 1;
    level1.updateBackground(cameraX + shakeX + backgroundMargin, this.canvas.width + backgroundMargin * 2);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.save();
    this.ctx.translate(shakeX, shakeY);
    this.ctx.translate(cameraX, 0);
    this.addObjectsToMap(this.level.background);
    this.addToMap(this.character);
    this.addObjectsToMap(this.level.enemies);
    this.addObjectsToMap(this.droppedItems);
    this.addObjectsToMap(this.level.clouds);
    this.ctx.restore();
    this.statusBar.draw(this.ctx);
    this.drawTimer();
    if (gameLoop.isPaused) this.drawPauseOverlay();
  }

  run() {
    gameLoop.runEvery(1000 / 25, () => this.removeDeadEnemies());
    gameLoop.start(
      (dt) => this.update(dt),
      () => this.draw(),
    );
  }

  update() {
    this.checkEnemyDrops();
    this.checkCollision();
    this.collectChargeItems();
    this.checkChargeFallback();
    this.checkTimerStop();
  }

  checkChargeFallback() {
    const stuck = this.character.charges <= 0 && this.droppedItems.length === 0 && !this.character.isDead();
    if (!stuck) {
      this.noChargeSince = null;
      return;
    }
    this.noChargeSince ??= gameLoop.now();
    if (gameLoop.now() - this.noChargeSince < this.chargeFallbackMs) return;
    this.character.charges++;
    this.noChargeSince = null;
  }

  dropChargeItems(x, count) {
    for (let i = 0; i < count; i++) this.droppedItems.push(new ChargeItem(x + i * 30, 440 - 36));
  }

  collectChargeItems() {
    const box = this.character.getHitbox();
    this.droppedItems = this.droppedItems.filter((item) => {
      if (!this.hitboxesOverlap(box, { x: item.x, y: item.y, width: item.width, height: item.height })) return true;
      this.character.charges++;
      return false;
    });
  }

  checkEnemyDrops() {
    this.level.enemies.forEach((enemy) => {
      if (enemy instanceof FinalBoss) {
        if (enemy.isEnraged() && !enemy.chargeDropScheduled) {
          enemy.chargeDropScheduled = true;
          this.dropChargeItems(enemy.x + enemy.width / 2 - 30, 2);
        }
        return;
      }
      if (!enemy.isDead() || enemy.chargeDropScheduled) return;
      enemy.chargeDropScheduled = true;
      const x = enemy.x + enemy.width / 2 + 8;
      const count = Math.random() < 0.3 ? 3 : 2;
      gameLoop.runOnceAfter(1000, () => this.dropChargeItems(x, count));
    });
  }

  startTimer() {
    if (this.timerStartMs === null) this.timerStartMs = gameLoop.now();
  }

  checkTimerStop() {
    if (this.timerStartMs === null || this.timerStopMs !== null) return;
    const boss = this.level.enemies.find((enemy) => enemy instanceof FinalBoss);
    if (boss && boss.isDead()) this.timerStopMs = gameLoop.now();
  }

  drawTimer() {
    const elapsedMs = this.timerStartMs === null ? 0 : (this.timerStopMs ?? gameLoop.now()) - this.timerStartMs;
    const totalSeconds = Math.floor(elapsedMs / 1000);
    const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
    const seconds = String(totalSeconds % 60).padStart(2, "0");
    const millis = String(Math.floor(elapsedMs % 1000)).padStart(3, "0");
    const text = `${minutes}:${seconds}:${millis}`;
    this.ctx.save();
    this.ctx.fillStyle = "white";
    this.ctx.strokeStyle = "black";
    this.ctx.lineWidth = 3;
    this.ctx.font = "bold 24px monospace";
    this.ctx.textAlign = "right";
    this.ctx.textBaseline = "top";
    this.ctx.strokeText(text, this.canvas.width - 20, 16);
    this.ctx.fillText(text, this.canvas.width - 20, 16);
    this.ctx.restore();
    this.drawCharges();
  }

  drawCharges() {
    this.ctx.save();
    this.ctx.fillStyle = "white";
    this.ctx.strokeStyle = "black";
    this.ctx.lineWidth = 3;
    this.ctx.font = "bold 24px monospace";
    this.ctx.textBaseline = "top";
    const text = `x${this.character.charges} charges`;
    this.ctx.strokeText(text, 20, 56);
    this.ctx.fillText(text, 20, 56);
    this.ctx.restore();
  }

  drawPauseOverlay() {
    this.ctx.save();
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = "white";
    this.ctx.font = "bold 36px sans-serif";
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.ctx.fillText("PAUSE", this.canvas.width / 2, this.canvas.height / 2);
    this.ctx.font = "16px sans-serif";
    this.ctx.fillText("Esc zum Fortsetzen", this.canvas.width / 2, this.canvas.height / 2 + 36);
    this.ctx.restore();
  }

  checkCollision() {
    this.level.enemies.forEach((enemy) => {
      if (enemy.isDead() || !enemy.isAttackFrameActive() || enemy.attackHitRegistered) return;
      const characterHitbox = this.character.getHitbox();
      const enemyHitbox = enemy.getAttackHitbox();
      if (!this.hitboxesOverlap(characterHitbox, enemyHitbox)) return;
      if (this.character.hitByEnemy(enemy)) {
        this.statusBar.setHearts(this.character.hp);
        enemy.attackHitRegistered = true;
        this.triggerHitFeedback();
      }
    });
  }

  triggerHitFeedback() {
    gameLoop.hitStop(60);
    this.shakeStartedAt = gameLoop.now();
  }

  hitboxesOverlap(a, b) {
    return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
  }

  removeDeadEnemies() {
    this.level.enemies = this.level.enemies.filter((enemy) => !(enemy instanceof Enemy || enemy instanceof FinalBoss ? enemy.deathAnimationFinished : enemy.isDead()));
  }

  addObjectsToMap(objects) {
    objects.forEach((object) => {
      this.addToMap(object);
    });
  }

  addToMap(movableObject) {
    if (movableObject.oppositeDirection) {
      this.ctx.save();
      this.ctx.translate(movableObject.x + movableObject.width / 2, 0);
      this.ctx.scale(-1, 1);
      this.ctx.translate(-(movableObject.x + movableObject.width / 2), 0);
      movableObject.draw(this.ctx);
      this.ctx.restore();
    } else {
      movableObject.draw(this.ctx);
    }

    movableObject.drawFrame(this.ctx);
  }
}
