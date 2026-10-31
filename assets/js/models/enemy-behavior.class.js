import { ENTITY_SCALE } from "../data.js";
import { gameLoop } from "./game-loop.class.js";
import { MoveableObject } from "./movable-object.class.js";
import { moveXOnGround } from "./tile-collision.js";

const KNOCKBACK_SPEED = 4.5 * ENTITY_SCALE;
const AGGRO_MAX_FOOT_DIFF_HEIGHTS = 0.6;
const FACE_DEAD_ZONE = 12 * ENTITY_SCALE;

export class EnemyBehavior extends MoveableObject {
  IMAGES_IDLE = [];
  IMAGES_MOVING = [];
  IMAGES_RUN = [];
  IMAGES_HURT = [];
  IMAGES_DEAD = [];
  IMAGES_ATTACK = [];
  IMAGES_FROZEN = [];
  IMAGES_SHOCK = [];
  animationInterval = 120;
  attackAnimationInterval = 120;
  runAnimationInterval = 120;
  deathAnimationInterval = 120;
  hp = 2;
  movementDirection = -1;
  isOppositeDirection = true;
  isMovable = true;
  isMoving = this.isMovable;
  currentAnimation = "";
  lastAnimationAt = 0;
  isDeathAnimationFinished = false;
  attackCooldown = 3000;
  nextAttackAt = Number.NEGATIVE_INFINITY;
  attackOffset = this.offset;
  attackReach = 0;
  isAggro = false;
  isReturning = false;
  status = null;
  statusUntil = Number.NEGATIVE_INFINITY;
  aggroRange = 300 * ENTITY_SCALE;
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

  placeAt(x, y, minX, maxX) {
    this.spawnArgs = null;
    this.setPosition(x, y, this.width, this.height, this.speed, minX, maxX);
  }

  start() {
    this.attackHitEndFrame = this.IMAGES_ATTACK.length - 1;
    this.img = this.imageCache[this.IMAGES_IDLE[0]];
    this.lastAnimationAt = gameLoop.now();
    this.animation();
    this.startAttackCycle();
  }

  animation() {
    gameLoop.runEvery(1000 / 60, () => this.updateMovement());
    gameLoop.runEvery(this.getAnimationSchedulerInterval(), () => this.updateAnimationByInterval());
  }

  getAnimationSchedulerInterval() {
    return Math.min(this.animationInterval, this.attackAnimationInterval, this.runAnimationInterval, this.deathAnimationInterval);
  }

  getAnimationInterval() {
    if (this.currentAnimation === "dead") return this.deathAnimationInterval;
    if (this.currentAnimation === "attack") return this.attackAnimationInterval;
    if (this.currentAnimation === "run") return this.runAnimationInterval;
    return this.animationInterval;
  }

  gettingHit() {
    const hurtDuration = Math.max(500, (this.IMAGES_HURT.length + 1) * this.animationInterval);
    return gameLoop.now() - this.lastHit < hurtDuration;
  }

  updateAnimationByInterval() {
    if (gameLoop.now() - this.lastAnimationAt < this.getAnimationInterval()) return;
    this.lastAnimationAt = gameLoop.now();
    this.updateAnimation();
  }

  updateMovement() {
    this.updateAggro();
    if (this.getActiveStatus()) {
      this.isMoving = false;
      return;
    }
    if (this.knockbackFrames > 0) this.applyKnockback();
    else if (this.isAggro && !this.isDead()) this.updateChase();
    else if (this.isReturning && !this.isDead()) this.returnToSpawn();
    else this.patrol();
  }

  applyKnockback() {
    this.x += this.knockbackDirection * KNOCKBACK_SPEED;
    this.knockbackFrames--;
    this.isMoving = false;
  }

  updateChase() {
    if (!this.isAttacking && !this.gettingHit()) this.chase();
  }

  patrol() {
    if (!this.isMovable || !this.isMoving || this.isDead() || this.isAttacking) return;
    this.isOppositeDirection = this.movementDirection < 0;
    const isStepDone = moveXOnGround(this, this.world.level, this.speed * this.movementDirection);
    if (!isStepDone || this.x <= this.minX || this.x >= this.maxX) this.turnAtPatrolEnd();
  }

  turnAtPatrolEnd() {
    this.x = Math.max(this.minX, Math.min(this.maxX, this.x));
    this.movementDirection *= -1;
    this.isOppositeDirection = this.movementDirection < 0;
  }

  updateAggro() {
    if (!this.target || this.isDead()) return;
    const isInRange = this.getDistanceToTarget() <= this.aggroRange;
    if (!this.isAggro && isInRange && this.isTargetReachable()) {
      this.isAggro = true;
      this.isReturning = false;
    } else if (this.isAggro && !isInRange) {
      this.resetToSpawn();
    }
  }

  isTargetReachable() {
    const feetDifference = Math.abs(this.target.y + this.target.height - (this.y + this.height));
    return feetDifference <= this.height * AGGRO_MAX_FOOT_DIFF_HEIGHTS;
  }

  getActiveStatus() {
    return gameLoop.now() < this.statusUntil ? this.status : null;
  }

  applyStatus(status, duration) {
    this.status = status;
    this.statusUntil = gameLoop.now() + duration;
    this.isAttacking = false;
    this.isMoving = false;
    this.knockbackFrames = 0;
    this.currentAnimation = status;
    this.currentImage = 0;
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
    if (this.isHorizontallyAligned(targetHitbox, attackHitbox)) {
      this.isMoving = false;
      return;
    }
    this.moveTowards(targetHitbox, attackHitbox);
  }

  isHorizontallyAligned(a, b) {
    return a.x < b.x + b.width && a.x + a.width > b.x;
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
    const offsetX = this.target.x + this.target.width / 2 - enemyCenter;
    if (Math.abs(offsetX) <= FACE_DEAD_ZONE) return;
    this.isOppositeDirection = offsetX < 0;
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
