class Chicken extends MoveableObect {
  y = 365;
  IMAGES_WALKING = [
    "assets/images/3_enemies_chicken/chicken_normal/1_walk/1_w.png",
    "assets/images/3_enemies_chicken/chicken_normal/1_walk/2_w.png",
    "assets/images/3_enemies_chicken/chicken_normal/1_walk/3_w.png",
  ];
  constructor() {
    super();
    this.loadImage("assets/images/3_enemies_chicken/chicken_normal/1_walk/1_w.png");
    this.loadImages(this.IMAGES_WALKING);
    this.x = 250 + Math.random() * 350;
    this.animation();
    this.speed = 0.15 + Math.random() * 0.25;
  }

  animation() {
    this.moveLeft();
    setInterval(() => {
      const i = this.currentImage % this.IMAGES_WALKING.length;
      const path = this.IMAGES_WALKING[i];
      this.img = this.imageCache[path];
      this.currentImage++;
    }, 200);
  }
}
