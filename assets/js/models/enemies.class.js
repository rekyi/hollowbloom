class Enemy extends MoveableObject {
  IMAGES_IDLE = [];
  IMAGES_MOVING = [];
  IMAGES_HURT = [];
  IMAGES_DEAD = [];

  constructor() {
    super();
    this.movementDirection = -1;
    this.oppositeDirection = true;
    this.canMove = false; // auf true setzen, um die Patrouille zu aktivieren
    this.isMoving = this.canMove;
    this.currentAnimation = "";
    this.deathAnimationFinished = false;
  }

  setPosition(x, y, width, height, speed, minX, maxX) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.speed = speed;
    this.minX = minX;
    this.maxX = maxX;
  }

  start() {
    this.img = this.imageCache[this.IMAGES_IDLE[0]];
    this.animation();
  }
  animation() {
    setInterval(() => {
      if (this.canMove && this.isMoving && !this.isDead()) {
        this.x += this.speed * this.movementDirection;
        this.oppositeDirection = this.movementDirection < 0;

        if (this.x <= this.minX || this.x >= this.maxX) {
          this.x = Math.max(this.minX, Math.min(this.maxX, this.x));
          this.isMoving = false;
          setTimeout(() => {
            if (this.isDead()) return;
            this.movementDirection *= -1;
            this.isMoving = true;
          }, 500);
        }
      }
    }, 1000 / 60);

    setInterval(() => {
      if (this.isDead()) {
        this.playDeathAnimation();
        return;
      }

      let state = "idle";
      let images = this.IMAGES_IDLE;

      if (this.gettingHit() && this.IMAGES_HURT.length) {
        state = "hurt";
        images = this.IMAGES_HURT;
      } else if (this.isMoving) {
        state = "moving";
        images = this.IMAGES_MOVING;
      }

      if (this.currentAnimation !== state) {
        this.currentAnimation = state;
        this.currentImage = 0;
      }
      if (state === "idle") this.playIdle();
      else this.playAnimation(images);
    }, 120);
  }

  playIdle() {
    this.playAnimation(this.IMAGES_IDLE);
  }

  playDeathAnimation() {
    if (this.currentAnimation !== "dead") {
      this.currentAnimation = "dead";
      this.currentImage = 0;
      this.isMoving = false;
    }

    if (this.currentImage < this.IMAGES_DEAD.length) {
      this.img = this.imageCache[this.IMAGES_DEAD[this.currentImage]];
      this.currentImage++;
    } else {
      this.deathAnimationFinished = true;
    }
  }
}

class Rat extends Enemy {
  constructor() {
    super();
    const base = "assets/images/3_enemies/Rat/";
    this.IMAGES_IDLE = this.loadSpriteSheet(base + "idle.png", 10, 70);
    this.IMAGES_MOVING = this.loadSpriteSheet(base + "run.png", 8, 70);
    this.IMAGES_HURT = this.loadSpriteSheet(base + "hurt.png", 3, 70);
    this.IMAGES_DEAD = this.loadSpriteSheet(base + "rat-death.png", 6, 70);
    this.setPosition(650, 382, 90, 90, 1.5, 550, 1000);
    this.offset = { top: 32, right: 10, bottom: 32, left: 5 };
    this.start();
  }
}

class Bat extends Enemy {
  constructor() {
    super();
    const base = "assets/images/3_enemies/Bat/";
    this.IMAGES_IDLE = this.loadSpriteSheet(base + "fly.png", 11, 87);
    this.IMAGES_MOVING = this.loadSpriteSheet(base + "fly.png", 11, 87);
    this.IMAGES_HURT = this.loadSpriteSheet(base + "hurt.png", 3, 87);
    this.IMAGES_DEAD = this.loadSpriteSheet(base + "death.png", 4, 87);
    this.setPosition(1050, 290, 100, 100, 1.5, 900, 1500);
    this.offset = { top: 18, right: 7, bottom: 18, left: 16 };
    this.start();
  }
}

class Slime extends Enemy {
  constructor() {
    super();
    const base = "assets/images/3_enemies/Slime/";
    this.IMAGES_IDLE = this.loadSpriteSheet(base + "idle.png", 14, 156);
    this.IMAGES_MOVING = this.loadSpriteSheet(base + "walk.png", 6, 156);
    this.IMAGES_HURT = this.loadSpriteSheet(base + "hurt.png", 3, 156);
    this.IMAGES_DEAD = this.loadSpriteSheet(base + "death.png", 11, 156);
    this.setPosition(1450, 330, 200, 200, 1, 1350, 1750);
    this.offset = { top: 86, right: 72, bottom: 88, left: 69 };
    this.start();
  }
}

class Mimic extends Enemy {
  constructor() {
    super();
    const base = "assets/images/3_enemies/Mimic/";
    this.IMAGES_IDLE = this.loadSpriteSheet(base + "idle_transformed.png", 9, 146);
    this.IMAGES_MOVING = this.loadSpriteSheet(base + "walk.png", 6, 146);
    this.IMAGES_HURT = this.loadSpriteSheet(base + "hurt.png", 3, 146);
    this.IMAGES_DEAD = this.loadSpriteSheet(base + "death.png", 6, 146);
    this.setPosition(1850, 298, 250, 250, 1, 1750, 2150);
    this.offset = { top: 84, right: 75, bottom: 108, left: 94 };
    this.start();
  }
}
