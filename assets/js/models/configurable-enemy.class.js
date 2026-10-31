import { ENTITY_SCALE } from "../data.js";
import { Enemy } from "./enemy.class.js";
import { gameLoop } from "./game-loop.class.js";

const FROZEN_DURATION_MS = 2000;
const SHOCK_DURATION_MS = 1000;

export class ConfigurableEnemy extends Enemy {
  attackAnimations = [];
  hurtAnimations = [];
  attackHitEndFrameOverride = null;
  attackHitStartFrames = [];
  attackWeights = [];
  attackBag = [];
  recentAttackPicks = [];
  frozenAnimationInterval = 120;
  shockAnimationInterval = 120;

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
    this.attackWeights = (settings.sprites.attack ?? []).map((sprite) => sprite.weight ?? 1);
    this.IMAGES_ATTACK = this.attackAnimations[0] || [];
    this.IMAGES_HURT = this.hurtAnimations[0] || [];
    this.IMAGES_DEAD = this.loadAnimation(settings.sprites.death);
    this.IMAGES_FROZEN = this.loadAnimation(settings.sprites.frozen);
    this.IMAGES_SHOCK = this.loadAnimation(settings.sprites.shock);
    this.frozenAnimationInterval = settings.frozenAnimationInterval ?? (this.IMAGES_FROZEN.length ? FROZEN_DURATION_MS / this.IMAGES_FROZEN.length : this.animationInterval);
    this.shockAnimationInterval = this.IMAGES_SHOCK.length ? SHOCK_DURATION_MS / this.IMAGES_SHOCK.length : this.animationInterval;
    this.setEnemySettings({
      ...settings,
      position: { ...settings.position, ...positionOverrides },
    });
    this.start();
  }

  setEnemySettings(settings) {
    const { x, y, width, height, speed, minX, maxX } = settings.position;
    const scale = settings.pixelScale ?? ENTITY_SCALE * (settings.scale ?? 1);
    this.setPosition(x, y, width * scale, height * scale, speed * ENTITY_SCALE, minX, maxX);
    this.offset = settings.hitbox ? this.scaleOffset(settings.hitbox, scale) : this.offset;
    this.attackOffset = settings.attackHitbox ? this.scaleOffset(settings.attackHitbox, scale) : this.offset;
    this.chaseSpeedFactor = settings.chaseSpeedFactor ?? 1;
    this.aggroFootTolerance = settings.aggroFootTolerance ?? null;
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
    const statusDuration = status === "frozen" ? Math.max(duration, this.IMAGES_FROZEN.length * this.frozenAnimationInterval) : duration;
    super.applyStatus(status, statusDuration);
    this.lastAnimationAt = gameLoop.now();
    this.updateAnimation();
  }

  getAnimationSchedulerInterval() {
    return Math.min(super.getAnimationSchedulerInterval(), this.frozenAnimationInterval, this.shockAnimationInterval);
  }

  getAnimationInterval() {
    if (this.currentAnimation === "frozen") return this.frozenAnimationInterval;
    if (this.currentAnimation === "shock") return this.shockAnimationInterval;
    return super.getAnimationInterval();
  }

  tryStartAttack() {
    const wasAttacking = this.isAttacking;
    super.tryStartAttack();
    if (!wasAttacking && this.isAttacking) this.selectAttackAnimation();
  }

  selectAttackAnimation() {
    const variantIndex = this.pickAttackVariant();
    this.IMAGES_ATTACK = this.attackAnimations[variantIndex] ?? [];
    this.attackHitStartFrame = this.attackHitStartFrames[variantIndex] ?? this.attackHitStartFrame;
    this.attackHitEndFrame = this.attackHitEndFrameOverride ?? this.IMAGES_ATTACK.length - 1;
  }

  pickAttackVariant() {
    if (this.attackAnimations.length < 2) return 0;
    if (!this.attackBag.length) this.attackBag = this.createAttackBag();
    const [lastA, lastB] = this.recentAttackPicks.slice(-2);
    const isStreak = (index) => lastA === index && lastB === index;
    let bagPosition = this.attackBag.length - 1;
    if (isStreak(this.attackBag[bagPosition])) {
      const other = this.attackBag.findIndex((index) => !isStreak(index));
      if (other !== -1) bagPosition = other;
    }
    const [variantIndex] = this.attackBag.splice(bagPosition, 1);
    this.recentAttackPicks = [...this.recentAttackPicks, variantIndex].slice(-2);
    return variantIndex;
  }

  createAttackBag() {
    const bag = this.attackWeights.flatMap((weight, index) => Array(Math.max(0, Math.round(weight))).fill(index));
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [bag[i], bag[j]] = [bag[j], bag[i]];
    }
    return bag.length ? bag : [0];
  }

  selectRandomAnimation(animations) {
    if (!animations.length) return [];
    return animations[Math.floor(Math.random() * animations.length)];
  }
}
