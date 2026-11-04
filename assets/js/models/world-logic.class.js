import { gameLoop } from "./game-loop.class.js";
import { StatusBar } from "./status-bar.class.js";
import { BossHealthBar } from "./boss-health-bar.class.js";
import { Enemy } from "./enemies.class.js";
import { playSfx } from "../sfx.js";
import { EXTRA_ATTACK_COIN_COST, HIT_FEEDBACK } from "../data.js";
import { isDamageFlashEnabled, isScreenShakeEnabled } from "../effect-settings.js";
import { getTouchedTileTop, isTouchingTile, TILE_HAZARD, TILE_SOLID } from "./tile-collision.js";
import { getPlacementOnEntity } from "./level.class.js";

const COIN_SFX_VOLUME = 1;

/** Game rules of the world: collisions, pickups, checkpoints, timer, hit feedback and game end. */
export class WorldLogic {
  character;
  level;
  canvasRef;
  ctx;
  keyboard;
  cameraX = 0;
  cameraY = 0;
  cameraLookAhead = 0;
  spawnPoint;
  activeCheckpoint = null;
  statusBar = new StatusBar();
  bossHealthBar = new BossHealthBar();
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

  /**
   * Runs all game checks for one frame.
   * @param {number} dt - Time since the last frame in milliseconds.
   */
  update(dt) {
    this.trackDefeatedEnemies();
    this.updateBossEffects(dt);
    this.checkCollision();
    this.checkHazards();
    this.checkCheckpoints();
    this.checkHealingPlants();
    this.checkFall();
    this.checkItemCollection();
    this.checkKeyCollection();
    this.checkExit();
    this.checkTimerStop();
    this.checkVictory();
    this.checkGameOver();
    this.bossHealthBar.update(this.level.enemies.find((enemy) => enemy.isFinalBoss), dt);
  }

  /** Damages the character when it touches a hazard tile. */
  checkHazards() {
    if (this.character.isDead() || !isTouchingTile(this.character, this.level, TILE_HAZARD)) return;
    if (!this.character.hitByHazard()) return;
    this.statusBar.setHearts(this.character.hp);
    this.triggerHitFeedback("playerHit");
  }

  /** Activates a checkpoint the character touches. */
  checkCheckpoints() {
    if (this.character.isDead()) return;
    const characterHitbox = this.character.getHitbox();
    const touchedCheckpoint = this.level.checkpoints.find((checkpoint) => checkpoint !== this.activeCheckpoint && this.hitboxesOverlap(characterHitbox, checkpoint));
    if (touchedCheckpoint) this.activateCheckpoint(touchedCheckpoint);
  }

  /**
   * Makes a checkpoint the active one and sets the respawn point to it.
   * @param {Checkpoint} checkpoint - Checkpoint to activate.
   */
  activateCheckpoint(checkpoint) {
    this.activeCheckpoint?.deactivate();
    this.activeCheckpoint = checkpoint;
    checkpoint.activate();
    this.spawnPoint = getPlacementOnEntity(this.character, checkpoint.entity);
    playSfx("checkpointReached");
  }

  /** Collects a healing plant the character touches while injured. */
  checkHealingPlants() {
    if (this.character.isDead() || this.character.isHealthFull()) return;
    const characterHitbox = this.character.getHitbox();
    const touchedPlant = this.level.healingPlants.find((plant) => !plant.isCollected && this.hitboxesOverlap(characterHitbox, plant));
    if (!touchedPlant) return;
    touchedPlant.isCollected = true;
    this.healCharacter();
    playSfx("checkpointReached");
  }

  /** Restores the character's health and updates the hearts. */
  healCharacter() {
    this.character.restoreHealth();
    this.statusBar.setHearts(this.character.hp);
  }

  /** Respawns the character at the spawn point after it fell out of the level. */
  checkFall() {
    if (this.character.isDead() || this.character.y <= this.level.height) return;
    this.character.respawn(this.spawnPoint);
    this.level.enemies.find((enemy) => enemy.isFinalBoss)?.resetAggro();
    this.statusBar.setHearts(this.character.hp);
    this.updateCamera(true);
    this.triggerHitFeedback("playerHit");
  }

  /** Collects coins the character touches. */
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

  /** Collects a key the character touches. */
  checkKeyCollection() {
    if (this.character.isDead()) return;
    const characterHitbox = this.character.getHitbox();
    const touchedKey = this.level.keys.find((key) => !key.isCollected && this.hitboxesOverlap(characterHitbox, key.getHitbox()));
    if (!touchedKey) return;
    touchedKey.isCollected = true;
    this.hasKey = true;
    playSfx(touchedKey.isBossKey ? "ancientKeyPickup" : "keyPickup");
  }

  /**
   * Checks whether the exit portals are unlocked.
   * @returns {boolean} True if the key was collected or the level has no key.
   */
  isExitOpen() {
    return this.hasKey || this.level.keys.length === 0;
  }

