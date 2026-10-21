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

  IMAGES_HURT = ["assets/images/2_character_pepe/4_hurt/H-41.png", "assets/images/2_character_pepe/4_hurt/H-42.png", "assets/images/2_character_pepe/4_hurt/H-43.png"];

  IMAGES_DEAD = [
    "assets/images/2_character_pepe/5_dead/D-51.png",
    "assets/images/2_character_pepe/5_dead/D-52.png",
    "assets/images/2_character_pepe/5_dead/D-53.png",
    "assets/images/2_character_pepe/5_dead/D-54.png",
    "assets/images/2_character_pepe/5_dead/D-55.png",
    "assets/images/2_character_pepe/5_dead/D-56.png",
    "assets/images/2_character_pepe/5_dead/D-57.png",
  ];

  world;

  constructor() {
    super();
    this.loadImage("assets/images/2_character_pepe/2_walk/W-21.png");
    this.loadImages(this.IMAGES_WALKING);
    this.loadImages(this.IMAGES_JUMPING);
    this.loadImages(this.IMAGES_DEAD);
    this.loadImages(this.IMAGES_HURT);
    this.animation();
    this.gravity();
  }

  animation() {
    setInterval(() => {
      if (this.world.keyboard.RIGHT && this.x < this.world.level.level_end_x) {
        this.moveRight();
      }
      if (this.world.keyboard.LEFT && this.x > 0) {
        this.moveLeft();
      }

      if (this.world.keyboard.SPACE && !this.isAboveGround()) {
        this.jump();
      }

      this.world.camera_x = -this.x;
    }, 1000 / 60); // is it worth it to increase the fps in this case (120/144)?

    setInterval(() => {
      if (this.isHurt()) {
        this.playAnimation(this.IMAGES_HURT);
      } else if (this.isDead()) {
        this.playAnimation(this.IMAGES_DEAD);
      } else if (this.isAboveGround()) {
        this.playAnimation(this.IMAGES_JUMPING);
      } else {
        if (this.world.keyboard.RIGHT || this.world.keyboard.LEFT) {
          this.playAnimation(this.IMAGES_WALKING);
        }
      }
    }, 25);
  }
}
