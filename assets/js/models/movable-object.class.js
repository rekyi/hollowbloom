import { gameLoop } from "./game-loop.class.js";
import { playSfx } from "../sfx.js";
import { DrawableObject } from "./drawable-object.class.js";
import { GROUND_LEVEL } from "./level.class.js";

export class MoveableObject extends DrawableObject {
  speed = 0.15;
  isOppositeDirection = false;
  speedY = 0;
  acceleration = 2;
  groundLevel = GROUND_LEVEL;
  hp = 3;
  lastHit = Number.NEGATIVE_INFINITY;
  isAttacking = false;
  isAttackHitRegistered = false;
  attackHitStartFrame = 2;
  attackHitEndFrame = Number.POSITIVE_INFINITY;
  hitFlashUntil = Number.NEGATIVE_INFINITY;

  isAttackFrameActive() {
    return this.isAttacking && this.currentImage >= this.attackHitStartFrame && this.currentImage <= this.attackHitEndFrame;
  }

  getAttackHitbox() {
    return this.getHitbox();
  }

  isColliding(obj) {
    const a = this.getHitbox();
    const b = obj.getHitbox();
    return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
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
    this.x += this.speed;
    this.isOppositeDirection = false;
  }

  moveLeft() {
    this.x -= this.speed;
    this.isOppositeDirection = true;
  }

  jump() {
    if (!this.isAboveGround()) {
      this.speedY = 20;
      playSfx("jumpingBefore");
    }
  }

  gravity() {
    gameLoop.runEvery(1000 / 25, () => this.applyGravity());
  }

  applyGravity() {
    const groundY = this.groundLevel - this.height;
    const nextYPosition = this.y - this.speedY;
    if (nextYPosition >= groundY) {
      this.land(groundY);
      return;
    }
    this.y = nextYPosition;
    this.speedY -= this.acceleration;
  }

  land(groundY) {
    const wasAboveGround = this.isAboveGround();
    this.y = groundY;
    this.speedY = 0;
    if (wasAboveGround) playSfx("jumpingAfter");
  }

  isAboveGround() {
    return this.y + this.height < this.groundLevel;
  }

  draw(ctx) {
    ctx.save();
    if (gameLoop.now() < this.hitFlashUntil) ctx.filter = "brightness(0) invert(1)";
    super.draw(ctx);
    ctx.restore();
  }
}
