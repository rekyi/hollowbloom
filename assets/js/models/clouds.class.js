class Clouds extends MoveableObect {
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
    setInterval(() => {
      this.x -= 0.15;
    }, 1000 / 60);
  }
}
