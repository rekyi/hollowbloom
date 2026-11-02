import { DrawableObject } from "./drawable-object.class.js";

const KEY_IMAGE = "assets/images/8_items/gold_key.webp";
const BOSS_KEY_IMAGE = "assets/images/8_items/ancient_key.webp";

export class KeyItem extends DrawableObject {
  isCollected = false;
  isBossKey = false;

  constructor({ x, y, width, height }, isBossKey = false) {
    super();
    this.isBossKey = isBossKey;
    this.loadImage(isBossKey ? BOSS_KEY_IMAGE : KEY_IMAGE);
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }
}
