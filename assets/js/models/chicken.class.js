class Chicken extends MoveableObect {
  constructor() {
    super();
    this.loadImage("assets/images/3_enemies_chicken/chicken_normal/1_walk/1_w.png");

    this.x = 250 + Math.random() * 350;
  }
}
