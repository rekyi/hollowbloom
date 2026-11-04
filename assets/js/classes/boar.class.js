import { gameLoop } from "./game-loop.class.js";
import { ConfigurableEnemy } from "./configurable-enemy.class.js";

const IDLE_ALERT_FRAME_DURATION = 120;
const DEFENSE_CROUCH_START_FRAME = 11;
const DEFENSE_RISE_START_FRAME = 48;
const DEFENSE_STANDING_FRAME = 60;
const DEFENSE_LOWERING_FRAME_LAG = 2;
const ATTACK_LUNGE_START_FRAME = 16;
const ATTACK_FRAMES_PER_RISE_FRAME = 5 / 12;
const DEFENSE_FOLLOW_MAX_GAP = 40;
const BOAR_PATH = "assets/images/enemies/boar/";
const BOAR_FRAME = { frameSize: 248, frameHeight: 97 };
/**
 * Builds the sprite config of a boar animation.
 * @param {string} name - Animation name in the file name.
 * @param {number} frameCount - Number of frames.
 * @returns {Object} Sprite path, frame count, frame size and columns.
 */
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
  hp: 3,
  animationInterval: 80,
  attackAnimationInterval: 30,
  runAnimationInterval: 45,
  chaseSpeedFactor: 2,
  aggroFootTolerance: 77,
  position: { x: 0, y: 0, width: BOAR_FRAME.frameSize, height: BOAR_FRAME.frameHeight, speed: 1.8, minX: 0, maxX: 0 },
  hitbox: { top: 25, right: 75, bottom: 4, left: 75 },
  attackHitbox: { top: 15, right: 8, bottom: 4, left: 59 },
  attackHitStartFrame: 6,
  sfx: { hurt: "boarHurt", death: "boarDeath" },
  sprites: {
    idle: BOAR_SPRITES.walk,
    walk: BOAR_SPRITES.walk,
    run: getBoarSprite("run", 60),
    attack: [{ ...getBoarSprite("attack_0", 46), hitStartFrame: 25, sfx: "boarAttack", sfxFrame: 11 }],
    hurt: [getBoarSprite("hurt_0", 8), getBoarSprite("hurt_1", 8), getBoarSprite("hurt_2", 8)],
    death: getBoarSprite("death", 29),
    frozen: getBoarSprite("frozen", 53),
    shock: getBoarSprite("shock", 33),
  },
};

/** Boar enemy with idle/alert loop, defensive stance after attacks and a charging attack. */
export class Boar extends ConfigurableEnemy {
  IMAGES_ALERT = [];
  IMAGES_DEFENSE = [];
  isDefenseActive = false;
  idleAlertState = "idle";
  idleAlertStartedAt = 0;
  idleAlertFrameAt = 0;

  /**
   * @param {Object} [positionOverrides={}] - Values that override the default position settings.
   */
  constructor(positionOverrides = {}) {
    super(BOAR_SETTINGS, positionOverrides);
    this.IMAGES_ALERT = this.loadAnimation(BOAR_SPRITES.alert);
    this.IMAGES_DEFENSE = this.loadAnimation(BOAR_SPRITES.defense);
    this.resetIdleAlertLoop();
  }

  /**
   * Gets the animation scheduler interval.
   * @returns {number} Interval in milliseconds (60 fps).
   */
  getAnimationSchedulerInterval() {
    return 1000 / 60;
  }

  /** Starts an attack and continues it seamlessly from the current defense frame. */
  tryStartAttack() {
    const wasAttacking = this.isAttacking;
    const defenseFrame = this.getDisplayedDefenseFrame();
    super.tryStartAttack();
    if (wasAttacking || !this.isAttacking) return;
    this.isDefenseActive = false;
    if (defenseFrame !== null) this.continueAttackFromDefense(defenseFrame);
  }

  /**
   * Gets the currently displayed defense frame.
   * @returns {?number} Frame index, or null if not in defense.
   */
  getDisplayedDefenseFrame() {
    return this.currentAnimation === "defense" ? Math.max(0, this.currentImage - 1) : null;
  }

  /**
   * Switches to the attack at the frame matching the defense pose.
   * @param {number} defenseFrame - Displayed defense frame.
   */
  continueAttackFromDefense(defenseFrame) {
    this.currentAnimation = "attack";
    this.currentImage = getAttackFrameForDefense(defenseFrame);
  }

  /** Ends the attack and enters the defense stance after a finished attack. */
  updateAttackFlag() {
    const isAttackFinished = this.currentAnimation === "attack" && this.currentImage >= this.IMAGES_ATTACK.length;
    super.updateAttackFlag();
    if (isAttackFinished) this.isDefenseActive = true;
  }

