import { playSfx } from "../sfx.js";
import { gameLoop } from "./game-loop.class.js";
import { EnemyBehavior } from "./enemy-behavior.class.js";

export class Enemy extends EnemyBehavior {
  isAttackFrameActive() {
    const displayedFrame = this.currentImage - 1;
    return this.isAttacking && this.currentAnimation === "attack" && displayedFrame >= this.attackHitStartFrame && displayedFrame <= this.attackHitEndFrame;
  }

  hit() {
    if (!super.hit()) return false;
    playSfx(this.isDead() ? "enemyDeath" : "enemyHit");
    const targetCenter = this.target ? this.target.x + this.target.width / 2 : this.x;
    this.knockbackDirection = this.x + this.width / 2 < targetCenter ? -1 : 1;
    this.knockbackFrames = 6;
    return true;
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
    if (!this.isAggro || this.isDead() || this.isAttacking || this.gettingHit() || this.getActiveStatus() || !this.IMAGES_ATTACK.length) return;
    this.faceTarget();
    if (!this.world.hitboxesOverlap(this.target.getHitbox(), this.getAttackHitbox())) return;
    if (gameLoop.now() < this.nextAttackAt) return;
    this.isAttacking = true;
    this.isAttackHitRegistered = false;
    this.currentImage = 0;
    this.nextAttackAt = gameLoop.now() + this.attackCooldown;
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
    if (this.getActiveStatus() === "frozen" && this.IMAGES_FROZEN.length) return { state: "frozen", images: this.IMAGES_FROZEN };
    if (this.getActiveStatus() === "shock" && this.IMAGES_SHOCK.length) return { state: "shock", images: this.IMAGES_SHOCK };
    if (this.gettingHit() && this.IMAGES_HURT.length) return { state: "hurt", images: this.IMAGES_HURT };
    if (this.isAttacking) return { state: "attack", images: this.IMAGES_ATTACK };
    if (this.isAggro && this.isMoving && this.IMAGES_RUN.length) return { state: "run", images: this.IMAGES_RUN };
    if (this.isMoving) return { state: "walk", images: this.IMAGES_MOVING };
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
