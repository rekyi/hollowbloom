import { gameLoop } from "./game-loop.class.js";
import { playSfx } from "../sfx.js";
import { ENTITY_SCALE, KNOCKBACK_FRICTION, KNOCKBACK_MIN_SPEED } from "../data.js";
import { DrawableObject } from "./drawable-object.class.js";
import { hasGroundBelow, moveX, moveY } from "./tile-collision.js";

const HIT_JITTER_MS = 120;
const HIT_JITTER_PX = 3;

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

  scaleOffset(offset, scale = ENTITY_SCALE) {
    return Object.fromEntries(Object.entries(offset).map(([side, value]) => [side, value * scale]));
  }

  isAttackFrameActive() {
    return this.isAttacking && this.currentImage >= this.attackHitStartFrame && this.currentImage <= this.attackHitEndFrame;
  }

  getAttackHitbox() {
    return this.getHitbox();
  }

  hit() {
    if (this.isDead()) return false;
    this.hp--;
    this.lastHit = gameLoop.now();
    this.hitFlashUntil = gameLoop.now() + 120;
    return true;
  }

  gettingHit() {
    let timeSinceLastHit = gameLoop.now() - this.lastHit;
    timeSinceLastHit = timeSinceLastHit / 500;
    return timeSinceLastHit < 1;
  }

  isDead() {
    return this.hp <= 0;
  }

  playAnimation(images) {
    const i = this.currentImage % images.length;
    const path = images[i];
    this.img = this.imageCache[path];
    this.currentImage++;
  }

  moveRight() {
    this.isOppositeDirection = false;
    moveX(this, this.world.level, this.speed);
  }

  moveLeft() {
    this.isOppositeDirection = true;
    moveX(this, this.world.level, -this.speed);
  }

  jump() {
    if (!this.isAboveGround()) this.startJump();
  }

  startJump() {
    this.speedY = this.jumpSpeed;
  }

  gravity() {
    gameLoop.runEvery(1000 / 60, () => this.applyGravity());
  }

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

  getGravity() {
    return this.speedY < 0 ? this.acceleration * this.fallMultiplier : this.acceleration;
  }

  isAboveGround() {
    return !hasGroundBelow(this, this.world.level);
  }

  decayKnockback() {
    this.knockbackSpeed *= KNOCKBACK_FRICTION;
    if (this.knockbackSpeed < KNOCKBACK_MIN_SPEED) this.knockbackSpeed = 0;
  }

  startHitJitter() {
    this.hitJitterUntilMs = performance.now() + HIT_JITTER_MS;
  }

  getHitJitter() {
    return Math.round((Math.random() * 2 - 1) * HIT_JITTER_PX);
  }

  draw(ctx) {
    ctx.save();
    if (gameLoop.now() < this.hitFlashUntil) ctx.filter = "brightness(0) invert(1)";
    if (performance.now() < this.hitJitterUntilMs) ctx.translate(this.getHitJitter(), 0);
    super.draw(ctx);
    ctx.restore();
  }
}
