import { gameLoop } from "./game-loop.class.js";
import { ConfigurableEnemy } from "./configurable-enemy.class.js";

const IDLE_ALERT_CYCLE_DURATION = 10000;
const IDLE_ALERT_ANIMATION_DURATION = IDLE_ALERT_CYCLE_DURATION / 2;
const IDLE_ALERT_FRAME_DURATION = IDLE_ALERT_ANIMATION_DURATION / 10;
const BOAR_PATH = "assets/images/3_enemies/boar/";
const BOAR_SPRITES = {
  idle: { path: `${BOAR_PATH}boar_idle.webp`, frameCount: 10, frameSize: 500, frameHeight: 200 },
  alert: { path: `${BOAR_PATH}boar_alert.webp`, frameCount: 10, frameSize: 500, frameHeight: 200 },
};
const BOAR_SETTINGS = {
  position: { x: 2300, y: 307, width: 180, height: 160, speed: 1.5, minX: 2150, maxX: 2550 },
  hitbox: { top: 45, right: 30, bottom: 20, left: 30 },
  attackHitbox: { top: 35, right: 10, bottom: 20, left: 10 },
  attackHitStartFrame: 6,
  sprites: {
    idle: BOAR_SPRITES.idle,
    walk: BOAR_SPRITES.idle,
    run: { path: `${BOAR_PATH}boar_run.webp`, frameCount: 10, frameSize: 500, frameHeight: 200 },
    attack: [
      { path: `${BOAR_PATH}boar_attack_0.webp`, frameCount: 10, frameSize: 500, frameHeight: 200 },
      { path: `${BOAR_PATH}boar_attack_1.webp`, frameCount: 10, frameSize: 500, frameHeight: 200 },
    ],
    hurt: [
      { path: `${BOAR_PATH}boar_hurt_0.webp`, frameCount: 10, frameSize: 500, frameHeight: 200 },
      { path: `${BOAR_PATH}boar_hurt_1.webp`, frameCount: 10, frameSize: 500, frameHeight: 200 },
      { path: `${BOAR_PATH}boar_hurt_2.webp`, frameCount: 10, frameSize: 500, frameHeight: 200 },
    ],
    death: { path: `${BOAR_PATH}boar_death.webp`, frameCount: 10, frameSize: 500, frameHeight: 200 },
    frozen: { path: `${BOAR_PATH}boar_frozen.webp`, frameCount: 10, frameSize: 500, frameHeight: 200 },
    shock: { path: `${BOAR_PATH}boar_shock.webp`, frameCount: 10, frameSize: 500, frameHeight: 200 },
  },
};

export class Boar extends ConfigurableEnemy {
  IMAGES_ALERT = [];
  idleAlertState = "idle";
  idleAlertStartedAt = 0;
  idleAlertFrameAt = 0;

  constructor(positionOverrides = {}) {
    super(BOAR_SETTINGS, positionOverrides);
    this.isMovable = false;
    this.isMoving = false;
    this.IMAGES_ALERT = this.loadAnimation(BOAR_SPRITES.alert);
    this.resetIdleAlertLoop();
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
    if (!this.isAggro && !this.isReturning && ["idle", "walk", "run"].includes(state.state)) return this.getIdleAlertState();
    return state;
  }

  playStateAnimation(state, images) {
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
    this.currentImage = (this.currentImage + 1) % images.length;
    this.idleAlertFrameAt = gameLoop.now();
  }

  resetIdleAlertLoop() {
    this.idleAlertState = "idle";
    this.idleAlertStartedAt = gameLoop.now();
    this.idleAlertFrameAt = this.idleAlertStartedAt;
  }
}
