import { gameLoop } from "./game-loop.class.js";
import { playSfx } from "../sfx.js";
import { ENTITY_SCALE, KNOCKBACK_FRICTION, KNOCKBACK_MIN_SPEED } from "../data.js";
import { DrawableObject } from "./drawable-object.class.js";
import { hasGroundBelow, moveX, moveY } from "../tile-collision.js";

const HIT_JITTER_MS = 120;
const HIT_JITTER_PX = 3;

/** Drawable object with movement, gravity, hit points and hit feedback. */
export class MoveableObject extends DrawableObject {
  speed = 0.15;
  isOppositeDirection = false;
  speedY = 0;
  acceleration = 0.3623 * ENTITY_SCALE;
  jumpSpeed = 13 * ENTITY_SCALE;
  fallMultiplier = 1.7;
  hp = 3;
  lastHit = Number.NEGATIVE_INFINITY;
  isAttacking = false;
  isAttackHitRegistered = false;
  attackHitStartFrame = 2;
  attackHitEndFrame = Number.POSITIVE_INFINITY;
  hitFlashUntil = Number.NEGATIVE_INFINITY;
  hitJitterUntilMs = Number.NEGATIVE_INFINITY;

  /**
   * Scales all sides of an offset.
   * @param {Object<string, number>} offset - Offset with top, right, bottom and left.
   * @param {number} [scale=ENTITY_SCALE] - Scale factor.
   * @returns {Object<string, number>} The scaled offset.
   */
  scaleOffset(offset, scale = ENTITY_SCALE) {
    return Object.fromEntries(Object.entries(offset).map(([side, value]) => [side, value * scale]));
  }

  /**
   * Checks whether the current attack frame can deal damage.
   * @returns {boolean} True during the damaging frames of an attack.
   */
  isAttackFrameActive() {
    return this.isAttacking && this.currentImage >= this.attackHitStartFrame && this.currentImage <= this.attackHitEndFrame;
  }

  /**
   * Gets the area in which the attack deals damage.
   * @returns {{x: number, y: number, width: number, height: number}} The attack hitbox.
   */
  getAttackHitbox() {
    return this.getHitbox();
  }

  /**
   * Removes one hit point and starts the hit flash.
   * @returns {boolean} False if the object was already dead.
   */
  hit() {
    if (this.isDead()) return false;
    this.hp--;
    this.lastHit = gameLoop.now();
    this.hitFlashUntil = gameLoop.now() + 120;
    return true;
  }

  /**
   * Checks whether the object was hit within the last 500 ms.
   * @returns {boolean} True while the hurt phase lasts.
   */
  gettingHit() {
    let timeSinceLastHit = gameLoop.now() - this.lastHit;
    timeSinceLastHit = timeSinceLastHit / 500;
    return timeSinceLastHit < 1;
  }

  /**
   * Checks whether the object has no hit points left.
   * @returns {boolean} True if dead.
   */
  isDead() {
    return this.hp <= 0;
  }

  /**
   * Shows the next frame of a looping animation.
   * @param {string[]} images - Image cache keys of the animation.
   */
  playAnimation(images) {
    const i = this.currentImage % images.length;
    const path = images[i];
    this.img = this.imageCache[path];
    this.currentImage++;
  }

  /** Faces right and moves right with tile collision. */
  moveRight() {
    this.isOppositeDirection = false;
    moveX(this, this.world.level, this.speed);
  }

  /** Faces left and moves left with tile collision. */
  moveLeft() {
    this.isOppositeDirection = true;
    moveX(this, this.world.level, -this.speed);
  }

  /** Starts a jump if the object stands on the ground. */
  jump() {
    if (!this.isAboveGround()) this.startJump();
  }

  /** Sets the upward jump speed. */
  startJump() {
    this.speedY = this.jumpSpeed;
  }

  /** Starts applying gravity at 60 fps. */
  gravity() {
    gameLoop.runEvery(1000 / 60, () => this.applyGravity());
  }

  /** Moves the object vertically, accelerates it downward and plays the landing sound. */
  applyGravity() {
    const wasAboveGround = this.isAboveGround();
    const isBlocked = moveY(this, this.world.level, -this.speedY);
    if (!isBlocked) {
      this.speedY -= this.getGravity();
      return;
    }
    if (this.speedY < 0 && wasAboveGround) playSfx("jumpLand");
    this.speedY = 0;
  }

  /**
   * Gets the current gravity, stronger while falling.
   * @returns {number} Vertical acceleration per tick.
   */
  getGravity() {
    return this.speedY < 0 ? this.acceleration * this.fallMultiplier : this.acceleration;
  }

  /**
   * Checks whether the object is in the air.
   * @returns {boolean} True if there is no ground directly below.
   */
  isAboveGround() {
    return !hasGroundBelow(this, this.world.level);
  }

  /** Slows the knockback down by friction and stops it below a minimum speed. */
  decayKnockback() {
    this.knockbackSpeed *= KNOCKBACK_FRICTION;
    if (this.knockbackSpeed < KNOCKBACK_MIN_SPEED) this.knockbackSpeed = 0;
  }

  /** Starts a short horizontal shake of the sprite. */
  startHitJitter() {
    this.hitJitterUntilMs = performance.now() + HIT_JITTER_MS;
  }

  /**
   * Gets a random horizontal jitter offset.
   * @returns {number} Offset in pixels.
   */
  getHitJitter() {
    return Math.round((Math.random() * 2 - 1) * HIT_JITTER_PX);
  }

  /**
   * Draws the object with hit flash and hit jitter if active.
   * @param {CanvasRenderingContext2D} ctx - Target canvas context.
   */
  draw(ctx) {
    ctx.save();
    if (gameLoop.now() < this.hitFlashUntil) ctx.filter = "brightness(0) invert(1)";
    if (performance.now() < this.hitJitterUntilMs) ctx.translate(this.getHitJitter(), 0);
    super.draw(ctx);
    ctx.restore();
  }
}
