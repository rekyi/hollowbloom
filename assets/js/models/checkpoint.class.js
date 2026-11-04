import { gameLoop } from "./game-loop.class.js";
import { DrawableObject } from "./drawable-object.class.js";

const IMAGE_FOLDER = "assets/images/checkpoint/";
const IDLE_PATH = `${IMAGE_FOLDER}checkpoint_idle.webp`;
const BLOOM_PATHS = getFramePaths("bloom", 6);
const GLOW_PATHS = getFramePaths("glow", 6);
const BLOOM_FRAME_MS = 80;
const GLOW_FRAME_MS = 120;
const GROUND_SINK_PX = 8;
const BLOOM_HEIGHT_PX = 94;

/**
 * Builds the frame paths of a checkpoint animation.
 * @param {string} name - Animation name, e.g. "bloom".
 * @param {number} count - Number of frames.
 * @returns {string[]} Frame image paths.
 */
function getFramePaths(name, count) {
  return Array.from({ length: count }, (_, index) => `${IMAGE_FOLDER}checkpoint_${name}_${index + 1}.webp`);
}

/** Respawn point that blooms when the character reaches it. */
export class Checkpoint extends DrawableObject {
  entity;
  activatedAt = null;

  /**
   * @param {Object} entity - Checkpoint entity from the level data.
   * @param {{x: number, y: number, width: number, height: number}} box - Position and size of the checkpoint.
   */
  constructor(entity, { x, y, width, height }) {
    super();
    this.entity = entity;
    this.loadImages([IDLE_PATH, ...BLOOM_PATHS, ...GLOW_PATHS]);
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  /**
   * Whether the checkpoint has been activated.
   * @returns {boolean} True if active.
   */
  get isActive() {
    return this.activatedAt !== null;
  }

  /**
   * Gets the center of the checkpoint's bloom.
   * @returns {{x: number, y: number}} Bloom center.
   */
  getBloomCenter() {
    return { x: this.x + this.width / 2, y: this.y + this.height + GROUND_SINK_PX - BLOOM_HEIGHT_PX };
  }

  /** Activates the checkpoint and starts the bloom animation. */
  activate() {
    this.activatedAt = gameLoop.now();
  }

  /** Resets the checkpoint to its idle state. */
  deactivate() {
    this.activatedAt = null;
  }

  /**
   * Gets the idle frame, or the bloom and then looping glow frames once active.
   * @returns {HTMLImageElement} The frame image.
   */
  getCurrentFrame() {
    if (!this.isActive) return this.imageCache[IDLE_PATH];
    const elapsedMs = gameLoop.now() - this.activatedAt;
    const bloomFrame = Math.floor(elapsedMs / BLOOM_FRAME_MS);
    if (bloomFrame < BLOOM_PATHS.length) return this.imageCache[BLOOM_PATHS[bloomFrame]];
    return this.imageCache[GLOW_PATHS[Math.floor(elapsedMs / GLOW_FRAME_MS) % GLOW_PATHS.length]];
  }

  /**
   * Draws the current frame centered and slightly sunk into the ground.
   * @param {CanvasRenderingContext2D} ctx - Target canvas context.
   */
  draw(ctx) {
    const frame = this.getCurrentFrame();
    if (!frame.complete || frame.naturalWidth === 0) return;
    const drawX = this.x + (this.width - frame.naturalWidth) / 2;
    const drawY = this.y + this.height - frame.naturalHeight + GROUND_SINK_PX;
    ctx.drawImage(frame, Math.round(drawX), Math.round(drawY));
  }
}
