import { gameLoop } from "./game-loop.class.js";
import { ConfigurableEnemy } from "./configurable-enemy.class.js";

const IDLE_ALERT_FRAME_DURATION = 120;
const BOAR_PATH = "assets/images/3_enemies/boar/";
const BOAR_FRAME = { frameSize: 248, frameHeight: 97 };
function getBoarSprite(name, frameCount) {
  return { path: `${BOAR_PATH}boar_${name}.webp`, frameCount, ...BOAR_FRAME, columns: Math.min(10, frameCount) };
}
const BOAR_SPRITES = {
  walk: getBoarSprite("walk", 74),
  alert: getBoarSprite("alert", 82),
  defense: getBoarSprite("defense", 67),
};
const IDLE_ALERT_ANIMATION_DURATION = Math.max(BOAR_SPRITES.walk.frameCount, BOAR_SPRITES.alert.frameCount) * IDLE_ALERT_FRAME_DURATION;
const BOAR_SETTINGS = {
  pixelScale: 1,
  animationInterval: 80,
  attackAnimationInterval: 30,
  runAnimationInterval: 45,
  chaseSpeedFactor: 2,
  aggroFootTolerance: 77,
  position: { x: 0, y: 0, width: BOAR_FRAME.frameSize, height: BOAR_FRAME.frameHeight, speed: 1.8, minX: 0, maxX: 0 },
  hitbox: { top: 25, right: 75, bottom: 4, left: 75 },
  attackHitbox: { top: 15, right: 8, bottom: 4, left: 59 },
  attackHitStartFrame: 6,
  sprites: {
    idle: BOAR_SPRITES.walk,
    walk: BOAR_SPRITES.walk,
    run: getBoarSprite("run", 60),
    attack: [{ ...getBoarSprite("attack_0", 46), hitStartFrame: 25 }],
    hurt: [getBoarSprite("hurt_0", 8), getBoarSprite("hurt_1", 8), getBoarSprite("hurt_2", 8)],
    death: getBoarSprite("death", 29),
    frozen: getBoarSprite("frozen", 53),
    shock: getBoarSprite("shock", 33),
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

  getReturnSpeed() {
    return this.speed * this.chaseSpeedFactor;
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
