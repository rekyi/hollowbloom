import { gameLoop } from "./game-loop.class.js";
import { MoveableObject } from "./movable-object.class.js";
import { playSfx } from "../sfx.js";

export class Enemy extends MoveableObject {
  IMAGES_IDLE = [];
  IMAGES_MOVING = [];
  IMAGES_HURT = [];
  IMAGES_DEAD = [];
  IMAGES_ATTACK = [];
  hp = 2;
  movementDirection = -1;
  isOppositeDirection = true;
  isMovable = true;
  isMoving = this.isMovable;
  currentAnimation = "";
  isDeathAnimationFinished = false;
  attackCooldown = 3000;
  nextAttackAt = Number.NEGATIVE_INFINITY;
  attackOffset = this.offset;
  attackReach = 0;
  isAggro = false;
  isReturning = false;
  aggroRange = 300;
  target = null;
  drawHitbox = true;

  updateAggro() {
    if (!this.target || this.isDead()) return;
    const distance = this.getDistanceToTarget();
    if (!this.isAggro && distance <= this.aggroRange) {
      this.isAggro = true;
      this.isReturning = false;
    } else if (this.isAggro && distance > this.aggroRange) {
      this.resetToSpawn();
    }
  }

  getDistanceToTarget() {
    const dx = this.target.x + this.target.width / 2 - (this.x + this.width / 2);
    const dy = this.target.y + this.target.height / 2 - (this.y + this.height / 2);
    return Math.hypot(dx, dy);
  }

  chase() {
    this.faceTarget();
    const targetHitbox = this.target.getHitbox();
    const attackHitbox = this.getAttackHitbox();
    if (this.hitboxesOverlap(targetHitbox, attackHitbox)) {
      this.isMoving = false;
      return;
    }
    this.moveTowards(targetHitbox, attackHitbox);
  }

  moveTowards(targetHitbox, attackHitbox) {
    const direction = this.isOppositeDirection ? -1 : 1;
    const distance = direction < 0 ? attackHitbox.x - (targetHitbox.x + targetHitbox.width) : targetHitbox.x - (attackHitbox.x + attackHitbox.width);
    const movement = Math.min(this.speed, Math.max(0, distance) + 1);
    this.isMoving = movement > 0;
    this.x += direction * movement;
  }

  hit() {
    if (!super.hit()) return false;
    playSfx(this.isDead() ? "enemyDeath" : "enemyHit");
    const targetCenter = this.target ? this.target.x + this.target.width / 2 : this.x;
    this.knockbackDirection = this.x + this.width / 2 < targetCenter ? -1 : 1;
    this.knockbackFrames = 6;
    return true;
  }

  faceTarget() {
    const enemyCenter = this.x + this.width / 2;
    const targetCenter = this.target.x + this.target.width / 2;
    this.isOppositeDirection = targetCenter < enemyCenter;
  }

  hitboxesOverlap(a, b) {
    return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
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
    if (distance <= this.speed) this.arriveAtSpawn();
    else this.stepToSpawn(dx, dy, distance);
  }

  arriveAtSpawn() {
    this.setPosition(...this.spawnArgs);
    this.isReturning = false;
    this.isMoving = this.isMovable;
  }

  stepToSpawn(dx, dy, distance) {
    this.isMoving = true;
    this.isOppositeDirection = dx < 0;
    this.x += (dx / distance) * this.speed;
    this.y += (dy / distance) * this.speed;
  }

  getAttackHitbox() {
    const hitbox = this.getHitboxFor(this.attackOffset);
    if (this.isOppositeDirection) {
      return { ...hitbox, x: hitbox.x - this.attackReach, width: hitbox.width + this.attackReach };
    }
    return { ...hitbox, width: hitbox.width + this.attackReach };
  }

  startAttackCycle() {
    gameLoop.runEvery(1000 / 60, () => this.tryStartAttack());
  }

