import { gameLoop } from "./game-loop.class.js";
import { DrawableObject } from "./drawable-object.class.js";
import { playSfx } from "../sfx.js";

const EMPTY_DAMAGE_SIZE = { width: 0, height: 0 };

export class BossEffect extends DrawableObject {
  frames = [];
  pivot = { x: 0, y: 0 };
  tipDistance = 0;
  groundProbe = { getHitbox: () => this.getTipBox() };
  frameDuration = 0;
  damageFrames = null;
  damageSize = null;
  ring = null;
  sound = null;
  isSoundPlayed = false;
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
  onGroundHit = null;

  constructor(settings, frames, imageCache, { pivotX, pivotY, isLeft = false, isLooping = false, isRotating = false, isDestroyedOnGround = false, onGroundHit = null, speedX = 0, speedY = 0, gravity = 0 }) {
    super();
    this.frames = frames;
    this.imageCache = imageCache;
    this.width = settings.width;
    this.height = settings.height;
    this.pivot = settings.pivot;
    this.tipDistance = settings.tipDistance ?? 0;
    this.frameDuration = settings.frameDuration;
    this.damageFrames = settings.damageFrames ?? null;
    this.damageSize = settings.hitbox ?? null;
    this.ring = settings.ring ?? null;
    this.sound = settings.sound ?? null;
    this.isOppositeDirection = isLeft;
    this.isLooping = isLooping;
    this.isRotating = isRotating;
    this.isDestroyedOnGround = isDestroyedOnGround;
    this.onGroundHit = onGroundHit;
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

  getTipBox() {
    const pivotPoint = this.getPivotPoint();
    const angle = Math.atan2(this.speedY, Math.abs(this.speedX));
    const direction = this.isOppositeDirection ? -1 : 1;
    const tipX = pivotPoint.x + direction * Math.cos(angle) * this.tipDistance;
    const tipY = pivotPoint.y + Math.sin(angle) * this.tipDistance;
    return { x: tipX - 1, y: tipY - 1, width: 2, height: 2 };
  }

  handleGroundHit(groundY) {
    const origin = { x: this.getPivotPoint().x, y: groundY };
    this.onGroundHit?.({ origin, isLeft: this.isOppositeDirection });
  }

  update(dt) {
    this.speedY += this.gravity * dt;
    this.x += this.speedX * dt;
    this.y += this.speedY * dt;
    this.updateFrame();
  }

  updateFrame() {
    const frame = Math.floor((gameLoop.now() - this.startedAt) / this.frameDuration);
    this.playSoundWhenDue(frame);
    this.isFinished = !this.isLooping && frame >= this.frames.length;
    if (this.isFinished) return;
    this.currentImage = frame % this.frames.length;
    this.img = this.imageCache[this.frames[this.currentImage]];
  }

  playSoundWhenDue(frame) {
    if (!this.sound || this.isSoundPlayed || frame < this.sound.frame) return;
    this.isSoundPlayed = true;
    playSfx(this.sound.name, { volume: this.sound.volume });
  }

  isDamageActive() {
    if ((!this.damageSize && !this.ring) || this.isFinished || this.isAttackHitRegistered) return false;
    if (!this.damageFrames) return true;
    const [firstFrame, lastFrame] = this.damageFrames;
    return this.currentImage >= firstFrame && this.currentImage <= lastFrame;
  }

  getRingRadius() {
    const { minRadius, maxRadius } = this.ring;
    const progress = (this.currentImage + 1) / this.frames.length;
    return minRadius + (maxRadius - minRadius) * (1 - (1 - progress) ** 2);
  }

  isRingTouching({ x, y, width, height }) {
    const center = this.getPivotPoint();
    const radius = this.getRingRadius();
    const halfWidth = this.ring.width / 2;
    const nearestX = Math.min(Math.max(center.x, x), x + width) - center.x;
    const nearestY = Math.min(Math.max(center.y, y), y + height) - center.y;
    const farthestX = Math.max(Math.abs(x - center.x), Math.abs(x + width - center.x));
    const farthestY = Math.max(Math.abs(y - center.y), Math.abs(y + height - center.y));
    return Math.hypot(nearestX, nearestY) <= radius + halfWidth && Math.hypot(farthestX, farthestY) >= radius - halfWidth;
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
