import { Enemy } from "./enemy.class.js";

export class ConfigurableEnemy extends Enemy {
  attackAnimations = [];
  hurtAnimations = [];
  attackHitEndFrameOverride = null;

  constructor(settings) {
    super();
    this.animationInterval = settings.animationInterval ?? 120;
    this.IMAGES_IDLE = this.loadAnimation(settings.sprites.idle || settings.sprites.walk);
    this.IMAGES_MOVING = this.loadAnimation(settings.sprites.walk || settings.sprites.idle);
    this.IMAGES_RUN = this.loadAnimation(settings.sprites.run || settings.sprites.walk || settings.sprites.idle);
    this.attackAnimations = this.loadAnimationVariants(settings.sprites.attack);
    this.hurtAnimations = this.loadAnimationVariants(settings.sprites.hurt);
    this.IMAGES_ATTACK = this.attackAnimations[0] || [];
    this.IMAGES_HURT = this.hurtAnimations[0] || [];
    this.IMAGES_DEAD = this.loadAnimation(settings.sprites.death);
    this.setEnemySettings(settings);
    this.start();
  }

  setEnemySettings(settings) {
    const { x, y, width, height, speed, minX, maxX } = settings.position;
    this.setPosition(x, y, width, height, speed, minX, maxX);
    this.offset = settings.hitbox || this.offset;
    this.attackOffset = settings.attackHitbox || this.offset;
    this.attackHitStartFrame = settings.attackHitStartFrame ?? this.attackHitStartFrame;
    this.attackHitEndFrameOverride = settings.attackHitEndFrame ?? null;
  }

  loadAnimation(sprite) {
    if (!sprite) return [];
    return this.loadSpriteSheet(sprite.path, sprite.frameCount, sprite.frameSize, sprite.frameHeight);
  }

  loadAnimationVariants(sprites = []) {
    return sprites.map((sprite) => this.loadAnimation(sprite));
  }

  hit() {
    if (!super.hit()) return false;
    this.IMAGES_HURT = this.selectRandomAnimation(this.hurtAnimations);
    return true;
  }

  tryStartAttack() {
    const wasAttacking = this.isAttacking;
    super.tryStartAttack();
    if (!wasAttacking && this.isAttacking) this.selectAttackAnimation();
  }

  selectAttackAnimation() {
    this.IMAGES_ATTACK = this.selectRandomAnimation(this.attackAnimations);
    this.attackHitEndFrame = this.attackHitEndFrameOverride ?? this.IMAGES_ATTACK.length - 1;
  }

  selectRandomAnimation(animations) {
    if (!animations.length) return [];
    return animations[Math.floor(Math.random() * animations.length)];
  }
}