  tryStartAttack() {
    if (!this.isAggro || this.isDead() || this.isAttacking || this.gettingHit() || !this.IMAGES_ATTACK.length) return;
    this.faceTarget();
    if (!this.hitboxesOverlap(this.target.getHitbox(), this.getAttackHitbox())) return;
    if (gameLoop.now() < this.nextAttackAt) return;
    this.isAttacking = true;
    this.isAttackHitRegistered = false;
    this.currentImage = 0;
    this.nextAttackAt = gameLoop.now() + this.attackCooldown;
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
    this.attackHitEndFrame = this.IMAGES_ATTACK.length - 1;
    this.img = this.imageCache[this.IMAGES_IDLE[0]];
    this.animation();
    this.startAttackCycle();
  }

  animation() {
    gameLoop.runEvery(1000 / 60, () => this.updateMovement());
    gameLoop.runEvery(120, () => this.updateAnimation());
  }

  updateMovement() {
    this.updateAggro();
    if (this.knockbackFrames > 0) this.applyKnockback();
    else if (this.isAggro && !this.isDead()) this.updateChase();
    else if (this.isReturning && !this.isDead()) this.returnToSpawn();
    else this.patrol();
  }

  applyKnockback() {
    this.x += this.knockbackDirection * 4.5;
    this.knockbackFrames--;
    this.isMoving = false;
  }

  updateChase() {
    if (!this.isAttacking && !this.gettingHit()) this.chase();
  }

  patrol() {
    if (!this.isMovable || !this.isMoving || this.isDead() || this.isAttacking) return;
    this.x += this.speed * this.movementDirection;
    this.isOppositeDirection = this.movementDirection < 0;
    if (this.x <= this.minX || this.x >= this.maxX) this.turnAtPatrolEnd();
  }

  turnAtPatrolEnd() {
    this.x = Math.max(this.minX, Math.min(this.maxX, this.x));
    this.isMoving = false;
    gameLoop.runOnceAfter(500, () => this.reversePatrolDirection());
  }

  reversePatrolDirection() {
    if (this.isDead() || this.isAggro || this.isReturning) return;
    this.movementDirection *= -1;
    this.isMoving = true;
  }

  updateAnimation() {
    if (this.isDead()) {
      this.playDeathAnimation();
      return;
    }
    this.updateAttackFlag();
    const { state, images } = this.getAnimationState();
    this.switchAnimation(state);
    this.playStateAnimation(state, images);
  }

  updateAttackFlag() {
    const isAttackFinished = this.currentAnimation === "attack" && this.currentImage >= this.IMAGES_ATTACK.length;
    const isHurt = this.gettingHit() && this.IMAGES_HURT.length > 0;
    if (isAttackFinished || isHurt) this.isAttacking = false;
  }

  getAnimationState() {
    if (this.gettingHit() && this.IMAGES_HURT.length) return { state: "hurt", images: this.IMAGES_HURT };
    if (this.isAttacking) return { state: "attack", images: this.IMAGES_ATTACK };
    if (this.isMoving) return { state: "moving", images: this.IMAGES_MOVING };
    return { state: "idle", images: this.IMAGES_IDLE };
  }

  switchAnimation(state) {
    if (this.currentAnimation === state) return;
    this.currentAnimation = state;
    this.currentImage = 0;
  }

  playStateAnimation(state, images) {
    if (state === "idle") this.playIdle();
    else this.playAnimation(images);
  }

  playIdle() {
    this.playAnimation(this.IMAGES_IDLE);
  }

  playDeathAnimation() {
    if (this.currentAnimation !== "dead") this.startDeathAnimation();
    if (this.currentImage >= this.IMAGES_DEAD.length) {
      this.isDeathAnimationFinished = true;
      return;
    }
    this.img = this.imageCache[this.IMAGES_DEAD[this.currentImage]];
    this.currentImage++;
  }

  startDeathAnimation() {
    this.currentAnimation = "dead";
    this.currentImage = 0;
    this.isMoving = false;
  }
}

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
