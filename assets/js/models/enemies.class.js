class Enemy extends MoveableObject {
  IMAGES_IDLE = [];
  IMAGES_MOVING = [];
  IMAGES_HURT = [];
  IMAGES_DEAD = [];
  IMAGES_ATTACK = [];

  constructor() {
    super();
    this.movementDirection = -1;
    this.oppositeDirection = true;
    this.canMove = true;
    this.isMoving = this.canMove;
    this.currentAnimation = "";
    this.deathAnimationFinished = false;
    this.isAttacking = false;
    this.attackHitRegistered = false;
    this.attackCooldown = 3000;
    this.attackOffset = this.offset;
    this.attackReach = 0;
    this.attackHitFrame = 0;
    this.isAggro = false;
    this.isReturning = false;
    this.aggroRange = 300;
    this.target = null;
  }

  updateAggro() {
    if (!this.target || this.isDead()) return;
    const dx = this.target.x + this.target.width / 2 - (this.x + this.width / 2);
    const dy = this.target.y + this.target.height / 2 - (this.y + this.height / 2);
    const distance = Math.hypot(dx, dy);
    if (!this.isAggro && distance <= this.aggroRange) {
      this.isAggro = true;
      this.isReturning = false;
    } else if (this.isAggro && distance > this.aggroRange) {
      this.resetToSpawn();
    }
  }

  chase() {
    const dx = this.target.x - this.x;
    this.isMoving = Math.abs(dx) > this.speed;
    if (!this.isMoving) return;
    this.oppositeDirection = dx < 0;
    this.x += Math.sign(dx) * this.speed;
  }

  resetToSpawn() {
    this.isAggro = false;
    this.isAttacking = false;
    this.isReturning = true;
  }

  returnToSpawn() {
    const [spawnX, spawnY] = this.spawnArgs;
    const dx = spawnX - this.x;
    const dy = spawnY - this.y;
    const distance = Math.hypot(dx, dy);
    if (distance <= this.speed) {
      this.setPosition(...this.spawnArgs);
      this.isReturning = false;
      this.isMoving = this.canMove;
      return;
    }
    this.isMoving = true;
    this.oppositeDirection = dx < 0;
    this.x += (dx / distance) * this.speed;
    this.y += (dy / distance) * this.speed;
  }

  getHitbox() {
    const offset = this.offset;
    const left = this.oppositeDirection ? offset.right : offset.left;
    const right = this.oppositeDirection ? offset.left : offset.right;
    return {
      x: this.x + left,
      y: this.y + offset.top,
      width: this.width - left - right,
      height: this.height - offset.top - offset.bottom,
    };
  }

  getAttackHitbox() {
    if (this.currentImage < this.attackHitFrame) return this.getHitbox();

    const left = this.oppositeDirection ? this.attackOffset.right : this.attackOffset.left;
    const right = this.oppositeDirection ? this.attackOffset.left : this.attackOffset.right;
    const hitbox = {
      x: this.x + left,
      y: this.y + this.attackOffset.top,
      width: this.width - left - right,
      height: this.height - this.attackOffset.top - this.attackOffset.bottom,
    };
    if (this.oppositeDirection) {
      return { ...hitbox, x: hitbox.x - this.attackReach, width: hitbox.width + this.attackReach };
    }
    return { ...hitbox, width: hitbox.width + this.attackReach };
  }

  startAttackCycle() {
    gameLoop.runEvery(this.attackCooldown, () => {
      if (this.isAggro && !this.isDead() && !this.isAttacking && !this.gettingHit() && this.IMAGES_ATTACK.length) {
        this.isAttacking = true;
        this.attackHitRegistered = false;
      }
    });
  }

  setPosition(x, y, width, height, speed, minX, maxX) {
    if (!this.spawnArgs) this.spawnArgs = [x, y, width, height, speed, minX, maxX];
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
    this.startAttackCycle();
  }
  animation() {
    gameLoop.runEvery(1000 / 60, () => {
      this.updateAggro();
      if (this.isAggro && !this.isDead()) {
        if (!this.isAttacking && !this.gettingHit()) this.chase();
        return;
      }
      if (this.isReturning && !this.isDead()) {
        this.returnToSpawn();
        return;
      }
      if (this.canMove && this.isMoving && !this.isDead() && !this.isAttacking) {
        this.x += this.speed * this.movementDirection;
        this.oppositeDirection = this.movementDirection < 0;

        if (this.x <= this.minX || this.x >= this.maxX) {
          this.x = Math.max(this.minX, Math.min(this.maxX, this.x));
          this.isMoving = false;
          gameLoop.runOnceAfter(500, () => {
            if (this.isDead() || this.isAggro || this.isReturning) return;
            this.movementDirection *= -1;
            this.isMoving = true;
          });
        }
      }
    });

    gameLoop.runEvery(120, () => {
      if (this.isDead()) {
        this.playDeathAnimation();
        return;
      }

      if (this.isAttacking && this.currentAnimation === "attack" && this.currentImage >= this.IMAGES_ATTACK.length) {
        this.isAttacking = false;
      }

      let state = "idle";
      let images = this.IMAGES_IDLE;

      if (this.gettingHit() && this.IMAGES_HURT.length) {
        this.isAttacking = false;
        state = "hurt";
        images = this.IMAGES_HURT;
      } else if (this.isAttacking) {
        state = "attack";
        images = this.IMAGES_ATTACK;
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
    });
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
    this.IMAGES_ATTACK = this.loadSpriteSheet(base + "attack_bite.png", 12, 70);
    this.setPosition(650, 382, 90, 90, 1.5, 550, 1000);
    this.offset = { top: 32, right: 10, bottom: 32, left: 5 };
    this.attackOffset = { top: 20, right: 0, bottom: 20, left: 0 };
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
    this.IMAGES_FLY_TO_FALL = this.loadSpriteSheet(base + "fly_to_fall.png", 3, 87);
    this.IMAGES_FALL = this.loadSpriteSheet(base + "fall.png", 5, 87);
    this.IMAGES_ATTACK = this.loadSpriteSheet(base + "attack.png", 11, 87);
    this.setPosition(1050, 290, 100, 100, 1.5, 900, 1500);
    this.offset = { top: 18, right: 7, bottom: 18, left: 16 };
    this.attackOffset = { top: 10, right: 0, bottom: 10, left: 8 };
    this.groundY = 382;
    this.fallSpeed = 4;
    this.transitionDone = false;
    this.start();
    gameLoop.runEvery(1000 / 60, () => {
      if (this.isDead() && this.transitionDone && this.y < this.groundY) {
        this.y = Math.min(this.groundY, this.y + this.fallSpeed);
      }
    });
  }

  playDeathAnimation() {
    if (this.y < this.groundY) {
      if (this.currentAnimation !== "falling") {
        this.currentAnimation = "falling";
        this.currentImage = 0;
        this.isMoving = false;
      }
      if (this.currentImage < this.IMAGES_FLY_TO_FALL.length) {
        this.img = this.imageCache[this.IMAGES_FLY_TO_FALL[this.currentImage]];
        this.currentImage++;
        return;
      }
      this.transitionDone = true;
      this.playAnimation(this.IMAGES_FALL);
      return;
    }
    super.playDeathAnimation();
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
    this.IMAGES_ATTACK = this.loadSpriteSheet(base + "attack.png", 19, 156);
    this.setPosition(1350, 230, 400, 400, 1, 1350, 1750);
    this.offset = { top: 86, right: 120, bottom: 88, left: 110 };
    this.attackOffset = { top: 60, right: 40, bottom: 80, left: 50 };
    this.attackHitFrame = this.IMAGES_ATTACK.length - 8;
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
    this.IMAGES_ATTACK = this.loadSpriteSheet(base + "attack_2.png", 13, 146);
    this.setPosition(1850, 298, 250, 250, 1, 1750, 2150);
    this.offset = { top: 84, right: 75, bottom: 108, left: 94 };
    this.attackOffset = this.offset;
    this.attackReach = 65;
    this.start();
  }
}
