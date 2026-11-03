import { gameLoop } from "./game-loop.class.js";
import { DrawableObject } from "./drawable-object.class.js";

const FRAME_PATHS = Array.from({ length: 6 }, (_, index) => `assets/images/healing_plant/healing_plant_${index + 1}.webp`);
const FRAME_DURATION_MS = 130;
const GROUND_SINK_PX = 4;
const FRUIT_HEIGHT_PX = 44;

export class HealingPlant extends DrawableObject {
  isCollected = false;

  constructor({ x, y, width, height }) {
    super();
    this.loadImages(FRAME_PATHS);
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  getFruitCenter() {
    return { x: this.x + this.width / 2, y: this.y + this.height + GROUND_SINK_PX - FRUIT_HEIGHT_PX };
  }

  draw(ctx) {
    const frame = this.imageCache[FRAME_PATHS[Math.floor(gameLoop.now() / FRAME_DURATION_MS) % FRAME_PATHS.length]];
    if (!frame.complete || frame.naturalWidth === 0) return;
    const drawX = this.x + (this.width - frame.naturalWidth) / 2;
    const drawY = this.y + this.height - frame.naturalHeight + GROUND_SINK_PX;
    ctx.drawImage(frame, Math.round(drawX), Math.round(drawY));
  }
}
