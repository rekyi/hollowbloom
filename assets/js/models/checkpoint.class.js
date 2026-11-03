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

function getFramePaths(name, count) {
  return Array.from({ length: count }, (_, index) => `${IMAGE_FOLDER}checkpoint_${name}_${index + 1}.webp`);
}

export class Checkpoint extends DrawableObject {
  entity;
  activatedAt = null;

  constructor(entity, { x, y, width, height }) {
    super();
    this.entity = entity;
    this.loadImages([IDLE_PATH, ...BLOOM_PATHS, ...GLOW_PATHS]);
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  get isActive() {
    return this.activatedAt !== null;
  }

  getBloomCenter() {
    return { x: this.x + this.width / 2, y: this.y + this.height + GROUND_SINK_PX - BLOOM_HEIGHT_PX };
  }

  activate() {
    this.activatedAt = gameLoop.now();
  }

  deactivate() {
    this.activatedAt = null;
  }

  getCurrentFrame() {
    if (!this.isActive) return this.imageCache[IDLE_PATH];
    const elapsedMs = gameLoop.now() - this.activatedAt;
    const bloomFrame = Math.floor(elapsedMs / BLOOM_FRAME_MS);
    if (bloomFrame < BLOOM_PATHS.length) return this.imageCache[BLOOM_PATHS[bloomFrame]];
    return this.imageCache[GLOW_PATHS[Math.floor(elapsedMs / GLOW_FRAME_MS) % GLOW_PATHS.length]];
  }

  draw(ctx) {
    const frame = this.getCurrentFrame();
    if (!frame.complete || frame.naturalWidth === 0) return;
    const drawX = this.x + (this.width - frame.naturalWidth) / 2;
    const drawY = this.y + this.height - frame.naturalHeight + GROUND_SINK_PX;
    ctx.drawImage(frame, Math.round(drawX), Math.round(drawY));
  }
}
