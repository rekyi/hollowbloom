import { gameLoop } from "./game-loop.class.js";
import { Enemy } from "./enemy.class.js";
import { Boar } from "./boar.class.js";
import { Skeleton } from "./skeleton.class.js";
import { DarkElf } from "./dark-elf.class.js";

export { Enemy, Boar, Skeleton, DarkElf };

export class Rat extends Enemy {
  constructor() {
    super();
    const base = "assets/images/3_enemies/rat/";
    this.IMAGES_IDLE = this.loadSpriteSheet(base + "idle.png", 10, 70);
    this.IMAGES_MOVING = this.loadSpriteSheet(base + "run.png", 8, 70);
    this.IMAGES_HURT = this.loadSpriteSheet(base + "hurt.png", 3, 70);
    this.IMAGES_DEAD = this.loadSpriteSheet(base + "rat_death.png", 6, 70);
    this.IMAGES_ATTACK = this.loadSpriteSheet(base + "attack_bite.png", 12, 70);
    this.setPosition(650, 382, 90, 90, 1.5, 550, 1000);
    this.offset = { top: 32, right: 10, bottom: 32, left: 5 };
    this.attackOffset = { top: 20, right: 0, bottom: 20, left: 0 };
    this.attackHitStartFrame = 8;
    this.start();
  }
}

export class Bat extends Enemy {
  groundY = 382;
  fallSpeed = 4;
  isTransitionDone = false;

  constructor() {
    super();
    this.loadSprites();
    this.setPosition(1050, 290, 100, 100, 1.5, 900, 1500);
    this.offset = { top: 18, right: 7, bottom: 18, left: 16 };
    this.attackOffset = { top: 10, right: 0, bottom: 10, left: 8 };
    this.attackHitStartFrame = 8;
    this.start();
    gameLoop.runEvery(1000 / 60, () => this.fallAfterDeath());
  }

  loadSprites() {
    const base = "assets/images/3_enemies/bat/";
    this.IMAGES_IDLE = this.loadSpriteSheet(base + "fly.png", 11, 87);
    this.IMAGES_MOVING = this.loadSpriteSheet(base + "fly.png", 11, 87);
    this.IMAGES_HURT = this.loadSpriteSheet(base + "hurt.png", 3, 87);
    this.IMAGES_DEAD = this.loadSpriteSheet(base + "death.png", 4, 87);
    this.IMAGES_FLY_TO_FALL = this.loadSpriteSheet(base + "fly_to_fall.png", 3, 87);
    this.IMAGES_FALL = this.loadSpriteSheet(base + "fall.png", 5, 87);
    this.IMAGES_ATTACK = this.loadSpriteSheet(base + "attack.png", 11, 87);
  }

  fallAfterDeath() {
    if (this.isDead() && this.isTransitionDone && this.y < this.groundY) {
      this.y = Math.min(this.groundY, this.y + this.fallSpeed);
    }
  }

  playDeathAnimation() {
    if (this.y >= this.groundY) {
      super.playDeathAnimation();
      return;
    }
    if (this.currentAnimation !== "falling") this.startFalling();
    if (this.currentImage < this.IMAGES_FLY_TO_FALL.length) this.playFlyToFall();
    else this.playFall();
  }

  startFalling() {
    this.currentAnimation = "falling";
    this.currentImage = 0;
    this.isMoving = false;
  }

  playFlyToFall() {
    this.img = this.imageCache[this.IMAGES_FLY_TO_FALL[this.currentImage]];
    this.currentImage++;
  }

  playFall() {
    this.isTransitionDone = true;
    this.playAnimation(this.IMAGES_FALL);
  }
}

export class Slime extends Enemy {
  constructor() {
    super();
    const base = "assets/images/3_enemies/slime/";
    this.IMAGES_IDLE = this.loadSpriteSheet(base + "idle.png", 14, 156);
    this.IMAGES_MOVING = this.loadSpriteSheet(base + "walk.png", 6, 156);
    this.IMAGES_HURT = this.loadSpriteSheet(base + "hurt.png", 3, 156);
    this.IMAGES_DEAD = this.loadSpriteSheet(base + "death.png", 11, 156);
    this.IMAGES_ATTACK = this.loadSpriteSheet(base + "attack.png", 19, 156);
    this.setPosition(1350, 230, 400, 400, 1, 1350, 1750);
    this.offset = { top: 86, right: 120, bottom: 88, left: 110 };
    this.attackOffset = { top: 60, right: 40, bottom: 80, left: 50 };
    this.attackHitStartFrame = this.IMAGES_ATTACK.length - 8;
    this.attackHitEndFrame = this.IMAGES_ATTACK.length - 1;
    this.start();
  }
}

export class Mimic extends Enemy {
  constructor() {
    super();
    const base = "assets/images/3_enemies/mimic/";
    this.IMAGES_IDLE = this.loadSpriteSheet(base + "idle_transformed.png", 9, 146);
    this.IMAGES_MOVING = this.loadSpriteSheet(base + "walk.png", 6, 146);
    this.IMAGES_HURT = this.loadSpriteSheet(base + "hurt.png", 3, 146);
    this.IMAGES_DEAD = this.loadSpriteSheet(base + "death.png", 6, 146);
    this.IMAGES_ATTACK = this.loadSpriteSheet(base + "attack_2.png", 13, 146);
    this.setPosition(1850, 298, 250, 250, 1, 1750, 2150);
    this.offset = { top: 84, right: 75, bottom: 108, left: 94 };
    this.attackOffset = this.offset;
    this.attackHitStartFrame = 10;
    this.attackReach = 65;
    this.start();
  }
}
