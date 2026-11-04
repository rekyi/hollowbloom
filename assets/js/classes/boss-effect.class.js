import { gameLoop } from "./game-loop.class.js";
import { DrawableObject } from "./drawable-object.class.js";
import { playSfx } from "../sfx.js";

const EMPTY_DAMAGE_SIZE = { width: 0, height: 0 };

/** Animated boss attack effect such as arrows, impacts, spikes or pulse rings, with optional motion and damage. */
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

  /**
   * @param {Object} settings - Effect settings with size, pivot, frame duration, damage and sound.
   * @param {string[]} frames - Image cache keys of the animation.
   * @param {Object<string, HTMLCanvasElement>} imageCache - Shared image cache of the boss.
   * @param {Object} options - Placement and motion.
   * @param {number} options.pivotX - Pivot x in world coordinates.
   * @param {number} options.pivotY - Pivot y in world coordinates.
   * @param {boolean} [options.isLeft=false] - Whether the effect is mirrored to the left.
   * @param {boolean} [options.isLooping=false] - Whether the animation loops.
   * @param {boolean} [options.isRotating=false] - Whether it rotates along its flight path.
   * @param {boolean} [options.isDestroyedOnGround=false] - Whether it is removed on ground contact.
   * @param {?Function} [options.onGroundHit=null] - Called with the impact placement on ground contact.
   * @param {number} [options.speedX=0] - Horizontal speed in pixels per second.
   * @param {number} [options.speedY=0] - Vertical speed in pixels per second.
   * @param {number} [options.gravity=0] - Gravity in pixels per second squared.
   */
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

  /**
   * Positions the effect so its pivot lies at a point.
   * @param {number} pivotX - Pivot x in world coordinates.
   * @param {number} pivotY - Pivot y in world coordinates.
   */
  placePivotAt(pivotX, pivotY) {
    this.x = pivotX - this.getPivotOffsetX();
    this.y = pivotY - this.pivot.y;
  }

  /**
   * Gets the pivot x offset, mirrored when facing left.
   * @returns {number} Offset from the left edge.
   */
  getPivotOffsetX() {
    return this.isOppositeDirection ? this.width - this.pivot.x : this.pivot.x;
  }

  /**
   * Gets the pivot in world coordinates.
   * @returns {{x: number, y: number}} Pivot point.
   */
  getPivotPoint() {
    return { x: this.x + this.getPivotOffsetX(), y: this.y + this.pivot.y };
  }

  /**
   * Gets a tiny box at the arrow tip along the flight direction, used to detect ground hits.
   * @returns {{x: number, y: number, width: number, height: number}} Tip box.
   */
  getTipBox() {
    const pivotPoint = this.getPivotPoint();
    const angle = Math.atan2(this.speedY, Math.abs(this.speedX));
    const direction = this.isOppositeDirection ? -1 : 1;
    const tipX = pivotPoint.x + direction * Math.cos(angle) * this.tipDistance;
    const tipY = pivotPoint.y + Math.sin(angle) * this.tipDistance;
    return { x: tipX - 1, y: tipY - 1, width: 2, height: 2 };
  }

  /**
   * Notifies the ground hit callback with the impact position.
   * @param {number} groundY - Y coordinate of the ground.
   */
  handleGroundHit(groundY) {
    const origin = { x: this.getPivotPoint().x, y: groundY };
    this.onGroundHit?.({ origin, isLeft: this.isOppositeDirection });
  }

  /**
   * Applies gravity and speed and updates the frame.
   * @param {number} dt - Time step in seconds.
   */
  update(dt) {
    this.speedY += this.gravity * dt;
    this.x += this.speedX * dt;
    this.y += this.speedY * dt;
    this.updateFrame();
  }

  /** Updates the current frame from elapsed time, plays the sound and marks one-shot effects as finished. */
  updateFrame() {
    const frame = Math.floor((gameLoop.now() - this.startedAt) / this.frameDuration);
    this.playSoundWhenDue(frame);
    this.isFinished = !this.isLooping && frame >= this.frames.length;
    if (this.isFinished) return;
    this.currentImage = frame % this.frames.length;
    this.img = this.imageCache[this.frames[this.currentImage]];
  }

  /**
   * Plays the effect sound once its frame is reached.
   * @param {number} frame - Elapsed frame.
   */
  playSoundWhenDue(frame) {
    if (!this.sound || this.isSoundPlayed || frame < this.sound.frame) return;
    this.isSoundPlayed = true;
    playSfx(this.sound.name, { volume: this.sound.volume });
  }

  /**
   * Checks whether the effect can currently deal damage.
   * @returns {boolean} True within the damage frames if it has not hit yet.
   */
  isDamageActive() {
    if ((!this.damageSize && !this.ring) || this.isFinished || this.isAttackHitRegistered) return false;
    if (!this.damageFrames) return true;
    const [firstFrame, lastFrame] = this.damageFrames;
    return this.currentImage >= firstFrame && this.currentImage <= lastFrame;
  }

  /**
   * Gets the current pulse ring radius with an ease-out expansion.
   * @returns {number} Radius in pixels.
   */
  getRingRadius() {
    const { minRadius, maxRadius } = this.ring;
    const progress = (this.currentImage + 1) / this.frames.length;
    return minRadius + (maxRadius - minRadius) * (1 - (1 - progress) ** 2);
  }

  /**
   * Checks whether the ring band overlaps a box.
   * @param {{x: number, y: number, width: number, height: number}} box - Box to test.
   * @returns {boolean} True if the box touches the ring.
   */
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

  /**
   * Gets the damage hitbox around the pivot.
   * @returns {{x: number, y: number, width: number, height: number}} The hitbox.
   */
  getHitbox() {
    const { width, height, isCentered = false } = this.damageSize ?? EMPTY_DAMAGE_SIZE;
    const pivotPoint = this.getPivotPoint();
    const top = isCentered ? pivotPoint.y - height / 2 : pivotPoint.y - height;
    return { x: pivotPoint.x - width / 2, y: top, width, height };
  }

  /**
   * Draws the effect, rotated along its path if enabled.
   * @param {CanvasRenderingContext2D} ctx - Target canvas context.
   */
  draw(ctx) {
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    if (this.isRotating) this.rotateAroundPivot(ctx);
    super.draw(ctx);
    ctx.restore();
  }

  /**
   * Rotates the context around the pivot to match the flight direction.
   * @param {CanvasRenderingContext2D} ctx - Target canvas context.
   */
  rotateAroundPivot(ctx) {
    const pivotX = this.x + this.pivot.x;
    const pivotY = this.y + this.pivot.y;
    ctx.translate(pivotX, pivotY);
    ctx.rotate(Math.atan2(this.speedY, Math.abs(this.speedX)));
    ctx.translate(-pivotX, -pivotY);
  }
}
