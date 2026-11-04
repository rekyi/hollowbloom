import { playSfx } from "../sfx.js";
import { gameLoop } from "./game-loop.class.js";
import { EnemyBehavior } from "./enemy-behavior.class.js";

/** Enemy with attack cycle, animation states and hurt, death and attack sounds. */
export class Enemy extends EnemyBehavior {
  hurtSfx = null;
  deathSfx = null;
  attackSfx = null;
  attackSfxFrame = 0;
  isAttackSfxPlayed = false;

  /**
   * Checks whether the displayed attack frame can deal damage.
   * @returns {boolean} True during the damaging frames of an attack.
   */
  isAttackFrameActive() {
    const displayedFrame = this.currentImage - 1;
    return this.isAttacking && this.currentAnimation === "attack" && displayedFrame >= this.attackHitStartFrame && displayedFrame <= this.attackHitEndFrame;
  }

  /**
   * Applies a hit and plays the hurt or death sound.
   * @returns {boolean} True if the hit was applied.
   */
  hit() {
    if (!super.hit()) return false;
    const sfxName = this.isDead() ? this.deathSfx : this.hurtSfx;
    if (sfxName) playSfx(sfxName);
    return true;
  }

  /**
   * Gets the attack hitbox extended by the attack reach in facing direction.
   * @returns {{x: number, y: number, width: number, height: number}} The attack hitbox.
   */
  getAttackHitbox() {
    const hitbox = this.getHitboxFor(this.attackOffset);
    if (this.isOppositeDirection) {
      return { ...hitbox, x: hitbox.x - this.attackReach, width: hitbox.width + this.attackReach };
    }
    return { ...hitbox, width: hitbox.width + this.attackReach };
  }

  /** Checks for attack opportunities at 60 fps. */
  startAttackCycle() {
    gameLoop.runEvery(1000 / 60, () => this.tryStartAttack());
  }

  /** Starts an attack if aggro, the target is in reach and the cooldown is over. */
  tryStartAttack() {
    if (!this.isAggro || this.isDead() || this.isAttacking || this.gettingHit() || this.getActiveStatus() || !this.IMAGES_ATTACK.length) return;
    this.faceTarget();
    if (!this.world.hitboxesOverlap(this.target.getHitbox(), this.getAttackHitbox())) return;
    if (gameLoop.now() < this.nextAttackAt) return;
    this.isAttacking = true;
    this.isAttackHitRegistered = false;
    this.isAttackSfxPlayed = false;
    this.currentImage = 0;
    this.nextAttackAt = gameLoop.now() + this.attackCooldown;
  }

  /** Picks and advances the animation for the current state. */
  updateAnimation() {
    if (this.isDead()) {
      this.playDeathAnimation();
      return;
    }
    this.updateAttackFlag();
    const { state, images } = this.getAnimationState();
    this.switchAnimation(state);
    this.playStateAnimation(state, images);
    if (state === "attack") this.playAttackSfxWhenDue();
  }

  /** Plays the attack sound once its frame is reached. */
  playAttackSfxWhenDue() {
    const displayedFrame = this.currentImage - 1;
    if (this.isAttackSfxPlayed || !this.attackSfx || displayedFrame < this.attackSfxFrame) return;
    this.isAttackSfxPlayed = true;
    playSfx(this.attackSfx);
  }

  /** Ends the attack when its animation is finished or the enemy is hurt. */
  updateAttackFlag() {
    const isAttackFinished = this.currentAnimation === "attack" && this.currentImage >= this.IMAGES_ATTACK.length;
    const isHurt = this.gettingHit() && this.IMAGES_HURT.length > 0;
    if (isAttackFinished || isHurt) this.isAttacking = false;
  }

  /**
   * Determines the animation state by priority.
   * @returns {{state: string, images: string[]}} State name and its frames.
   */
  getAnimationState() {
    if (this.getActiveStatus() === "frozen" && this.IMAGES_FROZEN.length) return { state: "frozen", images: this.IMAGES_FROZEN };
    if (this.getActiveStatus() === "shock" && this.IMAGES_SHOCK.length) return { state: "shock", images: this.IMAGES_SHOCK };
    if (this.gettingHit() && this.IMAGES_HURT.length) return { state: "hurt", images: this.IMAGES_HURT };
    if (this.isAttacking) return { state: "attack", images: this.IMAGES_ATTACK };
    if (this.isAggro && this.isMoving && this.IMAGES_RUN.length) return { state: "run", images: this.IMAGES_RUN };
    if (this.isMoving) return { state: "walk", images: this.IMAGES_MOVING };
    return { state: "idle", images: this.IMAGES_IDLE };
  }

  /**
   * Switches to a new animation and restarts it.
   * @param {string} state - Animation state name.
   */
  switchAnimation(state) {
    if (this.currentAnimation === state) return;
    this.currentAnimation = state;
    this.currentImage = 0;
  }

  /**
   * Plays the animation of a state.
   * @param {string} state - Animation state name.
   * @param {string[]} images - Frames of the state.
   */
  playStateAnimation(state, images) {
    if (state === "idle") this.playIdle();
    else this.playAnimation(images);
  }

  /** Plays the idle animation. */
  playIdle() {
    this.playAnimation(this.IMAGES_IDLE);
  }

  /** Plays the death animation once and marks it as finished. */
  playDeathAnimation() {
    if (this.currentAnimation !== "dead") this.startDeathAnimation();
    if (this.currentImage >= this.IMAGES_DEAD.length) {
      this.isDeathAnimationFinished = true;
      return;
    }
    this.img = this.imageCache[this.IMAGES_DEAD[this.currentImage]];
    this.currentImage++;
  }

  /** Switches to the death animation and stops moving. */
  startDeathAnimation() {
    this.currentAnimation = "dead";
    this.currentImage = 0;
    this.isMoving = false;
  }
}