  /** Loads the next level when the character touches an open exit. */
  checkExit() {
    if (this.isLevelLoading || this.isVictory || this.character.isDead() || !this.isExitOpen()) return;
    const characterHitbox = this.character.getHitbox();
    const touchedExit = this.level.exits.find((exit) => this.hitboxesOverlap(characterHitbox, exit.getHitbox()));
    if (touchedExit) this.loadNextLevel(touchedExit);
  }

  /** Ends the game after the death animation and the game-over delay. */
  checkGameOver() {
    if (this.isGameOver || this.isVictory || !this.character.isDead()) return;
    this.stopGameplayMusic();
    this.timerStopMs ??= gameLoop.now();
    if (!this.isDeathAnimationDone()) return;
    this.gameOverDelayStartedAt ??= gameLoop.now();
    if (gameLoop.now() - this.gameOverDelayStartedAt < this.gameOverDelayMs) return;
    this.finishGame();
  }

  /**
   * Checks whether the character's death animation has finished.
   * @returns {boolean} True if the animation is done.
   */
  isDeathAnimationDone() {
    return this.character.isDeathStarted && this.character.currentImage >= this.character.IMAGES_DEAD.length * 4;
  }

  /** Stops the game loop and calls the game-over callback. */
  finishGame() {
    this.isGameOver = true;
    gameLoop.stop();
    this.onGameOver();
  }

  /** Triggers the victory once the final boss' death animation has finished. */
  checkVictory() {
    this.dyingBoss ??= this.level.enemies.find((enemy) => enemy.isFinalBoss && enemy.isDead());
    if (this.isVictory || !this.dyingBoss?.isDeathAnimationFinished) return;
    this.triggerVictory();
  }

  /** Marks the game as won, stops music, timer and loop, and calls the victory callback after a delay. */
  triggerVictory() {
    this.isVictory = true;
    this.stopGameplayMusic();
    this.timerStopMs ??= gameLoop.now();
    gameLoop.stop();
    window.setTimeout(this.onVictory, 1000);
  }

  /** Starts the run timer if it is not running yet. */
  startTimer() {
    if (this.timerStartMs === null) this.timerStartMs = gameLoop.now();
  }

  /**
   * Returns the elapsed run time including time carried over from earlier levels.
   * @returns {number} Elapsed time in milliseconds.
   */
  getElapsedMs() {
    if (this.timerStartMs === null) return this.timerCarryMs;
    return this.timerCarryMs + (this.timerStopMs ?? gameLoop.now()) - this.timerStartMs;
  }

  /** Stops the timer and the music when the final boss is dead. */
  checkTimerStop() {
    const boss = this.level.enemies.find((enemy) => enemy.isFinalBoss);
    if (!boss || !boss.isDead()) return;
    this.stopGameplayMusic();
    if (this.timerStartMs !== null && this.timerStopMs === null) this.timerStopMs = gameLoop.now();
  }

  /** Counts each dead enemy once. */
  trackDefeatedEnemies() {
    this.level.enemies.forEach((enemy) => {
      if (!enemy.isDead() || this.countedDefeatedEnemies.has(enemy)) return;
      this.countedDefeatedEnemies.add(enemy);
      this.defeatedEnemies++;
    });
  }

  /** Checks enemy attacks and boss effects against the character. */
  checkCollision() {
    this.level.enemies.forEach((enemy) => this.checkEnemyAttack(enemy));
    this.level.bossEffects.forEach((effect) => this.checkBossEffectHit(effect));
  }

  /**
   * Applies an enemy's attack if its attack hitbox overlaps the character.
   * @param {Enemy} enemy - Attacking enemy.
   */
  checkEnemyAttack(enemy) {
    if (enemy.isDead() || !enemy.isAttackFrameActive() || enemy.isAttackHitRegistered) return;
    if (!this.hitboxesOverlap(this.character.getHitbox(), enemy.getAttackHitbox())) return;
    this.handleAttackHit(enemy);
  }

  /**
   * Applies a boss effect's damage if it hits the character.
   * @param {BossEffect} effect - Boss effect to check.
   */
  checkBossEffectHit(effect) {
    if (!effect.isDamageActive()) return;
    if (!this.isBossEffectHitting(effect, this.character.getHitbox())) return;
    this.handleAttackHit(effect);
  }

  /**
   * Checks whether a boss effect overlaps a hitbox, using the ring test for ring effects.
   * @param {BossEffect} effect - Boss effect.
   * @param {{x: number, y: number, width: number, height: number}} hitbox - Hitbox to test.
   * @returns {boolean} True if the effect touches the hitbox.
   */
  isBossEffectHitting(effect, hitbox) {
    if (effect.ring) return effect.isRingTouching(hitbox);
    return this.hitboxesOverlap(hitbox, effect.getHitbox());
  }

