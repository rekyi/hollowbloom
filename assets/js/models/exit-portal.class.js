import { gameLoop } from "./game-loop.class.js";
import { DrawableObject } from "./drawable-object.class.js";

const FRAME_COUNT = 7;
const FRAME_DURATION_MS = 100;
const FRAME_PATHS = Array.from({ length: FRAME_COUNT }, (_, index) => `assets/images/exit/portal1_frame_${index + 1}.png`);

export class ExitPortal extends DrawableObject {
  constructor({ x, y, width, height }) {
    super();
    this.loadImages(FRAME_PATHS);
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  getCurrentFrame() {
    const frameIndex = Math.floor(gameLoop.now() / FRAME_DURATION_MS) % FRAME_PATHS.length;
    return this.imageCache[FRAME_PATHS[frameIndex]];
  }

  draw(ctx) {
    const frame = this.getCurrentFrame();
    if (!frame.complete || frame.naturalWidth === 0) return;
    ctx.drawImage(frame, this.x, this.y, this.width, this.height);
  }
}
