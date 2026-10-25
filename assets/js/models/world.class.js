class World {
  character;
  level;
  gameplayMusic;
  canvas;
  ctx;
  keyboard;
  camera_x = 0;
  statusBar = new StatusBar();
  shakeStartedAt = Number.NEGATIVE_INFINITY;
  shakeDurationMs = 180;
  shakeMagnitude = 7;
  timerStartMs = null;
  timerStopMs = null;
  gameOverDelayStartedAt = null;
  gameOverDelayMs = 1000;
  isGameOver = false;
  onGameOver;

  constructor(canvas, keyboard, onGameOver, CharacterClass = FemaleCharacter) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.keyboard = keyboard;
    this.character = new CharacterClass();
    this.level = createLevel1();
    this.gameplayMusic = new Audio("assets/audio/gameplay_bg.mp3");
    this.gameplayMusic.loop = true;
    this.startGameplayMusic();
    this.onGameOver = onGameOver;
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
    this.level.updateBackground(cameraX + shakeX + backgroundMargin, this.canvas.width + backgroundMargin * 2);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.save();
    this.ctx.translate(shakeX, shakeY);
    this.ctx.translate(cameraX, 0);
    this.addObjectsToMap(this.level.background);
    this.addObjectsToMap(this.level.items.filter((item) => !item.collected));
    this.addToMap(this.character);
    this.addObjectsToMap(this.level.enemies);
    this.addObjectsToMap(this.level.clouds);
    this.ctx.restore();
    this.statusBar.draw(this.ctx);
    this.drawTimer();
  }

  run() {
    gameLoop.runEvery(1000 / 25, () => this.removeDeadEnemies());
    gameLoop.start(
      (dt) => this.update(dt),
      () => this.draw(),
    );
  }

  update() {
    this.checkCollision();
    this.checkItemCollection();
    this.checkTimerStop();
    this.checkGameOver();
  }

  startGameplayMusic() {
    this.gameplayMusic.play();
  }

  pauseGameplayMusic() {
    this.gameplayMusic.pause();
  }

  resumeGameplayMusic() {
    const boss = this.level.enemies.find((enemy) => enemy instanceof FinalBoss);
    if (this.character.isDead() || boss?.isDead()) return;
    this.startGameplayMusic();
  }

  stopGameplayMusic() {
    this.gameplayMusic.pause();
    this.gameplayMusic.currentTime = 0;
  }

  checkItemCollection() {
    if (this.character.isDead()) return;
    const characterHitbox = this.character.getHitbox();
    this.level.items.forEach((item) => {
      if (item.collected || !this.hitboxesOverlap(characterHitbox, item.getHitbox())) return;
      item.collected = true;
      this.character.collectCoin();
      this.statusBar.setCoins(this.character.coins);
    });
  }

  checkGameOver() {
    if (this.isGameOver || !this.character.isDead()) return;
    this.stopGameplayMusic();
    this.timerStopMs ??= gameLoop.now();
    if (!this.character.deathStarted || this.character.currentImage < this.character.IMAGES_DEAD.length * 4) return;
    this.gameOverDelayStartedAt ??= gameLoop.now();
    if (gameLoop.now() - this.gameOverDelayStartedAt < this.gameOverDelayMs) return;
    this.isGameOver = true;
    gameLoop.stop();
    this.onGameOver();
  }

  startTimer() {
    if (this.timerStartMs === null) this.timerStartMs = gameLoop.now();
  }

  checkTimerStop() {
    const boss = this.level.enemies.find((enemy) => enemy instanceof FinalBoss);
    if (!boss || !boss.isDead()) return;
    this.stopGameplayMusic();
    if (this.timerStartMs !== null && this.timerStopMs === null) this.timerStopMs = gameLoop.now();
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
