import { ENTITY_SCALE, EXTRA_ATTACK_COIN_COST, HIT_FEEDBACK } from "../data.js";
import { playSfx } from "../sfx.js";
import { gameLoop } from "./game-loop.class.js";
import { CharacterMovement } from "./character-movement.class.js";
import { moveX } from "./tile-collision.js";

const HAZARD_BOUNCE_SPEED = 8 * ENTITY_SCALE;
const KNOCKBACK_SPEED_Y = 5.2 * ENTITY_SCALE;
const ATTACK_BUFFER_MS = 150;

/** Character attacks, coins, damage, healing, respawn and knockback. */
export class CharacterCombat extends CharacterMovement {
  maxHp = 3;
  bufferedAttack = null;
  attackSfxLeadTicks = 0;
  extraAttackSfxLeadTicks = 0;

  /** Starts a normal attack, or buffers it during another attack. */
  attack() {
    this.updateState();
    if (this.bufferAttackWhileAttacking("attack")) return;
    if (!this.canPerformAction("attack")) return;
    this.startAttack(this.IMAGES_ATTACK, this.attackDamageFrame, this.attackReach, "attack_1");
  }

  /** Starts the special attack if enough coins are available, or buffers it during another attack. */
  extraAttack() {
    this.updateState();
    if (this.bufferAttackWhileAttacking("extraAttack")) return;
    if (!this.canPerformAction("attack")) return;
    if (this.coins < EXTRA_ATTACK_COIN_COST) {
      this.world.statusBar.showSpecialDenied();
      return;
    }
    this.spendCoins(EXTRA_ATTACK_COIN_COST);
    this.startAttack(this.IMAGES_EXTRA_ATTACK, this.extraAttackDamageFrame, this.extraAttackReach, this.extraAttackType);
  }

  /**
   * Buffers an attack pressed during a running attack.
   * @param {string} action - Method name to run later, "attack" or "extraAttack".
   * @returns {boolean} True if the attack was buffered.
   */
  bufferAttackWhileAttacking(action) {
    if (!this.isAttacking) return false;
    this.bufferedAttack = { action, until: gameLoop.now() + ATTACK_BUFFER_MS };
    return true;
  }

  /** Runs the buffered attack if it has not expired. */
  runBufferedAttack() {
    const buffered = this.bufferedAttack;
    this.bufferedAttack = null;
    if (buffered && gameLoop.now() <= buffered.until) this[buffered.action]();
  }

  /**
   * Starts an attack animation.
   * @param {string[]} images - Image cache keys of the attack.
   * @param {number} damageFrame - Frame that deals damage.
   * @param {number} reach - Attack reach in pixels.
   * @param {string} attackType - Attack type sent to enemies, e.g. "attack_1".
   */
  startAttack(images, damageFrame, reach, attackType) {
    this.isAttacking = true;
    this.attackTick = 0;
    this.activeAttackType = attackType;
    this.setActiveAttack(images, damageFrame, reach);
    this.updateState();
  }

  /**
   * Sets the animation, damage frame and reach of the active attack.
   * @param {string[]} images - Image cache keys of the attack.
   * @param {number} damageFrame - Frame that deals damage.
   * @param {number} reach - Attack reach in pixels.
   */
  setActiveAttack(images, damageFrame, reach) {
    this.activeAttackImages = images;
    this.activeAttackDamageFrame = damageFrame;
    this.activeAttackReach = reach;
  }

  /** Adds one coin. */
  collectCoin() {
    this.coins++;
  }

  /**
   * Removes coins and updates the status bar.
   * @param {number} amount - Number of coins to spend.
   */
  spendCoins(amount) {
    this.coins -= amount;
    this.world.statusBar.setCoins(this.coins);
  }

  /**
   * Applies enemy damage and knocks the character away from the enemy.
   * @param {MoveableObject} enemy - Attacking enemy or projectile.
   * @returns {boolean} True if damage was applied.
   */
  hitByEnemy(enemy) {
    if (!this.applyDamage()) return false;
    this.startKnockback(enemy);
    this.updateState();
    return true;
  }

  /**
   * Applies hazard damage and bounces the character up.
   * @returns {boolean} True if damage was applied.
   */
  hitByHazard() {
    if (!this.applyDamage()) return false;
    playSfx("spikesHit");
    this.speedY = HAZARD_BOUNCE_SPEED;
    this.updateState();
    return true;
  }

  /**
   * Removes one hit point, grants invulnerability and cancels attacks.
   * @returns {boolean} False if dead or invulnerable.
   */
  applyDamage() {
    if (this.isDead() || this.isInvulnerable()) return false;
    this.invulnerableUntil = gameLoop.now() + 1000;
    this.hit();
    this.playHurtSfx();
    this.isAttacking = false;
    this.bufferedAttack = null;
    return true;
  }

  /** Restores the character to full health. */
  restoreHealth() {
    this.hp = this.maxHp;
  }

  /**
   * Checks whether the character has full health.
   * @returns {boolean} True if at max hit points.
   */
  isHealthFull() {
    return this.hp >= this.maxHp;
  }

  /**
   * Moves the character to a spawn point, costs one hit point and grants invulnerability.
   * @param {{x: number, y: number}} spawnPoint - Respawn position.
   */
  respawn(spawnPoint) {
    this.x = spawnPoint.x;
    this.y = spawnPoint.y;
    this.speedY = 0;
    this.knockbackSpeed = 0;
    this.isAttacking = false;
    this.bufferedAttack = null;
    this.hit();
    this.playHurtSfx();
    this.invulnerableUntil = gameLoop.now() + 1000;
    this.updateState();
  }

