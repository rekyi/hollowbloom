import { gameLoop } from "./game-loop.class.js";
import { ConfigurableEnemy } from "./configurable-enemy.class.js";

const IDLE_ALERT_FRAME_DURATION = 120;
const BOAR_PATH = "assets/images/3_enemies/boar/";
const BOAR_SPRITES = {
  walk: { path: `${BOAR_PATH}boar_walk.webp`, frameCount: 74, frameSize: 500, frameHeight: 200, columns: 10 },
  alert: { path: `${BOAR_PATH}boar_alert.webp`, frameCount: 82, frameSize: 500, frameHeight: 200, columns: 10 },
  defense: { path: `${BOAR_PATH}boar_defense.webp`, frameCount: 67, frameSize: 500, frameHeight: 200, columns: 10 },
};
const IDLE_ALERT_ANIMATION_DURATION = Math.max(BOAR_SPRITES.walk.frameCount, BOAR_SPRITES.alert.frameCount) * IDLE_ALERT_FRAME_DURATION;
const BOAR_SETTINGS = {
  animationInterval: 80,
  attackAnimationInterval: 30,
  runAnimationInterval: 45,
  position: { x: 0, y: 0, width: 180, height: 160, speed: 1.8, minX: 0, maxX: 0 },
  hitbox: { top: 45, right: 30, bottom: 20, left: 30 },
  attackHitbox: { top: 35, right: 10, bottom: 20, left: 10 },
  attackHitStartFrame: 6,
  sprites: {
    idle: BOAR_SPRITES.walk,
    walk: BOAR_SPRITES.walk,
    run: { path: `${BOAR_PATH}boar_run.webp`, frameCount: 60, frameSize: 500, frameHeight: 200, columns: 10 },
    attack: [{ path: `${BOAR_PATH}boar_attack_0.webp`, frameCount: 46, frameSize: 500, frameHeight: 200, columns: 10, hitStartFrame: 25 }],
    hurt: [
      { path: `${BOAR_PATH}boar_hurt_0.webp`, frameCount: 22, frameSize: 500, frameHeight: 200, columns: 10 },
      { path: `${BOAR_PATH}boar_hurt_1.webp`, frameCount: 13, frameSize: 500, frameHeight: 200, columns: 10 },
      { path: `${BOAR_PATH}boar_hurt_2.webp`, frameCount: 43, frameSize: 500, frameHeight: 200, columns: 10 },
    ],
    death: { path: `${BOAR_PATH}boar_death.webp`, frameCount: 29, frameSize: 500, frameHeight: 200, columns: 10 },
    frozen: { path: `${BOAR_PATH}boar_frozen.webp`, frameCount: 53, frameSize: 500, frameHeight: 200, columns: 10 },
    shock: { path: `${BOAR_PATH}boar_shock.webp`, frameCount: 65, frameSize: 500, frameHeight: 200, columns: 10 },
  },
};

export class Boar extends ConfigurableEnemy {
  IMAGES_ALERT = [];
  IMAGES_DEFENSE = [];
  isDefenseActive = false;
  idleAlertState = "idle";
  idleAlertStartedAt = 0;
  idleAlertFrameAt = 0;

  constructor(positionOverrides = {}) {
    super(BOAR_SETTINGS, positionOverrides);
    this.IMAGES_ALERT = this.loadAnimation(BOAR_SPRITES.alert);
    this.IMAGES_DEFENSE = this.loadAnimation(BOAR_SPRITES.defense);
    this.resetIdleAlertLoop();
  }

  tryStartAttack() {
    const wasAttacking = this.isAttacking;
    super.tryStartAttack();
    if (!wasAttacking && this.isAttacking) this.isDefenseActive = false;
  }

  updateAttackFlag() {
    const isAttackFinished = this.currentAnimation === "attack" && this.currentImage >= this.IMAGES_ATTACK.length;
    super.updateAttackFlag();
    if (isAttackFinished) this.isDefenseActive = true;
  }

  updateAggro() {
    const wasAggro = this.isAggro;
    super.updateAggro();
    if (wasAggro && !this.isAggro) this.resetIdleAlertLoop();
  }

  arriveAtSpawn() {
    super.arriveAtSpawn();
    this.resetIdleAlertLoop();
  }

  getAnimationState() {
    const state = super.getAnimationState();
    if (this.isReturning && this.isMoving && this.IMAGES_RUN.length) return { state: "run", images: this.IMAGES_RUN };
    if (state.state === "idle" && this.isAggro && this.isDefenseActive) return { state: "defense", images: this.IMAGES_DEFENSE };
    if (!this.isAggro && !this.isReturning && state.state === "idle") return this.getIdleAlertState();
    return state;
  }

  playStateAnimation(state, images) {
    if (state === "defense" && this.currentImage >= images.length) {
      this.img = this.imageCache[images[images.length - 1]];
      return;
    }
    if (!["idle", "alert"].includes(state)) {
      super.playStateAnimation(state, images);
      return;
    }
    this.playIdleAlertAnimation(images);
  }

  getIdleAlertState() {
    if (gameLoop.now() - this.idleAlertStartedAt >= IDLE_ALERT_ANIMATION_DURATION) this.switchIdleAlertState();
    return { state: this.idleAlertState, images: this.idleAlertState === "idle" ? this.IMAGES_IDLE : this.IMAGES_ALERT };
  }

  switchIdleAlertState() {
    this.idleAlertState = this.idleAlertState === "idle" ? "alert" : "idle";
    this.idleAlertStartedAt = gameLoop.now();
    this.idleAlertFrameAt = this.idleAlertStartedAt;
  }

  playIdleAlertAnimation(images) {
    if (gameLoop.now() - this.idleAlertFrameAt >= IDLE_ALERT_FRAME_DURATION) this.advanceIdleAlertFrame(images);
    this.img = this.imageCache[images[this.currentImage]];
  }

  advanceIdleAlertFrame(images) {
    this.currentImage = Math.min(this.currentImage + 1, images.length - 1);
    this.idleAlertFrameAt = gameLoop.now();
  }

  resetIdleAlertLoop() {
    this.isDefenseActive = false;
    this.currentImage = 0;
    this.idleAlertState = "idle";
    this.idleAlertStartedAt = gameLoop.now();
    this.idleAlertFrameAt = this.idleAlertStartedAt;
  }
}
