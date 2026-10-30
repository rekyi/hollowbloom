import { DrawableObject } from "./drawable-object.class.js";

export class KeyItem extends DrawableObject {
  isCollected = false;

  constructor({ x, y, width, height }) {
    super();
    this.loadImage("assets/images/8_items/gold_key.png");
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }
}
