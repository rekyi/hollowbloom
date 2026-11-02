import { ENTITY_SCALE } from "../data.js";
import { gameLoop } from "./game-loop.class.js";
import { CharacterCombat } from "./character-combat.class.js";

export class CharacterVisuals extends CharacterCombat {
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

  playAttackWithLegs() {
    this.playAttack();
    this.playLegsWhileAttacking();
  }

  playMovement() {
    this.playAnimation(this.world.keyboard.SHIFT ? this.IMAGES_RUNNING : this.IMAGES_WALKING);
  }

  playIdleState() {
    const idleTime = gameLoop.now() - this.idleSince;
    if (idleTime >= 10000) this.playIdleLong();
    else if (idleTime >= 3000) this.playIdle(this.IMAGES_IDLE);
    else this.playStanding();
  }

  playStanding() {
    this.img = this.imageCache[this.IMAGES_STANDING[0]];
    this.currentImage = 0;
  }

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

  playJump() {
    const progress = (this.jumpSpeed - this.speedY) / (this.jumpSpeed * 2);
    const frame = Math.floor(progress * this.IMAGES_JUMPING.length);
    this.img = this.imageCache[this.IMAGES_JUMPING[Math.max(0, Math.min(frame, this.IMAGES_JUMPING.length - 1))]];
  }

  playIdle(images) {
    if (gameLoop.now() - this.lastIdleFrame < 150) return;
    this.lastIdleFrame = gameLoop.now();
    this.playAnimation(images);
  }

  playIdleLong() {
    this.isBubbleVisible = this.IMAGES_BUBBLE.length > 0;
    this.img = this.imageCache[this.IMAGES_IDLE_LONG[this.idleLongFrame]];
    if (gameLoop.now() - this.lastIdleFrame < 150) return;
    this.lastIdleFrame = gameLoop.now();
    if (this.idleLongFrame < this.IMAGES_IDLE_LONG.length - 1) this.idleLongFrame++;
  }

  draw(ctx) {
    const isBlinking = this.isInvulnerable() && Math.floor(gameLoop.now() / 100) % 2 === 0;
    if (!isBlinking) this.drawBody(ctx);
    if (this.isBubbleVisible && this.IMAGES_BUBBLE.length > 0) this.drawBubble(ctx);
  }

  drawBody(ctx) {
    if (this.legsImg) this.drawWithLegs(ctx);
    else super.draw(ctx);
  }

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

  getLegsRect() {
    const scale = this.width / 128;
    const { x, y, w, h } = this.legsArea;
    return { x: this.x + x * scale, y: this.y + y * scale, width: w * scale, height: h * scale };
  }

  clipOutRect(ctx, rect) {
    ctx.beginPath();
    ctx.rect(this.x - 500, this.y - 500, this.width + 1000, this.height + 1000);
    ctx.rect(rect.x, rect.y, rect.width, rect.height);
    ctx.clip("evenodd");
  }

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
