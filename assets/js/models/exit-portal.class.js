import { gameLoop } from "./game-loop.class.js";
import { DrawableObject } from "./drawable-object.class.js";

const FRAME_COUNT = 8;
const FRAME_DURATION_MS = 100;
const GROUND_SINK_PX = 8;
const NORMAL_FRAME_PATHS = getFramePaths("normal");
const BOSS_FRAME_PATHS = getFramePaths("boss");

function getFramePaths(type) {
  return Array.from({ length: FRAME_COUNT }, (_, index) => `assets/images/exit/portal_${type}_${index + 1}.webp`);
}

export class ExitPortal extends DrawableObject {
  isBossExit = false;
  framePaths = NORMAL_FRAME_PATHS;

  constructor({ x, y, width, height }, isBossExit = false) {
    super();
    this.isBossExit = isBossExit;
    this.framePaths = isBossExit ? BOSS_FRAME_PATHS : NORMAL_FRAME_PATHS;
    this.loadImages(this.framePaths);
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  getCurrentFrame() {
    const frameIndex = Math.floor(gameLoop.now() / FRAME_DURATION_MS) % this.framePaths.length;
    return this.imageCache[this.framePaths[frameIndex]];
  }

  draw(ctx) {
    const frame = this.getCurrentFrame();
    if (!frame.complete || frame.naturalWidth === 0) return;
    const drawX = this.x + (this.width - frame.naturalWidth) / 2;
    const drawY = this.y + this.height - frame.naturalHeight + GROUND_SINK_PX;
    ctx.drawImage(frame, Math.round(drawX), Math.round(drawY));
  }
}
