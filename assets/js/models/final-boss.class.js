import { gameLoop } from "./game-loop.class.js";
import { MoveableObject } from "./movable-object.class.js";

export class FinalBoss extends MoveableObject {
  IMAGES_IDLE = [];
  IMAGES_ATTACK = [];
  IMAGES_HURT = [];
  IMAGES_DEAD = [];
  width = 350;
  height = 315;
  y = 90;
  baseY = 90;
  floatAmplitude = 15;
  floatSpeed = 0.002;
  hp = 8;
  maxHp = 8;
  offset = { top: 95, right: 105, bottom: 65, left: 95 };
  target = null;
  attackHitStartFrame = 6;
  attackHitEndFrame = 10;
  phase = "normal";
  normalAttackCooldown = 3000;
  enragedAttackCooldown = 2500;
  attackRange = 300;
  normalAttackFrameDuration = 115;
  enragedAttackFrameDuration = 95;
  attackStartedAt = Number.NEGATIVE_INFINITY;
  hurtStartedAt = Number.NEGATIVE_INFINITY;
  hurtFrameDuration = 100;
  deathStartedAt = Number.NEGATIVE_INFINITY;
  deathFrameDuration = 100;
  isDeathAnimationFinished = false;
  lastIdleFrameAt = 0;
  currentImage = 0;
  drawHitbox = true;

  constructor() {
    super();
    this.IMAGES_IDLE = this.loadSpriteSheet("assets/images/4_final_boss/demon_king/demon_idle.png", 6, 160, 144);
    this.IMAGES_ATTACK = this.loadSpriteSheet("assets/images/4_final_boss/demon_king/demon_attack.png", 11, 240, 192);
    this.IMAGES_HURT = this.loadSpriteSheet("assets/images/4_final_boss/demon_king/demon_hurt.png", 8, 192, 176);
    this.IMAGES_DEAD = this.loadSpriteSheet("assets/images/4_final_boss/demon_king/demon_death.png", 8, 48);
    this.img = this.imageCache[this.IMAGES_IDLE[0]];
    this.x = 2800;
    this.animation();
  }

  animation() {
    gameLoop.runEvery(1000 / 60, () => this.updateBoss());
    gameLoop.runEvery(1000 / 60, () => this.float());
  }

  updateBoss() {
    this.updateEnragePhase();
    if (this.isDead()) this.playDeathAnimation();
    else if (this.gettingHit()) this.playHurtAnimation();
    else if (this.isAttacking) this.playAttackAnimation();
    else this.updateIdle();
  }

  playHurtAnimation() {
    const frame = Math.min(Math.floor((gameLoop.now() - this.hurtStartedAt) / this.hurtFrameDuration), this.IMAGES_HURT.length - 1);
    this.currentImage = frame;
    this.img = this.imageCache[this.IMAGES_HURT[frame]];
  }

  playAttackAnimation() {
    const frame = Math.floor((gameLoop.now() - this.attackStartedAt) / this.getAttackFrameDuration());
    if (frame >= this.IMAGES_ATTACK.length) {
      this.endAttack();
      return;
    }
    this.currentImage = frame;
    this.img = this.imageCache[this.IMAGES_ATTACK[frame]];
  }

  endAttack() {
    this.isAttacking = false;
    this.currentImage = 0;
    this.playAnimation(this.IMAGES_IDLE);
  }

  updateIdle() {
    this.updateIdleFrame();
    this.tryStartAttack();
  }

  updateIdleFrame() {
    if (gameLoop.now() - this.lastIdleFrameAt < 200) return;
    this.currentImage = (this.currentImage + 1) % this.IMAGES_IDLE.length;
    this.img = this.imageCache[this.IMAGES_IDLE[this.currentImage]];
    this.lastIdleFrameAt = gameLoop.now();
  }

  tryStartAttack() {
    if (!this.target || this.target.x >= this.x) return;
    const distance = this.x - (this.target.x + this.target.width);
    if (distance <= this.attackRange && gameLoop.now() - this.attackStartedAt >= this.getAttackCooldown()) this.startAttack();
  }

  updateEnragePhase() {
    if (this.phase === "normal" && this.hp <= this.maxHp / 2) {
      this.phase = "enraged";
    }
  }

  getAttackCooldown() {
    return this.isEnraged() ? this.enragedAttackCooldown : this.normalAttackCooldown;
  }

  getAttackFrameDuration() {
    return this.isEnraged() ? this.enragedAttackFrameDuration : this.normalAttackFrameDuration;
  }

  isEnraged() {
    return this.phase === "enraged";
  }

  hit() {
    if (!super.hit()) return false;
    this.isAttacking = false;
    if (this.isDead()) this.startDeath();
    else this.startHurt();
    return true;
  }

  startDeath() {
    const size = 300;
    this.deathStartedAt = gameLoop.now();
    this.currentImage = 0;
    this.x += (this.width - size) / 2;
    this.y += (this.height - size) / 2;
    this.width = size;
    this.height = size;
  }

  startHurt() {
    this.hurtStartedAt = gameLoop.now();
    this.currentImage = 0;
    this.img = this.imageCache[this.IMAGES_HURT[0]];
  }

  playDeathAnimation() {
    const elapsed = gameLoop.now() - this.deathStartedAt;
    const frame = Math.floor(elapsed / this.deathFrameDuration);
    this.currentImage = Math.min(frame, this.IMAGES_DEAD.length - 1);
    this.img = this.imageCache[this.IMAGES_DEAD[this.currentImage]];
    this.isDeathAnimationFinished = frame >= this.IMAGES_DEAD.length;
  }

  startAttack() {
    this.isAttacking = true;
    this.isAttackHitRegistered = false;
    this.attackStartedAt = gameLoop.now();
    this.currentImage = 0;
    this.img = this.imageCache[this.IMAGES_ATTACK[0]];
  }

  getAttackHitbox() {
    const hitbox = this.getHitbox();
    const fireExpansion = this.getFireExpansion();
    return {
      x: hitbox.x - fireExpansion.left,
      y: hitbox.y,
      width: hitbox.width + fireExpansion.left,
      height: hitbox.height + fireExpansion.bottom,
    };
  }

  getFireExpansion() {
    if (!this.isAttacking) return { left: 0, bottom: 0 };

    const expansions = [0, 0, 0, 0, 0, 0, 40, 95, 150, 150, 100];
    const frame = Math.min(this.currentImage, expansions.length - 1);
    const expansion = Math.round(expansions[frame] * (this.isEnraged() ? 1.3 : 1));
    return { left: expansion, bottom: Math.round(expansion * 0.3) };
  }

  float() {
    if (this.isDead()) return;
    this.y = this.baseY + Math.sin(gameLoop.now() * this.floatSpeed) * this.floatAmplitude;
  }
}
