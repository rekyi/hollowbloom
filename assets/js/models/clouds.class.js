import { MoveableObject } from "./movable-object.class.js";

export class Clouds extends MoveableObject {
  y = 20;
  width = 400;
  height = 150;

  constructor() {
    super();
    this.loadImage("assets/images/5_background/layers/4_clouds/1.png");
    this.x = 0 + Math.random() * 350;
    this.animation();
  }

  animation() {
    this.moveLeft();
  }
}
