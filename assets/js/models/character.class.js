class Character extends MoveableObject {
  width = 200;
  height = 200;
  y = 15;
  offset = { top: 80, right: 75, bottom: 0, left: 50 };
  speed = 7;
  walkSpeed = 7;
  runSpeedFactor = 1.5;
  IMAGES_WALKING;
  IMAGES_RUNNING;
  IMAGES_IDLE;
  IMAGES_IDLE_LONG;
  idleSince = Date.now();
  lastIdleFrame = 0;
  idleLongFrame = 0;
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
    this.IMAGES_IDLE = this.loadSpriteSheet(base + "Idle.png", 6);
    this.IMAGES_IDLE_LONG = this.loadSpriteSheet(base + "Idle_long.png", 5);
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
      const k = this.world.keyboard;
      if (k.LEFT || k.RIGHT || k.SPACE || this.isAboveGround() || this.gettingHit()) {
        this.idleSince = Date.now();
        this.idleLongFrame = 0;
      }
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
        this.playJump();
      } else {
        if (this.world.keyboard.RIGHT || this.world.keyboard.LEFT) {
          this.playAnimation(this.world.keyboard.SHIFT ? this.IMAGES_RUNNING : this.IMAGES_WALKING);
        } else {
          const idleTime = Date.now() - this.idleSince;
          if (idleTime >= 10000) {
            this.playIdleLong();
          } else if (idleTime >= 3000) {
            this.playIdle(this.IMAGES_IDLE);
          } else {
            this.img = this.imageCache[this.IMAGES_JUMPING[0]];
            this.currentImage = 0;
          }
        }
      }
    }, 25);
  }

  playJump() {
    const progress = (20 - this.speedY) / 40;
    const frame = Math.floor(progress * this.IMAGES_JUMPING.length);
    this.img = this.imageCache[this.IMAGES_JUMPING[Math.max(0, Math.min(frame, this.IMAGES_JUMPING.length - 1))]];
  }

  playIdleLong() {
    this.img = this.imageCache[this.IMAGES_IDLE_LONG[this.idleLongFrame]];
    if (Date.now() - this.lastIdleFrame < 150) return;
    this.lastIdleFrame = Date.now();
    if (this.idleLongFrame < this.IMAGES_IDLE_LONG.length - 1) this.idleLongFrame++;
  }

  playIdle(images) {
    if (Date.now() - this.lastIdleFrame < 150) return;
    this.lastIdleFrame = Date.now();
    this.playAnimation(images);
  }
}
