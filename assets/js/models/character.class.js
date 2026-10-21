class Character extends MoveableObject {
  width = 160;
  height = 320;
  y = 115;
  speed = 7;
  IMAGES_WALKING = [
    "assets/images/2_character_pepe/2_walk/W-21.png",
    "assets/images/2_character_pepe/2_walk/W-22.png",
    "assets/images/2_character_pepe/2_walk/W-23.png",
    "assets/images/2_character_pepe/2_walk/W-24.png",
    "assets/images/2_character_pepe/2_walk/W-25.png",
    "assets/images/2_character_pepe/2_walk/W-26.png",
  ];
  world;

  constructor() {
    super();
    this.loadImage("assets/images/2_character_pepe/2_walk/W-21.png");
    this.loadImages(this.IMAGES_WALKING);
    this.animation();
  }

  animation() {
    setInterval(() => {
      if (this.world.keyboard.RIGHT) {
        this.x += this.speed;
      }
      if (this.world.keyboard.LEFT) {
        this.x -= this.speed;
      }
    }, 1000 / 60); // is it worth it to increase the fps in this case (120/144)?

    setInterval(() => {
      if (this.world.keyboard.RIGHT || this.world.keyboard.LEFT) {
        const i = this.currentImage % this.IMAGES_WALKING.length;
        const path = this.IMAGES_WALKING[i];
        this.img = this.imageCache[path];
        this.currentImage++;
      }
    }, 25);
  }

  jump() {}
}
