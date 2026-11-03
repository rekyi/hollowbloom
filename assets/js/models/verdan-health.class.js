import { playSfx } from "../sfx.js";
import { gameLoop } from "./game-loop.class.js";
import { VerdanAttacks } from "./verdan-attacks.class.js";
import { BOSS_HIT_PROTECTION_MS, VERDAN_SETTINGS } from "../data.js";
import { gameMusic } from "./game-music.class.js";

export class VerdanHealth extends VerdanAttacks {
  hp = 12;
  maxHp = 12;
  canStagger = true;
  isRagePending = false;
  isRoarTriggered = false;
  isDeathAnimationFinished = false;
  hitProtectedUntil = Number.NEGATIVE_INFINITY;

  isHitProtected() {
    return gameLoop.now() < this.hitProtectedUntil;
  }

  hit() {
    if (this.state === "transition" || this.isHitProtected()) return false;
    if (!super.hit()) return false;
    this.hitProtectedUntil = gameLoop.now() + BOSS_HIT_PROTECTION_MS;
    if (!this.isDead()) playSfx("verdanHurt");
    this.handleHitReaction();
    return true;
  }

  handleHitReaction() {
    if (this.isDead()) this.startDeath();
    else if (this.state === "attack") this.isRagePending = this.shouldEnterRage();
    else if (this.shouldEnterRage()) this.startTransition();
    else if (this.canStagger) this.startHurt();
    else this.prepareCounter();
  }

  draw(ctx) {
    ctx.save();
    if (this.isHitProtected() && !this.isDead() && Math.floor(gameLoop.now() / 80) % 2 === 0) ctx.globalAlpha = 0.5;
    super.draw(ctx);
    ctx.restore();
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
    else this.startCounterIdle();
  }

  startTransition() {
    this.cancelAttacks();
    this.startAnimation("transition");
    gameMusic.startRageTransition();
  }

  playTransition() {
    const { frameDuration, roarFrame } = VERDAN_SETTINGS.phaseTransition;
    const frame = this.getElapsedFrame(frameDuration);
    if (frame >= this.IMAGES_TRANSITION.length) return this.enterRage();
    this.setFrame(this.IMAGES_TRANSITION, frame);
    this.playSoundsAtFrame(VERDAN_SETTINGS.phaseTransition.sounds, frame);
    if (frame >= roarFrame) this.triggerRoarShake();
  }

  triggerRoarShake() {
    if (this.isRoarTriggered || !this.world) return;
    this.isRoarTriggered = true;
    playSfx("verdanPhaseTransitionRoar");
    this.world.triggerHitFeedback("bossRoar");
  }

  enterRage() {
    this.isRage = true;
    this.IMAGES_IDLE = this.IMAGES_IDLE_RAGE;
    this.IMAGES_WALK = this.IMAGES_WALK_RAGE;
    this.IMAGES_HURT = this.IMAGES_HURT_RAGE;
    this.speed = VERDAN_SETTINGS.walkRage.speed;
    this.startIdle();
    gameMusic.playRageMusic();
  }

  startDeath() {
    this.cancelAttacks();
    this.startAnimation("death");
  }

  playDeath() {
    const frame = this.getElapsedFrame(VERDAN_SETTINGS.death.frameDuration);
    this.setFrame(this.IMAGES_DEATH, Math.min(frame, this.IMAGES_DEATH.length - 1));
    this.playSoundsAtFrame(VERDAN_SETTINGS.death.sounds, frame);
    this.isDeathAnimationFinished = frame >= this.IMAGES_DEATH.length;
  }
}
