import { gameLoop } from "./game-loop.class.js";
import { MoveableObject } from "./movable-object.class.js";

export class EnemyBehavior extends MoveableObject {
  IMAGES_IDLE = [];
  IMAGES_MOVING = [];
  IMAGES_RUN = [];
  IMAGES_HURT = [];
  IMAGES_DEAD = [];
  IMAGES_ATTACK = [];
  animationInterval = 120;
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
    gameLoop.runEvery(this.animationInterval, () => this.updateAnimation());
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
}
