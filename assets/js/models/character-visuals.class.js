import { ENTITY_SCALE } from "../data.js";
import { gameLoop } from "./game-loop.class.js";
import { CharacterCombat } from "./character-combat.class.js";

/** Character animation selection and drawing, including split legs, blinking and the idle bubble. */
export class CharacterVisuals extends CharacterCombat {
  /** Picks and advances the animation for the current state. */
  updateAnimation() {
    this.isBubbleVisible = false;
    this.legsImg = null;
    if (this.state === "dead") this.playDeathAnimation();
    else if (this.state === "attack") this.playAttackWithLegs();
    else if (this.state === "hurt") this.playAnimation(this.IMAGES_HURT);
    else if (this.state === "jump") this.playJump();
    else if (this.world.keyboard.RIGHT !== this.world.keyboard.LEFT) this.playMovement();
    else this.playIdleState();
  }

  /** Plays the death animation once and holds the last frame. */
  playDeathAnimation() {
    if (!this.isDeathStarted) {
      this.isDeathStarted = true;
      this.currentImage = 0;
    }
    if (this.currentImage < this.IMAGES_DEAD.length * 4) {
      this.img = this.imageCache[this.IMAGES_DEAD[Math.floor(this.currentImage / 4)]];
      this.currentImage++;
    }
  }

  /** Plays the attack and a separate leg animation while moving or jumping. */
  playAttackWithLegs() {
    this.playAttack();
    this.playLegsWhileAttacking();
  }

  /** Plays the run or walk animation. */
  playMovement() {
    this.playAnimation(this.world.keyboard.SHIFT ? this.IMAGES_RUNNING : this.IMAGES_WALKING);
  }

  /** Shows standing, idle or long idle depending on how long the character has been idle. */
  playIdleState() {
    const idleTime = gameLoop.now() - this.idleSince;
    if (idleTime >= 10000) this.playIdleLong();
    else if (idleTime >= 3000) this.playIdle(this.IMAGES_IDLE);
    else this.playStanding();
  }

  /** Shows the first standing frame. */
  playStanding() {
    this.img = this.imageCache[this.IMAGES_STANDING[0]];
    this.currentImage = 0;
  }

  /** Stores a jump or walk frame as leg image while keeping the attack frame as body image. */
  playLegsWhileAttacking() {
    const key = this.world.keyboard;
    const isMoving = key.LEFT !== key.RIGHT;
    if (!isMoving && !this.isAboveGround()) return;
    const attackImg = this.img;
    if (this.isAboveGround()) this.playJump();
    else this.playAnimation(key.SHIFT ? this.IMAGES_RUNNING : this.IMAGES_WALKING);
    this.legsImg = this.img;
    this.img = attackImg;
  }

  /** Shows the jump frame matching the current vertical speed. */
  playJump() {
    const progress = (this.jumpSpeed - this.speedY) / (this.jumpSpeed * 2);
    const frame = Math.floor(progress * this.IMAGES_JUMPING.length);
    this.img = this.imageCache[this.IMAGES_JUMPING[Math.max(0, Math.min(frame, this.IMAGES_JUMPING.length - 1))]];
  }

  /**
   * Advances an idle animation every 150 ms.
   * @param {string[]} images - Image cache keys of the idle animation.
   */
  playIdle(images) {
    if (gameLoop.now() - this.lastIdleFrame < 150) return;
    this.lastIdleFrame = gameLoop.now();
    this.playAnimation(images);
  }

  /** Plays the long idle animation once, holds its last frame and shows the bubble. */
  playIdleLong() {
    this.isBubbleVisible = this.IMAGES_BUBBLE.length > 0;
    this.img = this.imageCache[this.IMAGES_IDLE_LONG[this.idleLongFrame]];
    if (gameLoop.now() - this.lastIdleFrame < 150) return;
    this.lastIdleFrame = gameLoop.now();
    if (this.idleLongFrame < this.IMAGES_IDLE_LONG.length - 1) this.idleLongFrame++;
  }

  /**
   * Draws the character, blinking while invulnerable, and the idle bubble.
   * @param {CanvasRenderingContext2D} ctx - Target canvas context.
   */
  draw(ctx) {
    const isBlinking = this.isInvulnerable() && Math.floor(gameLoop.now() / 100) % 2 === 0;
    if (!isBlinking) this.drawBody(ctx);
    if (this.isBubbleVisible && this.IMAGES_BUBBLE.length > 0) this.drawBubble(ctx);
  }

  /**
   * Draws the body, with separate legs if set.
   * @param {CanvasRenderingContext2D} ctx - Target canvas context.
   */
  drawBody(ctx) {
    if (this.legsImg) this.drawWithLegs(ctx);
    else super.draw(ctx);
  }

  /**
   * Draws the attack frame without its leg area and the leg image in its place.
   * @param {CanvasRenderingContext2D} ctx - Target canvas context.
   */
  drawWithLegs(ctx) {
    const { x, y, w, h } = this.legsArea;
    const sourceScale = this.legsImg.width / 128;
    const legs = this.getLegsRect();
    ctx.save();
    this.clipOutRect(ctx, legs);
    super.draw(ctx);
    ctx.restore();
    ctx.drawImage(this.legsImg, x * sourceScale, y * sourceScale, w * sourceScale, h * sourceScale, legs.x, legs.y, legs.width, legs.height);
  }

  /**
   * Gets the leg area in world coordinates.
   * @returns {{x: number, y: number, width: number, height: number}} The leg rectangle.
   */
  getLegsRect() {
    const scale = this.width / 128;
    const { x, y, w, h } = this.legsArea;
    return { x: this.x + x * scale, y: this.y + y * scale, width: w * scale, height: h * scale };
  }

  /**
   * Clips the context so drawing skips a rectangle.
   * @param {CanvasRenderingContext2D} ctx - Target canvas context.
   * @param {{x: number, y: number, width: number, height: number}} rect - Area to exclude.
   */
  clipOutRect(ctx, rect) {
    ctx.beginPath();
    ctx.rect(this.x - 500, this.y - 500, this.width + 1000, this.height + 1000);
    ctx.rect(rect.x, rect.y, rect.width, rect.height);
    ctx.clip("evenodd");
  }

  /**
   * Draws the animated idle bubble next to the character.
   * @param {CanvasRenderingContext2D} ctx - Target canvas context.
   */
  drawBubble(ctx) {
    const frame = Math.floor(gameLoop.now() / 500) % this.IMAGES_BUBBLE.length;
    const bubble = this.imageCache[this.IMAGES_BUBBLE[frame]];
    ctx.save();
    ctx.translate(this.x + this.width / 2, 0);
    if (this.isOppositeDirection) ctx.scale(-1, 1);
    ctx.drawImage(bubble, 20 * ENTITY_SCALE, this.y + 35 * ENTITY_SCALE, 40 * ENTITY_SCALE, 45 * ENTITY_SCALE);
    ctx.restore();
  }
}
