import { DrawableObject } from "./drawable-object.class.js";

const KEY_IMAGE = "assets/images/items/gold_key.webp";
const BOSS_KEY_IMAGE = "assets/images/items/ancient_key.webp";

/** Collectible key that unlocks an exit portal. */
export class KeyItem extends DrawableObject {
  isCollected = false;
  isBossKey = false;

  /**
   * @param {{x: number, y: number, width: number, height: number}} box - Position and size of the key.
   * @param {boolean} [isBossKey=false] - Whether this is the ancient boss key.
   */
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
