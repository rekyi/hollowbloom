import { playSfx } from "../sfx.js";
import { gameLoop } from "./game-loop.class.js";
import { CharacterBase } from "./character-base.class.js";
import { moveX } from "./tile-collision.js";

const COYOTE_TIME_MS = 100;
const JUMP_BUFFER_MS = 100;

export class CharacterMovement extends CharacterBase {
  coyoteUntil = Number.NEGATIVE_INFINITY;
  jumpBufferedUntil = Number.NEGATIVE_INFINITY;

  animation() {
    gameLoop.runEvery(1000 / 60, () => this.updateCharacter());
  }

  updateCharacter() {
    if (!this.isDead()) {
      this.updateInput();
      this.updatePhysics();
    }
    this.updateState();
    this.updateFootsteps();
    this.tickAnimation();
  }

  updateFootsteps() {
    const key = this.world.keyboard;
    if (!this.canPlayFootsteps()) {
      this.stepElapsedSeconds = 0;
      this.activeFootstepSfx = null;
      return;
    }
    const soundName = `${this.characterType}${key.SHIFT ? "Run" : "Walk"}`;
    const stepInterval = key.SHIFT ? 0.25 : 0.22;
    if (soundName !== this.activeFootstepSfx) {
      this.activeFootstepSfx = soundName;
      this.stepElapsedSeconds = stepInterval - this.footstepStartDelaySeconds;
    }
    this.stepElapsedSeconds += gameLoop.fixedStepSeconds;
    if (this.stepElapsedSeconds < stepInterval) return;
    this.stepElapsedSeconds = 0;
    playSfx(soundName);
  }

  canPlayFootsteps() {
    const key = this.world.keyboard;
    const isMovingRight = key.RIGHT && !key.LEFT && this.x < this.world.level.levelEndX;
    const isMovingLeft = key.LEFT && !key.RIGHT && this.x > 0;
    return (isMovingRight || isMovingLeft) && !this.isAboveGround() && !this.isAttacking && !this.gettingHit() && !this.isDead();
  }

  tickAnimation() {
    this.animationElapsedMs += gameLoop.fixedStepMs;
    if (this.animationElapsedMs < 25) return;
    this.animationElapsedMs -= 25;
    this.updateAnimation();
  }

  updateInput() {
    const key = this.world.keyboard;
    this.speed = key.SHIFT ? this.walkSpeed * this.runSpeedFactor : this.walkSpeed;
    if (key.LEFT || key.RIGHT || key.SPACE || this.isAttacking || this.isAboveGround() || this.gettingHit()) {
      this.idleSince = gameLoop.now();
      this.idleLongFrame = 0;
    }
  }

  updatePhysics() {
    this.updateMovement();
    this.applyKnockback();
    this.x = Math.max(0, Math.min(this.world.level.levelEndX, this.x));
    this.updateJumpTiming();
    this.world.updateCamera();
  }

  updateJumpTiming() {
    if (this.isAboveGround() || this.speedY > 0) return;
    this.coyoteUntil = gameLoop.now() + COYOTE_TIME_MS;
    if (gameLoop.now() > this.jumpBufferedUntil) return;
    this.jumpBufferedUntil = Number.NEGATIVE_INFINITY;
    this.jump();
  }

  updateMovement() {
    const key = this.world.keyboard;
    if (key.RIGHT && !key.LEFT && this.x < this.world.level.levelEndX) this.moveRight();
    if (key.LEFT && !key.RIGHT && this.x > 0) this.moveLeft();
  }

  applyKnockback() {
    if (this.knockbackSpeed <= 0) return;
    moveX(this, this.world.level, this.knockbackDirection * this.knockbackSpeed);
    this.decayKnockback();
  }

  jump() {
    this.updateState();
    if (this.canJump()) this.startCharacterJump();
    else this.bufferJump();
  }

  canJump() {
    const isActionAllowed = this.canPerformAction("jump") || this.state === "jump";
    return isActionAllowed && gameLoop.now() <= this.coyoteUntil;
  }

  startCharacterJump() {
    this.coyoteUntil = Number.NEGATIVE_INFINITY;
    this.jumpBufferedUntil = Number.NEGATIVE_INFINITY;
    this.startJump();
    playSfx("jumpStart");
    this.updateState();
  }

  bufferJump() {
    if (this.isAboveGround()) this.jumpBufferedUntil = gameLoop.now() + JUMP_BUFFER_MS;
  }
}
