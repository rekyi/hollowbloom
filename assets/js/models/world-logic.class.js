import { gameLoop } from "./game-loop.class.js";
import { StatusBar } from "./status-bar.class.js";
import { Enemy } from "./enemies.class.js";
import { playSfx } from "../sfx.js";
import { EXTRA_ATTACK_COIN_COST, HIT_FEEDBACK } from "../data.js";
import { isScreenShakeEnabled } from "../screen-shake.js";
import { getTouchedTileTop, isTouchingTile, TILE_HAZARD, TILE_SOLID } from "./tile-collision.js";
import { getEntityBox, getPlacementOnEntity } from "./level.class.js";

const COIN_SFX_VOLUME = 1;

export class WorldLogic {
  character;
  level;
  gameplayMusic;
  canvasRef;
  ctx;
  keyboard;
  cameraX = 0;
  cameraY = 0;
  cameraLookAhead = 0;
  spawnPoint;
  activeCheckpoint = null;
  isCollisionOverlayVisible = false;
  statusBar = new StatusBar();
  shakeStartedAt = Number.NEGATIVE_INFINITY;
  activeShake = HIT_FEEDBACK.hit;
  shakeDirection = 0;
  shakeSeed = 0;
  damageFlashStartedAt = Number.NEGATIVE_INFINITY;
  damageFlashDurationMs = 0;
  timerStartMs = null;
  timerStopMs = null;
  timerCarryMs = 0;
  defeatedEnemies = 0;
  levelStartDefeatedEnemies = 0;
  coinsCollected = 0;
  levelStartCoinsCollected = 0;
  deaths = 0;
  restarts = 0;
  countedDefeatedEnemies = new Set();
  gameOverDelayStartedAt = null;
  gameOverDelayMs = 1000;
  isGameOver = false;
  isVictory = false;
  hasKey = false;
  levelIndex = 0;
  levelStartCoins = 0;
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
    this.triggerHitFeedback("playerHit");
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
    playSfx("checkpointReached");
  }

  checkFall() {
    if (this.character.isDead() || this.character.y <= this.level.height) return;
    this.character.respawn(this.spawnPoint);
    this.level.enemies.find((enemy) => enemy.isFinalBoss)?.resetAggro();
    this.statusBar.setHearts(this.character.hp);
    this.updateCamera(true);
    this.triggerHitFeedback("playerHit");
  }

  checkItemCollection() {
    if (this.character.isDead()) return;
    const characterHitbox = this.character.getHitbox();
    this.level.items.forEach((item) => {
      if (item.isCollected || !this.hitboxesOverlap(characterHitbox, item.getHitbox())) return;
      item.isCollected = true;
      playSfx("coinCollect", { volume: COIN_SFX_VOLUME });
      this.character.collectCoin();
      this.coinsCollected++;
      if (this.character.coins === EXTRA_ATTACK_COIN_COST) playSfx("specialAttackUnlocked");
      this.statusBar.setCoins(this.character.coins);
      this.statusBar.showCoinPickup();
    });
  }

  checkKeyCollection() {
    if (this.character.isDead()) return;
    const characterHitbox = this.character.getHitbox();
    const touchedKey = this.level.keys.find((key) => !key.isCollected && this.hitboxesOverlap(characterHitbox, key.getHitbox()));
    if (!touchedKey) return;
    touchedKey.isCollected = true;
    this.hasKey = true;
    playSfx(touchedKey.isBossKey ? "ancientKeyPickup" : "keyPickup");
  }

  isExitOpen() {
    return this.hasKey || this.level.keys.length === 0;
  }

  checkExit() {
    if (this.isLevelLoading || this.isVictory || this.character.isDead() || !this.isExitOpen()) return;
    const characterHitbox = this.character.getHitbox();
    const touchedExit = this.level.exits.find((exit) => this.hitboxesOverlap(characterHitbox, exit.getHitbox()));
    if (touchedExit) this.loadNextLevel(touchedExit);
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

  getElapsedMs() {
    if (this.timerStartMs === null) return this.timerCarryMs;
    return this.timerCarryMs + (this.timerStopMs ?? gameLoop.now()) - this.timerStartMs;
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
    if (!this.isBossEffectHitting(effect, this.character.getHitbox())) return;
    this.handleAttackHit(effect);
  }

  isBossEffectHitting(effect, hitbox) {
    if (effect.ring) return effect.isRingTouching(hitbox);
    return this.hitboxesOverlap(hitbox, effect.getHitbox());
  }

  handleAttackHit(source) {
    if (!this.character.hitByEnemy(source)) return;
    this.statusBar.setHearts(this.character.hp);
    source.isAttackHitRegistered = true;
    this.triggerHitFeedback("playerHit", this.character.knockbackDirection);
  }

  updateBossEffects(dt) {
    const effects = this.level.bossEffects;
    effects.forEach((effect) => effect.update(dt));
    this.level.bossEffects = effects.filter((effect) => this.isBossEffectActive(effect));
    effects.filter((effect) => this.isBossEffectGrounded(effect)).forEach((effect) => this.handleBossEffectGroundHit(effect));
  }

  isBossEffectActive(effect) {
    return !effect.isFinished && !this.isOutsideLevel(effect) && !this.isBossEffectGrounded(effect);
  }

  isBossEffectGrounded(effect) {
    return effect.isDestroyedOnGround && isTouchingTile(effect.groundProbe, this.level, TILE_SOLID);
  }

  handleBossEffectGroundHit(effect) {
    effect.handleGroundHit(getTouchedTileTop(effect.groundProbe, this.level, TILE_SOLID));
  }

  isOutsideLevel(object) {
    const margin = this.bossEffectMargin;
    return object.x + object.width < -margin || object.x > this.level.width + margin || object.y + object.height < -margin || object.y > this.level.height + margin;
  }

  clearBossEffects() {
    this.level.bossEffects = [];
  }

  triggerHitFeedback(type, direction = 0) {
    const feedback = HIT_FEEDBACK[type];
    if (feedback.hitStopMs > 0) gameLoop.hitStop(feedback.hitStopMs);
    if (!isScreenShakeEnabled()) return;
    this.startShake(feedback, direction);
    if (feedback.damageFlashMs > 0) this.startDamageFlash(feedback.damageFlashMs);
  }

  startDamageFlash(durationMs) {
    this.damageFlashDurationMs = durationMs;
    this.damageFlashStartedAt = performance.now();
  }

  startShake(feedback, direction) {
    this.activeShake = feedback;
    this.shakeDirection = direction;
    this.shakeSeed = Math.random() * 1000;
    this.shakeStartedAt = performance.now();
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