  /** Updates aggro and restarts the idle/alert loop when aggro ends. */
  updateAggro() {
    const wasAggro = this.isAggro;
    super.updateAggro();
    if (wasAggro && !this.isAggro) this.resetIdleAlertLoop();
  }

  /** Arrives at the spawn and restarts the idle/alert loop. */
  arriveAtSpawn() {
    super.arriveAtSpawn();
    this.resetIdleAlertLoop();
  }

  /**
   * Gets the return speed, equal to the chase speed.
   * @returns {number} Speed per tick.
   */
  getReturnSpeed() {
    return this.speed * this.chaseSpeedFactor;
  }

  /**
   * Determines the animation state including return run, defense and idle/alert.
   * @returns {{state: string, images: string[]}} State name and its frames.
   */
  getAnimationState() {
    const state = super.getAnimationState();
    if (this.isReturning && this.isMoving && this.IMAGES_RUN.length) return { state: "run", images: this.IMAGES_RUN };
    if (this.isAggro && this.isDefenseActive && this.isDefenseState(state.state)) return { state: "defense", images: this.IMAGES_DEFENSE };
    if (!this.isAggro && !this.isReturning && state.state === "idle") return this.getIdleAlertState();
    return state;
  }

  /**
   * Checks whether a state should be shown as defense stance.
   * @param {string} state - Base animation state.
   * @returns {boolean} True when idle or following closely.
   */
  isDefenseState(state) {
    return state === "idle" || (state === "run" && this.getChaseGap() <= DEFENSE_FOLLOW_MAX_GAP);
  }

  /**
   * Gets the horizontal gap between the attack hitbox and the target.
   * @returns {number} Gap in pixels.
   */
  getChaseGap() {
    const targetHitbox = this.target.getHitbox();
    const attackHitbox = this.getAttackHitbox();
    if (this.isOppositeDirection) return attackHitbox.x - (targetHitbox.x + targetHitbox.width);
    return targetHitbox.x - (attackHitbox.x + attackHitbox.width);
  }

  /**
   * Plays a state animation, holding the last defense frame and timing idle/alert separately.
   * @param {string} state - Animation state name.
   * @param {string[]} images - Frames of the state.
   */
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

  /**
   * Gets the idle or alert state, switching between them after each loop.
   * @returns {{state: string, images: string[]}} State name and its frames.
   */
  getIdleAlertState() {
    if (gameLoop.now() - this.idleAlertStartedAt >= IDLE_ALERT_ANIMATION_DURATION) this.switchIdleAlertState();
    return { state: this.idleAlertState, images: this.idleAlertState === "idle" ? this.IMAGES_IDLE : this.IMAGES_ALERT };
  }

  /** Toggles between idle and alert and restarts the timers. */
  switchIdleAlertState() {
    this.idleAlertState = this.idleAlertState === "idle" ? "alert" : "idle";
    this.idleAlertStartedAt = gameLoop.now();
    this.idleAlertFrameAt = this.idleAlertStartedAt;
  }

  /**
   * Shows the idle/alert animation at its own frame rate.
   * @param {string[]} images - Frames of the idle or alert animation.
   */
  playIdleAlertAnimation(images) {
    if (gameLoop.now() - this.idleAlertFrameAt >= IDLE_ALERT_FRAME_DURATION) this.advanceIdleAlertFrame(images);
    this.img = this.imageCache[images[this.currentImage]];
  }

  /**
   * Advances to the next idle/alert frame and holds the last one.
   * @param {string[]} images - Frames of the idle or alert animation.
   */
  advanceIdleAlertFrame(images) {
    this.currentImage = Math.min(this.currentImage + 1, images.length - 1);
    this.idleAlertFrameAt = gameLoop.now();
  }

  /** Leaves the defense stance and restarts the idle/alert loop. */
  resetIdleAlertLoop() {
    this.isDefenseActive = false;
    this.currentImage = 0;
    this.idleAlertState = "idle";
    this.idleAlertStartedAt = gameLoop.now();
    this.idleAlertFrameAt = this.idleAlertStartedAt;
  }
}

/**
 * Maps a defense frame to the attack frame with the matching pose.
 * @param {number} defenseFrame - Displayed defense frame.
 * @returns {number} Attack frame to continue from.
 */
function getAttackFrameForDefense(defenseFrame) {
  if (defenseFrame < DEFENSE_CROUCH_START_FRAME) return Math.max(0, defenseFrame - DEFENSE_LOWERING_FRAME_LAG);
  if (defenseFrame < DEFENSE_RISE_START_FRAME) return ATTACK_LUNGE_START_FRAME;
  return Math.max(0, Math.round((DEFENSE_STANDING_FRAME - defenseFrame) * ATTACK_FRAMES_PER_RISE_FRAME));
}
