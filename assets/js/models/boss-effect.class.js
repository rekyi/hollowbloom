import { gameLoop } from "./game-loop.class.js";
import { DrawableObject } from "./drawable-object.class.js";

const EMPTY_DAMAGE_SIZE = { width: 0, height: 0 };

export class BossEffect extends DrawableObject {
  frames = [];
  pivot = { x: 0, y: 0 };
  frameDuration = 0;
  damageFrames = null;
  damageSize = null;
  speedX = 0;
  speedY = 0;
  gravity = 0;
  startedAt = 0;
  isOppositeDirection = false;
  isLooping = false;
  isRotating = false;
  isDestroyedOnGround = false;
  isFinished = false;
  isAttackHitRegistered = false;
  drawHitbox = true;

  constructor(settings, frames, imageCache, { pivotX, pivotY, isLeft = false, isLooping = false, isRotating = false, isDestroyedOnGround = false, speedX = 0, speedY = 0, gravity = 0 }) {
    super();
    this.frames = frames;
    this.imageCache = imageCache;
    this.width = settings.width;
    this.height = settings.height;
    this.pivot = settings.pivot;
    this.frameDuration = settings.frameDuration;
    this.damageFrames = settings.damageFrames ?? null;
    this.damageSize = settings.hitbox ?? null;
    this.isOppositeDirection = isLeft;
    this.isLooping = isLooping;
    this.isRotating = isRotating;
    this.isDestroyedOnGround = isDestroyedOnGround;
    this.speedX = speedX;
    this.speedY = speedY;
    this.gravity = gravity;
    this.startedAt = gameLoop.now();
    this.placePivotAt(pivotX, pivotY);
    this.updateFrame();
  }

  placePivotAt(pivotX, pivotY) {
    this.x = pivotX - this.getPivotOffsetX();
    this.y = pivotY - this.pivot.y;
  }

  getPivotOffsetX() {
    return this.isOppositeDirection ? this.width - this.pivot.x : this.pivot.x;
  }

  getPivotPoint() {
    return { x: this.x + this.getPivotOffsetX(), y: this.y + this.pivot.y };
  }

  update(dt) {
    this.speedY += this.gravity * dt;
    this.x += this.speedX * dt;
    this.y += this.speedY * dt;
    this.updateFrame();
  }

  updateFrame() {
    const frame = Math.floor((gameLoop.now() - this.startedAt) / this.frameDuration);
    this.isFinished = !this.isLooping && frame >= this.frames.length;
    if (this.isFinished) return;
    this.currentImage = frame % this.frames.length;
    this.img = this.imageCache[this.frames[this.currentImage]];
  }

  isDamageActive() {
    if (!this.damageSize || this.isFinished || this.isAttackHitRegistered) return false;
    if (!this.damageFrames) return true;
    const [firstFrame, lastFrame] = this.damageFrames;
    return this.currentImage >= firstFrame && this.currentImage <= lastFrame;
  }

  getHitbox() {
    const { width, height, isCentered = false } = this.damageSize ?? EMPTY_DAMAGE_SIZE;
    const pivotPoint = this.getPivotPoint();
    const top = isCentered ? pivotPoint.y - height / 2 : pivotPoint.y - height;
    return { x: pivotPoint.x - width / 2, y: top, width, height };
  }

  draw(ctx) {
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    if (this.isRotating) this.rotateAroundPivot(ctx);
    super.draw(ctx);
    ctx.restore();
  }

  rotateAroundPivot(ctx) {
    const pivotX = this.x + this.pivot.x;
    const pivotY = this.y + this.pivot.y;
    ctx.translate(pivotX, pivotY);
    ctx.rotate(Math.atan2(this.speedY, Math.abs(this.speedX)));
    ctx.translate(-pivotX, -pivotY);
  }
}
