import { gameLoop } from "./game-loop.class.js";
import { playSfx } from "../sfx.js";
import { VerdanAttacks } from "./verdan-attacks.class.js";
import { VERDAN_SETTINGS } from "../data.js";

export class VerdanHealth extends VerdanAttacks {
  hp = 8;
  maxHp = 8;
  canStagger = true;
  isRagePending = false;
  isRoarTriggered = false;
  isDeathAnimationFinished = false;

  hit() {
    if (this.state === "transition") return false;
    if (!super.hit()) return false;
    playSfx("enemyHit");
    this.handleHitReaction();
    return true;
  }

  handleHitReaction() {
    if (this.isDead()) this.startDeath();
    else if (this.state === "attack") this.isRagePending = this.shouldEnterRage();
    else if (this.shouldEnterRage()) this.startTransition();
    else if (this.canStagger) this.startHurt();
  }

  shouldEnterRage() {
    return !this.isRage && this.hp <= this.maxHp / 2;
  }

  startAttack(key, onAction) {
    this.canStagger = true;
    super.startAttack(key, onAction);
  }

  cancelAttacks() {
    super.cancelAttacks();
    this.isRagePending = false;
  }

  startHurt() {
    this.canStagger = false;
    this.startAnimation("hurt");
  }

  playHurt() {
    const frame = this.getElapsedFrame(this.getPhaseSettings("hurt").frameDuration);
    if (frame < this.IMAGES_HURT.length) this.setFrame(this.IMAGES_HURT, frame);
    else this.startIdle();
  }

  startTransition() {
    this.cancelAttacks();
    this.startAnimation("transition");
  }

  playTransition() {
    const { frameDuration, roarFrame } = VERDAN_SETTINGS.phaseTransition;
    const frame = this.getElapsedFrame(frameDuration);
    if (frame >= this.IMAGES_TRANSITION.length) return this.enterRage();
    this.setFrame(this.IMAGES_TRANSITION, frame);
    if (frame >= roarFrame) this.triggerRoarShake();
  }

  triggerRoarShake() {
    if (this.isRoarTriggered || !this.world) return;
    this.isRoarTriggered = true;
    this.world.shakeStartedAt = gameLoop.now();
  }

  enterRage() {
    this.isRage = true;
    this.IMAGES_IDLE = this.IMAGES_IDLE_RAGE;
    this.IMAGES_WALK = this.IMAGES_WALK_RAGE;
    this.IMAGES_HURT = this.IMAGES_HURT_RAGE;
    this.speed = VERDAN_SETTINGS.walkRage.speed;
    this.startIdle();
  }

  startDeath() {
    playSfx("finalBossDeath");
    this.cancelAttacks();
    this.startAnimation("death");
  }

  playDeath() {
    const frame = this.getElapsedFrame(VERDAN_SETTINGS.death.frameDuration);
    this.setFrame(this.IMAGES_DEATH, Math.min(frame, this.IMAGES_DEATH.length - 1));
    this.isDeathAnimationFinished = frame >= this.IMAGES_DEATH.length;
  }
}
