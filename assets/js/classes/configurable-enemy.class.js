import { ENTITY_SCALE } from "../data.js";
import { Enemy } from "./enemy.class.js";
import { gameLoop } from "./game-loop.class.js";

const FROZEN_DURATION_MS = 2000;
const SHOCK_DURATION_MS = 1000;

/** Enemy built from a settings object with attack variants, hurt variants and status effects. */
export class ConfigurableEnemy extends Enemy {
  attackAnimations = [];
  hurtAnimations = [];
  attackHitEndFrameOverride = null;
  attackHitStartFrames = [];
  attackWeights = [];
  attackBag = [];
  attackSfxNames = [];
  attackSfxFrames = [];
  recentAttackPicks = [];
  frozenAnimationInterval = 120;
  shockAnimationInterval = 120;

  /**
   * Loads all animations and sounds from the settings and starts the enemy.
   * @param {Object} settings - Enemy settings with sprites, hitboxes, sounds and position.
   * @param {Object} [positionOverrides={}] - Values that override the position settings.
   */
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
    this.hurtSfx = settings.sfx?.hurt ?? null;
    this.deathSfx = settings.sfx?.death ?? null;
    this.attackSfxNames = (settings.sprites.attack ?? []).map((sprite) => sprite.sfx ?? null);
    this.attackSfxFrames = (settings.sprites.attack ?? []).map((sprite) => sprite.sfxFrame ?? 0);
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

  /**
   * Applies position, size, hitboxes and combat values from the settings.
   * @param {Object} settings - Enemy settings.
   */
  setEnemySettings(settings) {
    const { x, y, width, height, speed, minX, maxX } = settings.position;
    const scale = settings.pixelScale ?? ENTITY_SCALE * (settings.scale ?? 1);
    this.setPosition(x, y, width * scale, height * scale, speed * ENTITY_SCALE, minX, maxX);
    this.offset = settings.hitbox ? this.scaleOffset(settings.hitbox, scale) : this.offset;
    this.attackOffset = settings.attackHitbox ? this.scaleOffset(settings.attackHitbox, scale) : this.offset;
    this.hp = settings.hp ?? this.hp;
    this.hasAttackArmor = settings.hasAttackArmor ?? false;
    this.chaseSpeedFactor = settings.chaseSpeedFactor ?? 1;
    this.aggroFootTolerance = settings.aggroFootTolerance ?? null;
    this.attackHitStartFrame = settings.attackHitStartFrame ?? this.attackHitStartFrame;
    this.attackHitEndFrameOverride = settings.attackHitEndFrame ?? null;
    this.attackHitStartFrames = (settings.sprites.attack ?? []).map((sprite) => sprite.hitStartFrame ?? this.attackHitStartFrame);
  }

  /**
   * Loads an animation from a sprite config.
   * @param {?Object} sprite - Sprite config, or nothing.
   * @returns {string[]} Image cache keys, or an empty array.
   */
  loadAnimation(sprite) {
    if (!sprite) return [];
    return this.loadSpriteSheet(sprite.path, sprite.frameCount, sprite.frameSize, sprite.frameHeight, sprite.placement, sprite.columns);
  }

  /**
   * Loads several animation variants.
   * @param {Object[]} [sprites=[]] - Sprite configs.
   * @returns {string[][]} Image cache keys per variant.
   */
  loadAnimationVariants(sprites = []) {
    return sprites.map((sprite) => this.loadAnimation(sprite));
  }

  /**
   * Applies a hit, keeps attacking if armored, picks a hurt animation and applies status effects.
   * @param {{character: string, attackType: string}} [source] - Attacker info.
   * @returns {boolean} True if the hit was applied.
   */
  hit(source) {
    const isArmored = this.isAttackArmored();
    const previousLastHit = this.lastHit;
    if (!super.hit()) return false;
    if (isArmored && !this.isDead()) this.lastHit = previousLastHit;
    this.IMAGES_HURT = this.selectRandomAnimation(this.hurtAnimations);
    this.applyHitStatus(source);
    return true;
  }

  /**
   * Freezes or shocks the enemy depending on the special attack that hit it.
   * @param {{character: string, attackType: string}} [source] - Attacker info.
   */
  applyHitStatus(source) {
    if (this.isDead() || !source) return;
    if (source.character === "female" && source.attackType === "attack_4" && this.IMAGES_FROZEN.length) {
      this.applyStatus("frozen", FROZEN_DURATION_MS);
    } else if (source.character === "male" && source.attackType === "attack_3" && this.IMAGES_SHOCK.length) {
      this.applyStatus("shock", SHOCK_DURATION_MS);
    }
  }

  /**
   * Applies a status effect long enough for its animation and shows it immediately.
   * @param {string} status - "frozen" or "shock".
   * @param {number} duration - Minimum duration in milliseconds.
   */
  applyStatus(status, duration) {
    const statusDuration = status === "frozen" ? Math.max(duration, this.IMAGES_FROZEN.length * this.frozenAnimationInterval) : duration;
    super.applyStatus(status, statusDuration);
    this.lastAnimationAt = gameLoop.now();
    this.updateAnimation();
  }

  /**
   * Gets the scheduler interval, short enough for status animations.
   * @returns {number} Interval in milliseconds.
   */
  getAnimationSchedulerInterval() {
    return Math.min(super.getAnimationSchedulerInterval(), this.frozenAnimationInterval, this.shockAnimationInterval);
  }

  /**
   * Gets the frame interval of the current animation.
   * @returns {number} Interval in milliseconds.
   */
  getAnimationInterval() {
    if (this.currentAnimation === "frozen") return this.frozenAnimationInterval;
    if (this.currentAnimation === "shock") return this.shockAnimationInterval;
    return super.getAnimationInterval();
  }

  /** Starts an attack if possible and picks its variant. */
  tryStartAttack() {
    const wasAttacking = this.isAttacking;
    super.tryStartAttack();
    if (!wasAttacking && this.isAttacking) this.selectAttackAnimation();
  }

  /** Sets frames, sound and damage frames of the picked attack variant. */
  selectAttackAnimation() {
    const variantIndex = this.pickAttackVariant();
    this.IMAGES_ATTACK = this.attackAnimations[variantIndex] ?? [];
    this.attackSfx = this.attackSfxNames[variantIndex] ?? null;
    this.attackSfxFrame = this.attackSfxFrames[variantIndex] ?? 0;
    this.attackHitStartFrame = this.attackHitStartFrames[variantIndex] ?? this.attackHitStartFrame;
    this.attackHitEndFrame = this.attackHitEndFrameOverride ?? this.IMAGES_ATTACK.length - 1;
  }

  /**
   * Picks the next attack variant from a weighted bag, avoiding three identical picks in a row.
   * @returns {number} Index of the attack variant.
   */
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

  /**
   * Creates a shuffled bag of attack variant indexes based on their weights.
   * @returns {number[]} Shuffled variant indexes.
   */
  createAttackBag() {
    const bag = this.attackWeights.flatMap((weight, index) => Array(Math.max(0, Math.round(weight))).fill(index));
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [bag[i], bag[j]] = [bag[j], bag[i]];
    }
    return bag.length ? bag : [0];
  }

  /**
   * Picks a random animation variant.
   * @param {string[][]} animations - Animation variants.
   * @returns {string[]} The picked animation, or an empty array.
   */
  selectRandomAnimation(animations) {
    if (!animations.length) return [];
    return animations[Math.floor(Math.random() * animations.length)];
  }
}
