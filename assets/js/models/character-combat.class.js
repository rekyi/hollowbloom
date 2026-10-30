import { ENTITY_SCALE, EXTRA_ATTACK_COIN_THRESHOLD } from "../data.js";
import { gameLoop } from "./game-loop.class.js";
import { FinalBoss } from "./final-boss.class.js";
import { CharacterMovement } from "./character-movement.class.js";

const HAZARD_BOUNCE_SPEED = 8 * ENTITY_SCALE;
const KNOCKBACK_SPEED_Y = 5.2 * ENTITY_SCALE;

export class CharacterCombat extends CharacterMovement {
  attack() {
    this.updateState();
    if (!this.canPerformAction("attack")) return;
    this.playAttackStartSfx();
    this.startAttack(this.IMAGES_ATTACK, this.attackDamageFrame, this.attackReach, "attack_1");
  }

  extraAttack() {
    this.updateState();
    if (!this.canPerformAction("attack") || this.coins < EXTRA_ATTACK_COIN_THRESHOLD) return;
    this.startAttack(this.IMAGES_EXTRA_ATTACK, this.extraAttackDamageFrame, this.extraAttackReach, this.extraAttackType);
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

  hitByEnemy(enemy) {
    if (!this.applyDamage()) return false;
    this.startKnockback(enemy);
    this.updateState();
    return true;
  }

  hitByHazard() {
    if (!this.applyDamage()) return false;
    this.speedY = HAZARD_BOUNCE_SPEED;
    this.updateState();
    return true;
  }

  applyDamage() {
    if (this.isDead() || this.isInvulnerable()) return false;
    this.invulnerableUntil = gameLoop.now() + 1000;
    this.hit();
    this.isAttacking = false;
    return true;
  }

  respawn(spawnPoint) {
    this.x = spawnPoint.x;
    this.y = spawnPoint.y;
    this.speedY = 0;
    this.knockbackFrames = 0;
    this.isAttacking = false;
    this.hit();
    this.invulnerableUntil = gameLoop.now() + 1000;
    this.updateState();
  }

  startKnockback(enemy) {
    this.knockbackDirection = enemy.x + enemy.width / 2 < this.x + this.width / 2 ? 1 : -1;
    this.knockbackFrames = 10;
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
    if (this.attackTick === this.activeAttackDamageFrame * this.attackTicksPerFrame) {
      if (this.activeAttackImages === this.IMAGES_EXTRA_ATTACK) this.playExtraAttackSfx();
      this.damageEnemiesInReach();
    }
    this.attackTick++;
  }

  finishAttack() {
    this.isAttacking = false;
    this.activeAttackType = "attack_1";
    this.setActiveAttack(this.IMAGES_ATTACK, this.attackDamageFrame, this.attackReach);
  }

  damageEnemiesInReach() {
    const box = this.getHitbox();
    this.world.level.enemies.forEach((enemy) => {
      if (enemy.isDead()) return;
      const reach = enemy instanceof FinalBoss ? this.getBossReach(box) : this.getReach(box);
      if (!this.world.hitboxesOverlap(reach, enemy.getHitbox())) return;
      if (enemy.hit({ character: this.characterType, attackType: this.activeAttackType })) this.world.triggerHitFeedback();
    });
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
