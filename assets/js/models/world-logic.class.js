import { gameLoop } from "./game-loop.class.js";
import { StatusBar } from "./status-bar.class.js";
import { Enemy } from "./enemies.class.js";
import { playSfx } from "../sfx.js";
import { isTouchingTile, TILE_HAZARD, TILE_SOLID } from "./tile-collision.js";
import { getEntityBox, getPlacementOnEntity } from "./level.class.js";

export class WorldLogic {
  character;
  level;
  gameplayMusic;
  canvasRef;
  ctx;
  keyboard;
  cameraX = 0;
  cameraY = 0;
  spawnPoint;
  activeCheckpoint = null;
  isCollisionOverlayVisible = false;
  statusBar = new StatusBar();
  shakeStartedAt = Number.NEGATIVE_INFINITY;
  shakeDurationMs = 180;
  shakeMagnitude = 7;
  timerStartMs = null;
  timerStopMs = null;
  defeatedEnemies = 0;
  countedDefeatedEnemies = new Set();
  gameOverDelayStartedAt = null;
  gameOverDelayMs = 1000;
  isGameOver = false;
  isVictory = false;
  hasKey = false;
  levelIndex = 0;
  isLevelLoading = false;
  onGameOver;
  onVictory;
  bossEffectMargin = 200;

  update(dt) {
    this.trackDefeatedEnemies();
    this.updateBossEffects(dt);
    this.checkCollision();
    this.checkHazards();
    this.checkCheckpoints();
    this.checkFall();
    this.checkItemCollection();
    this.checkKeyCollection();
    this.checkExit();
    this.checkTimerStop();
    this.checkVictory();
    this.checkGameOver();
  }

  checkHazards() {
    if (this.character.isDead() || !isTouchingTile(this.character, this.level, TILE_HAZARD)) return;
    if (!this.character.hitByHazard()) return;
    this.statusBar.setHearts(this.character.hp);
    this.triggerHitFeedback();
  }

  checkCheckpoints() {
    if (this.character.isDead()) return;
    const characterHitbox = this.character.getHitbox();
    const touchedCheckpoint = this.level.getEntities("Checkpoint").find((checkpoint) => checkpoint !== this.activeCheckpoint && this.hitboxesOverlap(characterHitbox, getEntityBox(checkpoint)));
    if (touchedCheckpoint) this.activateCheckpoint(touchedCheckpoint);
  }

  activateCheckpoint(checkpoint) {
    this.activeCheckpoint = checkpoint;
    this.spawnPoint = getPlacementOnEntity(this.character, checkpoint);
  }

  checkFall() {
    if (this.character.isDead() || this.character.y <= this.level.height) return;
    this.character.respawn(this.spawnPoint);
    this.statusBar.setHearts(this.character.hp);
    this.updateCamera(true);
    this.triggerHitFeedback();
  }

  checkItemCollection() {
    if (this.character.isDead()) return;
    const characterHitbox = this.character.getHitbox();
    this.level.items.forEach((item) => {
      if (item.isCollected || !this.hitboxesOverlap(characterHitbox, item.getHitbox())) return;
      item.isCollected = true;
      playSfx("coinCollect");
      this.character.collectCoin();
      this.statusBar.setCoins(this.character.coins);
    });
  }

  checkKeyCollection() {
    if (this.character.isDead()) return;
    const characterHitbox = this.character.getHitbox();
    const touchedKey = this.level.keys.find((key) => !key.isCollected && this.hitboxesOverlap(characterHitbox, key.getHitbox()));
    if (!touchedKey) return;
    touchedKey.isCollected = true;
    this.hasKey = true;
  }

  isExitOpen() {
    return this.hasKey || this.level.keys.length === 0;
  }

  checkExit() {
    if (this.isLevelLoading || this.isVictory || this.character.isDead() || !this.isExitOpen()) return;
    const characterHitbox = this.character.getHitbox();
    const isAtExit = this.level.getEntities("Exit").some((exit) => this.hitboxesOverlap(characterHitbox, getEntityBox(exit)));
    if (isAtExit) this.loadNextLevel();
  }