  /**
   * Damages the character and triggers hit feedback.
   * @param {Enemy|BossEffect} source - Attack source that hit the character.
   */
  handleAttackHit(source) {
    if (!this.character.hitByEnemy(source)) return;
    this.statusBar.setHearts(this.character.hp);
    source.isAttackHitRegistered = true;
    this.triggerHitFeedback("playerHit", this.character.knockbackDirection);
  }

  /**
   * Updates boss effects, removes inactive ones and handles those that hit the ground.
   * @param {number} dt - Time since the last frame in milliseconds.
   */
  updateBossEffects(dt) {
    const effects = this.level.bossEffects;
    effects.forEach((effect) => effect.update(dt));
    this.level.bossEffects = effects.filter((effect) => this.isBossEffectActive(effect));
    effects.filter((effect) => this.isBossEffectGrounded(effect)).forEach((effect) => this.handleBossEffectGroundHit(effect));
  }

  /**
   * Checks whether a boss effect is still in play.
   * @param {BossEffect} effect - Boss effect.
   * @returns {boolean} True if it is unfinished, inside the level and not on the ground.
   */
  isBossEffectActive(effect) {
    return !effect.isFinished && !this.isOutsideLevel(effect) && !this.isBossEffectGrounded(effect);
  }

  /**
   * Checks whether a ground-bound boss effect touches a solid tile.
   * @param {BossEffect} effect - Boss effect.
   * @returns {boolean} True if it hit the ground.
   */
  isBossEffectGrounded(effect) {
    return effect.isDestroyedOnGround && isTouchingTile(effect.groundProbe, this.level, TILE_SOLID);
  }

  /**
   * Lets a boss effect react to hitting the ground.
   * @param {BossEffect} effect - Boss effect that touched a solid tile.
   */
  handleBossEffectGroundHit(effect) {
    effect.handleGroundHit(getTouchedTileTop(effect.groundProbe, this.level, TILE_SOLID));
  }

  /**
   * Checks whether an object is outside the level, including a margin.
   * @param {{x: number, y: number, width: number, height: number}} object - Object to test.
   * @returns {boolean} True if it is outside.
   */
  isOutsideLevel(object) {
    const margin = this.bossEffectMargin;
    return object.x + object.width < -margin || object.x > this.level.width + margin || object.y + object.height < -margin || object.y > this.level.height + margin;
  }

  /** Removes all boss effects from the level. */
  clearBossEffects() {
    this.level.bossEffects = [];
  }

  /**
   * Starts hit stop, screen shake and damage flash according to the feedback type and the effect settings.
   * @param {string} type - Key in HIT_FEEDBACK.
   * @param {number} [direction=0] - Horizontal kick direction (-1, 0 or 1).
   */
  triggerHitFeedback(type, direction = 0) {
    const feedback = HIT_FEEDBACK[type];
    if (feedback.hitStopMs > 0) gameLoop.hitStop(feedback.hitStopMs);
    if (isScreenShakeEnabled()) this.startShake(feedback, direction);
    if (feedback.damageFlashMs > 0 && isDamageFlashEnabled()) this.startDamageFlash(feedback.damageFlashMs);
  }

  /**
   * Starts the red damage flash.
   * @param {number} durationMs - Flash duration in milliseconds.
   */
  startDamageFlash(durationMs) {
    this.damageFlashDurationMs = durationMs;
    this.damageFlashStartedAt = performance.now();
  }

  /**
   * Starts a screen shake.
   * @param {{shakeDurationMs: number, shakeMagnitude: number}} feedback - Shake settings.
   * @param {number} direction - Horizontal kick direction (-1, 0 or 1).
   */
  startShake(feedback, direction) {
    this.activeShake = feedback;
    this.shakeDirection = direction;
    this.shakeSeed = Math.random() * 1000;
    this.shakeStartedAt = performance.now();
  }

  /**
   * Tests two axis-aligned boxes for overlap.
   * @param {{x: number, y: number, width: number, height: number}} a - First box.
   * @param {{x: number, y: number, width: number, height: number}} b - Second box.
   * @returns {boolean} True if the boxes overlap.
   */
  hitboxesOverlap(a, b) {
    return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
  }

  /** Counts defeated enemies and removes those that may be removed. */
  removeDeadEnemies() {
    this.trackDefeatedEnemies();
    this.level.enemies = this.level.enemies.filter((enemy) => !this.isRemovable(enemy));
  }

  /**
   * Checks whether a dead enemy can be removed from the level.
   * @param {Enemy} enemy - Enemy to check.
   * @returns {boolean} True if it should be removed.
   */
  isRemovable(enemy) {
    if (enemy.isKeptAfterDeath) return false;
    if (enemy instanceof Enemy || enemy.isFinalBoss) return enemy.isDeathAnimationFinished;
    return enemy.isDead();
  }
}