  /**
   * Starts a knockback away from an enemy.
   * @param {MoveableObject} enemy - Source of the hit.
   */
  startKnockback(enemy) {
    this.knockbackDirection = enemy.x + enemy.width / 2 < this.x + this.width / 2 ? 1 : -1;
    this.knockbackSpeed = HIT_FEEDBACK.playerHit.knockbackSpeed;
    this.speedY = KNOCKBACK_SPEED_Y;
  }

  /**
   * Checks whether the character is currently invulnerable.
   * @returns {boolean} True while invulnerable after a hit.
   */
  isInvulnerable() {
    return gameLoop.now() < this.invulnerableUntil;
  }

  /** Advances the attack: frame, lunge, sound and damage, and finishes it at the end. */
  playAttack() {
    const frame = Math.floor(this.attackTick / this.attackTicksPerFrame);
    if (frame >= this.activeAttackImages.length) {
      this.finishAttack();
      return;
    }
    this.img = this.imageCache[this.activeAttackImages[frame]];
    this.updateAttackLunge();
    if (this.attackTick === this.getAttackSfxTick()) this.playActiveAttackSfx();
    if (this.attackTick === this.getAttackDamageTick()) this.damageEnemiesInReach();
    this.attackTick++;
  }

  /**
   * Gets the tick at which the attack sound plays, slightly before the damage.
   * @returns {number} Attack tick.
   */
  getAttackSfxTick() {
    const leadTicks = this.isExtraAttackActive() ? this.extraAttackSfxLeadTicks : this.attackSfxLeadTicks;
    return Math.max(0, this.getAttackDamageTick() - leadTicks);
  }

  /**
   * Checks whether the special attack is active.
   * @returns {boolean} True during the special attack.
   */
  isExtraAttackActive() {
    return this.activeAttackImages === this.IMAGES_EXTRA_ATTACK;
  }

  /** Plays the sound of the active attack. */
  playActiveAttackSfx() {
    if (this.isExtraAttackActive()) this.playExtraAttackSfx();
    else this.playAttackSfx();
  }

  /**
   * Gets the tick at which the active attack deals damage.
   * @returns {number} Attack tick.
   */
  getAttackDamageTick() {
    return Math.ceil(this.activeAttackDamageFrame * this.attackTicksPerFrame);
  }

  /** Moves the character forward in steps until the damage tick. */
  updateAttackLunge() {
    const damageTick = this.getAttackDamageTick();
    if (this.attackTick >= damageTick) return;
    const direction = this.isOppositeDirection ? -1 : 1;
    moveX(this, this.world.level, (direction * this.attackLunge) / damageTick);
  }

  /** Ends the attack, resets to the normal attack and runs a buffered attack. */
  finishAttack() {
    this.isAttacking = false;
    this.activeAttackType = "attack_1";
    this.setActiveAttack(this.IMAGES_ATTACK, this.attackDamageFrame, this.attackReach);
    this.runBufferedAttack();
  }

  /** Hits all living enemies inside the attack reach. */
  damageEnemiesInReach() {
    const box = this.getHitbox();
    this.world.level.enemies.forEach((enemy) => {
      if (enemy.isDead()) return;
      const reach = enemy.isFinalBoss ? this.getBossReach(box) : this.getReach(box);
      if (!this.world.hitboxesOverlap(reach, enemy.getHitbox())) return;
      if (enemy.hit({ character: this.characterType, attackType: this.activeAttackType })) this.handleEnemyHit(enemy);
    });
  }

  /**
   * Plays hit feedback on a hit enemy and knocks it back unless it is the boss.
   * @param {Enemy} enemy - Enemy that was hit.
   */
  handleEnemyHit(enemy) {
    const type = this.getHitFeedbackType(enemy);
    const direction = this.isOppositeDirection ? -1 : 1;
    enemy.startHitJitter();
    playSfx("impactHit");
    if (!enemy.isFinalBoss) enemy.startKnockback(direction, HIT_FEEDBACK[type].knockbackSpeed);
    this.world.triggerHitFeedback(type, direction);
  }

  /**
   * Picks the hit feedback type for an enemy hit.
   * @param {Enemy} enemy - Enemy that was hit.
   * @returns {string} "bossKill", "kill", "special" or "hit".
   */
  getHitFeedbackType(enemy) {
    if (enemy.isFinalBoss && enemy.isDead()) return "bossKill";
    if (enemy.isDead()) return "kill";
    return this.isExtraAttackActive() ? "special" : "hit";
  }

  /**
   * Gets the attack area in front of the character.
   * @param {{x: number, y: number, width: number, height: number}} box - Character hitbox.
   * @returns {{x: number, y: number, width: number, height: number}} Attack area.
   */
  getReach(box) {
    return {
      x: this.isOppositeDirection ? box.x - this.activeAttackReach : box.x + box.width,
      y: box.y,
      width: this.activeAttackReach,
      height: box.height,
    };
  }

  /**
   * Gets a wider and taller attack area used against the boss.
   * @param {{x: number, y: number, width: number, height: number}} box - Character hitbox.
   * @returns {{x: number, y: number, width: number, height: number}} Attack area.
   */
  getBossReach(box) {
    const width = Math.max(120, this.activeAttackReach);
    return {
      x: this.isOppositeDirection ? box.x - width : box.x + box.width,
      y: box.y - 140,
      width,
      height: box.height + 140,
    };
  }
}