  checkGameOver() {
    if (this.isGameOver || this.isVictory || !this.character.isDead()) return;
    this.stopGameplayMusic();
    this.timerStopMs ??= gameLoop.now();
    if (!this.isDeathAnimationDone()) return;
    this.gameOverDelayStartedAt ??= gameLoop.now();
    if (gameLoop.now() - this.gameOverDelayStartedAt < this.gameOverDelayMs) return;
    this.finishGame();
  }

  isDeathAnimationDone() {
    return this.character.isDeathStarted && this.character.currentImage >= this.character.IMAGES_DEAD.length * 4;
  }

  finishGame() {
    this.isGameOver = true;
    gameLoop.stop();
    this.onGameOver();
  }

  checkVictory() {
    this.dyingBoss ??= this.level.enemies.find((enemy) => enemy.isFinalBoss && enemy.isDead());
    if (this.isVictory || !this.dyingBoss?.isDeathAnimationFinished) return;
    this.triggerVictory();
  }

  triggerVictory() {
    this.isVictory = true;
    this.stopGameplayMusic();
    this.timerStopMs ??= gameLoop.now();
    gameLoop.stop();
    window.setTimeout(this.onVictory, 1000);
  }

  startTimer() {
    if (this.timerStartMs === null) this.timerStartMs = gameLoop.now();
  }

  checkTimerStop() {
    const boss = this.level.enemies.find((enemy) => enemy.isFinalBoss);
    if (!boss || !boss.isDead()) return;
    this.stopGameplayMusic();
    if (this.timerStartMs !== null && this.timerStopMs === null) this.timerStopMs = gameLoop.now();
  }

  trackDefeatedEnemies() {
    this.level.enemies.forEach((enemy) => {
      if (!enemy.isDead() || this.countedDefeatedEnemies.has(enemy)) return;
      this.countedDefeatedEnemies.add(enemy);
      this.defeatedEnemies++;
    });
  }

  checkCollision() {
    this.level.enemies.forEach((enemy) => this.checkEnemyAttack(enemy));
    this.level.bossEffects.forEach((effect) => this.checkBossEffectHit(effect));
  }

  checkEnemyAttack(enemy) {
    if (enemy.isDead() || !enemy.isAttackFrameActive() || enemy.isAttackHitRegistered) return;
    if (!this.hitboxesOverlap(this.character.getHitbox(), enemy.getAttackHitbox())) return;
    this.handleAttackHit(enemy);
  }

  checkBossEffectHit(effect) {
    if (!effect.isDamageActive()) return;
    if (!this.hitboxesOverlap(this.character.getHitbox(), effect.getHitbox())) return;
    this.handleAttackHit(effect);
  }

  handleAttackHit(source) {
    if (!this.character.hitByEnemy(source)) return;
    this.statusBar.setHearts(this.character.hp);
    source.isAttackHitRegistered = true;
    this.triggerHitFeedback();
  }

  updateBossEffects(dt) {
    this.level.bossEffects.forEach((effect) => effect.update(dt));
    this.level.bossEffects = this.level.bossEffects.filter((effect) => this.isBossEffectActive(effect));
  }

  isBossEffectActive(effect) {
    if (effect.isFinished || this.isOutsideLevel(effect)) return false;
    return !effect.isDestroyedOnGround || !isTouchingTile(effect, this.level, TILE_SOLID);
  }

  isOutsideLevel(object) {
    const margin = this.bossEffectMargin;
    return object.x + object.width < -margin || object.x > this.level.width + margin || object.y + object.height < -margin || object.y > this.level.height + margin;
  }

  clearBossEffects() {
    this.level.bossEffects = [];
  }

  handleBossDebugKey(code) {
    this.level.enemies.find((enemy) => enemy.isFinalBoss)?.handleDebugKey?.(code);
  }

  triggerHitFeedback() {
    gameLoop.hitStop(60);
    this.shakeStartedAt = gameLoop.now();
  }

  hitboxesOverlap(a, b) {
    return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
  }

  removeDeadEnemies() {
    this.trackDefeatedEnemies();
    this.level.enemies = this.level.enemies.filter((enemy) => !this.isRemovable(enemy));
  }

  isRemovable(enemy) {
    if (enemy.isKeptAfterDeath) return false;
    if (enemy instanceof Enemy || enemy.isFinalBoss) return enemy.isDeathAnimationFinished;
    return enemy.isDead();
  }
}
