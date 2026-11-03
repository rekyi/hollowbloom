import { ENTITY_SCALE, EXTRA_ATTACK_COIN_COST, HIT_FEEDBACK } from "../data.js";
import { playSfx } from "../sfx.js";
import { gameLoop } from "./game-loop.class.js";
import { CharacterMovement } from "./character-movement.class.js";
import { moveX } from "./tile-collision.js";

const HAZARD_BOUNCE_SPEED = 8 * ENTITY_SCALE;
const KNOCKBACK_SPEED_Y = 5.2 * ENTITY_SCALE;
const ATTACK_BUFFER_MS = 150;

export class CharacterCombat extends CharacterMovement {
  bufferedAttack = null;
  attackSfxLeadTicks = 0;
  extraAttackSfxLeadTicks = 0;

  attack() {
    this.updateState();
    if (this.bufferAttackWhileAttacking("attack")) return;
    if (!this.canPerformAction("attack")) return;
    this.startAttack(this.IMAGES_ATTACK, this.attackDamageFrame, this.attackReach, "attack_1");
  }

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

  bufferAttackWhileAttacking(action) {
    if (!this.isAttacking) return false;
    this.bufferedAttack = { action, until: gameLoop.now() + ATTACK_BUFFER_MS };
    return true;
  }

  runBufferedAttack() {
    const buffered = this.bufferedAttack;
    this.bufferedAttack = null;
    if (buffered && gameLoop.now() <= buffered.until) this[buffered.action]();
  }

  startAttack(images, damageFrame, reach, attackType) {
    this.isAttacking = true;
    this.attackTick = 0;
    this.activeAttackType = attackType;
    this.setActiveAttack(images, damageFrame, reach);
    this.updateState();
  }

  setActiveAttack(images, damageFrame, reach) {
    this.activeAttackImages = images;
    this.activeAttackDamageFrame = damageFrame;
    this.activeAttackReach = reach;
  }

  collectCoin() {
    this.coins++;
  }

  spendCoins(amount) {
    this.coins -= amount;
    this.world.statusBar.setCoins(this.coins);
  }

  hitByEnemy(enemy) {
    if (!this.applyDamage()) return false;
    this.startKnockback(enemy);
    this.updateState();
    return true;
  }

  hitByHazard() {
    if (!this.applyDamage()) return false;
    playSfx("spikesHit");
    this.speedY = HAZARD_BOUNCE_SPEED;
    this.updateState();
    return true;
  }

  applyDamage() {
    if (this.isDead() || this.isInvulnerable()) return false;
    this.invulnerableUntil = gameLoop.now() + 1000;
    this.hit();
    this.playHurtSfx();
    this.isAttacking = false;
    this.bufferedAttack = null;
    return true;
  }

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

  startKnockback(enemy) {
    this.knockbackDirection = enemy.x + enemy.width / 2 < this.x + this.width / 2 ? 1 : -1;
    this.knockbackSpeed = HIT_FEEDBACK.playerHit.knockbackSpeed;
    this.speedY = KNOCKBACK_SPEED_Y;
  }

  isInvulnerable() {
    return gameLoop.now() < this.invulnerableUntil;
  }

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

  getAttackSfxTick() {
    const leadTicks = this.isExtraAttackActive() ? this.extraAttackSfxLeadTicks : this.attackSfxLeadTicks;
    return Math.max(0, this.getAttackDamageTick() - leadTicks);
  }

  isExtraAttackActive() {
    return this.activeAttackImages === this.IMAGES_EXTRA_ATTACK;
  }

  playActiveAttackSfx() {
    if (this.isExtraAttackActive()) this.playExtraAttackSfx();
    else this.playAttackSfx();
  }

  getAttackDamageTick() {
    return Math.ceil(this.activeAttackDamageFrame * this.attackTicksPerFrame);
  }

  updateAttackLunge() {
    const damageTick = this.getAttackDamageTick();
    if (this.attackTick >= damageTick) return;
    const direction = this.isOppositeDirection ? -1 : 1;
    moveX(this, this.world.level, (direction * this.attackLunge) / damageTick);
  }

  finishAttack() {
    this.isAttacking = false;
    this.activeAttackType = "attack_1";
    this.setActiveAttack(this.IMAGES_ATTACK, this.attackDamageFrame, this.attackReach);
    this.runBufferedAttack();
  }

  damageEnemiesInReach() {
    const box = this.getHitbox();
    this.world.level.enemies.forEach((enemy) => {
      if (enemy.isDead()) return;
      const reach = enemy.isFinalBoss ? this.getBossReach(box) : this.getReach(box);
      if (!this.world.hitboxesOverlap(reach, enemy.getHitbox())) return;
      if (enemy.hit({ character: this.characterType, attackType: this.activeAttackType })) this.handleEnemyHit(enemy);
    });
  }

  handleEnemyHit(enemy) {
    const type = this.getHitFeedbackType(enemy);
    const direction = this.isOppositeDirection ? -1 : 1;
    enemy.startHitJitter();
    playSfx("impactHit");
    if (!enemy.isFinalBoss) enemy.startKnockback(direction, HIT_FEEDBACK[type].knockbackSpeed);
    this.world.triggerHitFeedback(type, direction);
  }

  getHitFeedbackType(enemy) {
    if (enemy.isFinalBoss && enemy.isDead()) return "bossKill";
    if (enemy.isDead()) return "kill";
    return this.isExtraAttackActive() ? "special" : "hit";
  }

  getReach(box) {
    return {
      x: this.isOppositeDirection ? box.x - this.activeAttackReach : box.x + box.width,
      y: box.y,
      width: this.activeAttackReach,
      height: box.height,
    };
  }

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
