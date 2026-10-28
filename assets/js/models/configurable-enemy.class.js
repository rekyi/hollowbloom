import { Enemy } from "./enemy.class.js";

const FROZEN_DURATION_MS = 2000;
const SHOCK_DURATION_MS = 1000;

export class ConfigurableEnemy extends Enemy {
  attackAnimations = [];
  hurtAnimations = [];
  attackHitEndFrameOverride = null;
  attackHitStartFrames = [];

  constructor(settings, positionOverrides = {}) {
    super();
    this.animationInterval = settings.animationInterval ?? 120;
    this.attackAnimationInterval = settings.attackAnimationInterval ?? this.animationInterval;
    this.runAnimationInterval = settings.runAnimationInterval ?? this.animationInterval;
    this.deathAnimationInterval = settings.deathAnimationInterval ?? this.animationInterval;
    this.IMAGES_IDLE = this.loadAnimation(settings.sprites.idle || settings.sprites.walk);
    this.IMAGES_MOVING = this.loadAnimation(settings.sprites.walk || settings.sprites.idle);
    this.IMAGES_RUN = this.loadAnimation(settings.sprites.run || settings.sprites.walk || settings.sprites.idle);
    this.attackAnimations = this.loadAnimationVariants(settings.sprites.attack);
    this.hurtAnimations = this.loadAnimationVariants(settings.sprites.hurt);
    this.IMAGES_ATTACK = this.attackAnimations[0] || [];
    this.IMAGES_HURT = this.hurtAnimations[0] || [];
    this.IMAGES_DEAD = this.loadAnimation(settings.sprites.death);
    this.IMAGES_FROZEN = this.loadAnimation(settings.sprites.frozen);
    this.IMAGES_SHOCK = this.loadAnimation(settings.sprites.shock);
    this.setEnemySettings({
      ...settings,
      position: { ...settings.position, ...positionOverrides },
    });
    this.start();
  }

  setEnemySettings(settings) {
    const { x, y, width, height, speed, minX, maxX } = settings.position;
    this.setPosition(x, y, width, height, speed, minX, maxX);
    this.offset = settings.hitbox || this.offset;
    this.attackOffset = settings.attackHitbox || this.offset;
    this.attackHitStartFrame = settings.attackHitStartFrame ?? this.attackHitStartFrame;
    this.attackHitEndFrameOverride = settings.attackHitEndFrame ?? null;
    this.attackHitStartFrames = (settings.sprites.attack ?? []).map((sprite) => sprite.hitStartFrame ?? this.attackHitStartFrame);
  }

  loadAnimation(sprite) {
    if (!sprite) return [];
    return this.loadSpriteSheet(sprite.path, sprite.frameCount, sprite.frameSize, sprite.frameHeight, sprite.placement, sprite.columns);
  }

  loadAnimationVariants(sprites = []) {
    return sprites.map((sprite) => this.loadAnimation(sprite));
  }

  hit(source) {
    if (!super.hit()) return false;
    this.IMAGES_HURT = this.selectRandomAnimation(this.hurtAnimations);
    this.applyHitStatus(source);
    return true;
  }

  applyHitStatus(source) {
    if (this.isDead() || !source) return;
    if (source.character === "female" && source.attackType === "attack_4" && this.IMAGES_FROZEN.length) {
      this.applyStatus("frozen", FROZEN_DURATION_MS);
    } else if (source.character === "male" && source.attackType === "attack_3" && this.IMAGES_SHOCK.length) {
      this.applyStatus("shock", SHOCK_DURATION_MS);
    }
  }

  applyStatus(status, duration) {
    const images = status === "frozen" ? this.IMAGES_FROZEN : this.IMAGES_SHOCK;
    const animationDuration = (images.length + 1) * this.animationInterval;
    super.applyStatus(status, Math.max(duration, animationDuration));
  }

  tryStartAttack() {
    const wasAttacking = this.isAttacking;
    super.tryStartAttack();
    if (!wasAttacking && this.isAttacking) this.selectAttackAnimation();
  }

  selectAttackAnimation() {
    this.IMAGES_ATTACK = this.selectRandomAnimation(this.attackAnimations);
    const variantIndex = Math.max(0, this.attackAnimations.indexOf(this.IMAGES_ATTACK));
    this.attackHitStartFrame = this.attackHitStartFrames[variantIndex] ?? this.attackHitStartFrame;
    this.attackHitEndFrame = this.attackHitEndFrameOverride ?? this.IMAGES_ATTACK.length - 1;
  }

  selectRandomAnimation(animations) {
    if (!animations.length) return [];
    return animations[Math.floor(Math.random() * animations.length)];
  }
}
