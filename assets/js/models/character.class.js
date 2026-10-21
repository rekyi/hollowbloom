class Character extends MoveableObject {
  width = 160;
  height = 320;
  y = 15;
  speed = 7;
  IMAGES_WALKING = [
    "assets/images/2_character_pepe/2_walk/W-21.png",
    "assets/images/2_character_pepe/2_walk/W-22.png",
    "assets/images/2_character_pepe/2_walk/W-23.png",
    "assets/images/2_character_pepe/2_walk/W-24.png",
    "assets/images/2_character_pepe/2_walk/W-25.png",
    "assets/images/2_character_pepe/2_walk/W-26.png",
  ];

  IMAGES_JUMPING = [
    "assets/images/2_character_pepe/3_jump/J-31.png",
    "assets/images/2_character_pepe/3_jump/J-32.png",
    "assets/images/2_character_pepe/3_jump/J-33.png",
    "assets/images/2_character_pepe/3_jump/J-34.png",
    "assets/images/2_character_pepe/3_jump/J-35.png",
    "assets/images/2_character_pepe/3_jump/J-36.png",
    "assets/images/2_character_pepe/3_jump/J-37.png",
    "assets/images/2_character_pepe/3_jump/J-38.png",
    "assets/images/2_character_pepe/3_jump/J-39.png",
  ];
  world;

  constructor() {
    super();
    this.loadImage("assets/images/2_character_pepe/2_walk/W-21.png");
    this.loadImages(this.IMAGES_WALKING);
    this.loadImages(this.IMAGES_JUMPING);
    this.animation();
    this.gravity();
  }

  animation() {
    setInterval(() => {
      if (this.world.keyboard.RIGHT && this.x < this.world.level.level_end_x) {
        this.x += this.speed;
        this.oppositeDirection = false;
      }
      if (this.world.keyboard.LEFT && this.x > 0) {
        this.x -= this.speed;
        this.oppositeDirection = true + 100;
      }

      this.world.camera_x = -this.x;
    }, 1000 / 60); // is it worth it to increase the fps in this case (120/144)?

    setInterval(() => {
      if (this.isAboveGround()) {
        this.playAnimation(this.IMAGES_JUMPING);
      } else {
        if (this.world.keyboard.RIGHT || this.world.keyboard.LEFT) {
          this.playAnimation(this.IMAGES_WALKING);
        }
      }
    }, 25);
  }

  jump() {
    if (!this.isAboveGround()) {
      this.speedY = 30;
    }
  }
}
