import { gameLoop } from "./game-loop.class.js";
import { StatusBar } from "./status-bar.class.js";
import { Enemy } from "./enemies.class.js";
import { FinalBoss } from "./final-boss.class.js";
import { playSfx } from "../sfx.js";
import { isTouchingTile, TILE_HAZARD } from "./tile-collision.js";
import { getEntityBox } from "./level.class.js";

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

  update() {
    this.trackDefeatedEnemies();
    this.checkCollision();
    this.checkHazards();
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
    this.dyingBoss ??= this.level.enemies.find((enemy) => enemy instanceof FinalBoss && enemy.isDead());
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
    const boss = this.level.enemies.find((enemy) => enemy instanceof FinalBoss);
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
  }

  checkEnemyAttack(enemy) {
    if (enemy.isDead() || !enemy.isAttackFrameActive() || enemy.isAttackHitRegistered) return;
    if (!this.hitboxesOverlap(this.character.getHitbox(), enemy.getAttackHitbox())) return;
    if (!this.character.hitByEnemy(enemy)) return;
    this.statusBar.setHearts(this.character.hp);
    enemy.isAttackHitRegistered = true;
    this.triggerHitFeedback();
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
    this.level.enemies = this.level.enemies.filter((enemy) => !(enemy instanceof Enemy || enemy instanceof FinalBoss ? enemy.isDeathAnimationFinished : enemy.isDead()));
  }
}
