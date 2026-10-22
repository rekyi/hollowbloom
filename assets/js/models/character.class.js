class Character extends MoveableObject {
  width = 200;
  height = 200;
  y = 15;
  offset = { top: 80, right: 75, bottom: 0, left: 50 };
  speed = 7;
  walkSpeed = 7;
  runSpeedFactor = 2;
  IMAGES_WALKING;
  IMAGES_RUNNING;
  IMAGES_JUMPING;
  IMAGES_HURT;
  IMAGES_DEAD;

  world;
  deathStarted = false;

  constructor() {
    super();
    const base = "assets/images/character/male/";
    this.IMAGES_WALKING = this.loadSpriteSheet(base + "Walk.png", 7);
    this.IMAGES_RUNNING = this.loadSpriteSheet(base + "Run.png", 8);
    this.IMAGES_JUMPING = this.loadSpriteSheet(base + "Jump.png", 11);
    this.IMAGES_HURT = this.loadSpriteSheet(base + "Hurt.png", 4);
    this.IMAGES_DEAD = this.loadSpriteSheet(base + "Dead.png", 4);
    this.img = this.imageCache[this.IMAGES_JUMPING[0]];
    this.animation();
    this.gravity();
  }

  animation() {
    setInterval(() => {
      if (this.isDead()) return;
      this.speed = this.world.keyboard.SHIFT ? this.walkSpeed * this.runSpeedFactor : this.walkSpeed;
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
      if (this.isDead()) {
        if (!this.deathStarted) {
          this.deathStarted = true;
          this.currentImage = 0;
        }
        if (this.currentImage < this.IMAGES_DEAD.length * 4) {
          this.img = this.imageCache[this.IMAGES_DEAD[Math.floor(this.currentImage / 4)]];
          this.currentImage++;
        }
      } else if (this.gettingHit()) {
        this.playAnimation(this.IMAGES_HURT);
      } else if (this.isAboveGround()) {
        this.playAnimation(this.IMAGES_JUMPING);
      } else {
        if (this.world.keyboard.RIGHT || this.world.keyboard.LEFT) {
          this.playAnimation(this.world.keyboard.SHIFT ? this.IMAGES_RUNNING : this.IMAGES_WALKING);
        } else {
          this.img = this.imageCache[this.IMAGES_JUMPING[0]];
          this.currentImage = 0;
        }
      }
    }, 25);
  }
}
