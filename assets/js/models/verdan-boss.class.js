import { gameLoop } from "./game-loop.class.js";
import { VerdanHealth } from "./verdan-health.class.js";
import { playSfx } from "../sfx.js";

const WALK_STOP_DISTANCE = 150;
const FACE_DEAD_ZONE = 8;
const INTRO_IDLE = 1500;
const AGGRO_DISTANCE = 2000;
const IDLE_DURATION = { normal: [800, 1200], rage: [400, 700] };
const COUNTER_DELAY = { normal: 350, rage: 250 };
const WALK_CYCLES = [2, 3];
const APPROACH_CYCLES = 3;
const ROOTS_MAX_DISTANCE = { normal: 295, rage: 355 };
const BOW_MIN_DISTANCE = { normal: 450, rage: 400 };
const BOW_MAX_DISTANCE = 600;
const PULSE_INTERVAL = 2;
const PULSE_RANGE = 250;
const COMBO_CHANCE = 0.5;

/** Verdan final boss: aggro, idle, walking and attack selection inside its arena. */
export class VerdanBoss extends VerdanHealth {
  target = null;
  arena = null;
  idleDuration = INTRO_IDLE;
  walkDuration = 0;
  lastStepFrame = -1;
  rageAttackCount = 0;
  isAggro = false;

  /** Creates the boss and starts its update loop at 60 fps. */
  constructor() {
    super();
    gameLoop.runEvery(1000 / 60, () => this.updateBoss());
  }

  /**
   * Limits the boss movement so its hitbox stays on the arena floor.
   * @param {{left: number, right: number}} floor - Floor bounds in pixels.
   */
  setArena({ left, right }) {
    const hitbox = this.getHitbox();
    const hitboxOffsetX = hitbox.x - this.x;
    this.arena = { minX: left - hitboxOffsetX, maxX: right - hitboxOffsetX - hitbox.width };
  }

  /** Runs one boss tick for the current state and updates the spike row. */
  updateBoss() {
    this.updateAggroLoss();
    if (this.state === "death") this.playDeath();
    else if (this.state === "transition") this.playTransition();
    else if (this.state === "hurt") this.playHurt();
    else if (this.state === "attack") this.playAttack();
    else if (this.state === "walk") this.updateWalk();
    else this.updateIdle();
    this.updateSpikeRow();
  }

  /** Faces the target, plays idle, checks aggro and selects an attack when idle ends. */
  updateIdle() {
    this.faceTarget(this.getTargetOffsetX());
    this.playLoop(this.IMAGES_IDLE, this.getPhaseSettings("idle").frameDuration);
    this.updateAggro();
    if (this.isIdleFinished()) this.selectAttack();
  }

  /** Drops aggro and the pending combo when the target leaves the aggro range. */
  updateAggroLoss() {
    const isBusy = this.state === "death" || this.state === "transition";
    if (!this.isAggro || isBusy || this.isTargetInAggroRange(this.getTargetOffsetX())) return;
    this.isAggro = false;
    this.pendingCombo = null;
  }

  /** Drops aggro, cancels attacks and returns to idle unless dying or transitioning. */
  resetAggro() {
    if (this.state === "death" || this.state === "transition") return;
    this.isAggro = false;
    this.cancelAttacks();
    if (this.state === "attack" || this.state === "walk") this.startIdle();
  }

  /** Enters aggro when a living target comes into range. */
  updateAggro() {
    const isInRange = this.isTargetInAggroRange(this.getTargetOffsetX());
    if (this.isAggro || !isInRange || !this.canChooseAttack()) return;
    this.isAggro = true;
    this.startAnimation("idle");
  }

  /**
   * Checks whether the target is within aggro distance.
   * @param {number} offsetX - Horizontal offset to the target.
   * @returns {boolean} True if in range.
   */
  isTargetInAggroRange(offsetX) {
    return Math.abs(offsetX) <= AGGRO_DISTANCE;
  }

  /**
   * Checks whether the idle phase is over and an attack can follow.
   * @returns {boolean} True if the boss should act.
   */
  isIdleFinished() {
    return this.isAggro && this.getElapsedTime() >= this.idleDuration && this.canChooseAttack();
  }

  /**
   * Checks whether there is a world and a living target.
   * @returns {boolean} True if the boss can attack.
   */
  canChooseAttack() {
    return Boolean(this.world && this.target) && !this.target.isDead();
  }

  /** Approaches the target or picks pulse, roots or bow based on distance and phase. */
  selectAttack() {
    const distance = Math.abs(this.getTargetOffsetX());
    if (this.isApproachNeeded(distance)) return this.startWalk(APPROACH_CYCLES);
    if (this.isRage) this.rageAttackCount++;
    if (this.shouldPulse(distance)) this.startPulseAttack();
    else if (distance <= this.getPhaseValue(ROOTS_MAX_DISTANCE)) this.startRootsSequence();
    else this.startBowAttack();
  }

  /**
   * Checks whether the boss must walk closer before attacking.
   * @param {number} distance - Horizontal distance to the target.
   * @returns {boolean} True if out of attack range and able to move.
   */
  isApproachNeeded(distance) {
    const isBetweenAttacks = distance > this.getPhaseValue(ROOTS_MAX_DISTANCE) && distance < this.getPhaseValue(BOW_MIN_DISTANCE);
    const isTooFarForBow = distance > BOW_MAX_DISTANCE;
    return (isBetweenAttacks || isTooFarForBow) && this.getNextX() !== this.x;
  }

  /**
   * Checks whether the rage pulse attack is due and the target is close.
   * @param {number} distance - Horizontal distance to the target.
   * @returns {boolean} True if the pulse should be used.
   */
  shouldPulse(distance) {
    return this.isRage && this.rageAttackCount % PULSE_INTERVAL === 1 && distance <= PULSE_RANGE;
  }

  /** Starts the roots attack and, in rage, possibly queues a bow attack as combo. */
  startRootsSequence() {
    this.pendingCombo = this.isRage && Math.random() < COMBO_CHANCE ? "startBowAttack" : null;
    this.startRootsAttack();
  }

  /** After an attack, enters rage, continues a combo or walks a few cycles. */
  finishAttack() {
    if (this.isRagePending) return this.startTransition();
    if (this.pendingCombo) return this.startPendingCombo();
    this.startWalk(this.getRandomInt(WALK_CYCLES));
  }

  /** Faces the target and starts the queued combo attack. */
  startPendingCombo() {
    const action = this.pendingCombo;
    this.pendingCombo = null;
    this.faceTarget(this.getTargetOffsetX());
    this[action]();
  }

  /**
   * Starts idling for a duration.
   * @param {number} [duration] - Idle time in milliseconds, random per phase by default.
   */
  startIdle(duration = this.getRandomBetween(this.getPhaseValue(IDLE_DURATION))) {
    this.idleDuration = duration;
    this.startAnimation("idle");
  }

  /** Starts a short idle before a counter attack. */
  startCounterIdle() {
    this.startIdle(this.getPhaseValue(COUNTER_DELAY));
  }

  /** Shortens the current idle so the boss counters soon. */
  prepareCounter() {
    if (this.state !== "idle") return;
    this.idleDuration = Math.min(this.idleDuration, this.getElapsedTime() + this.getPhaseValue(COUNTER_DELAY));
  }

  /**
   * Starts walking for a number of walk cycles.
   * @param {number} cycles - Number of full walk animations.
   */
  startWalk(cycles) {
    const { frames, frameDuration } = this.getPhaseSettings("walk");
    this.walkDuration = cycles * frames * frameDuration;
    this.lastStepFrame = -1;
    this.startAnimation("walk");
  }

  /** Walks toward the target inside the arena until the walk is finished. */
  updateWalk() {
    const offsetX = this.getTargetOffsetX();
    this.faceTarget(offsetX);
    const nextX = this.getNextX();
    if (this.isWalkFinished(offsetX, nextX)) return this.startIdle();
    this.x = nextX;
    this.playLoop(this.IMAGES_WALK, this.getPhaseSettings("walk").frameDuration);
    this.playWalkStep();
  }

  /** Plays a step sound on the step frames of the walk animation. */
  playWalkStep() {
    if (this.currentImage === this.lastStepFrame) return;
    this.lastStepFrame = this.currentImage;
    if (this.getPhaseSettings("walk").stepFrames.includes(this.currentImage)) playSfx("verdanWalk");
  }

  /**
   * Checks whether the walk should end.
   * @param {number} offsetX - Horizontal offset to the target.
   * @param {number} nextX - Next x position inside the arena.
   * @returns {boolean} True if time is up, the target is close or out of range, or the arena edge is reached.
   */
  isWalkFinished(offsetX, nextX) {
    return this.getElapsedTime() >= this.walkDuration || Math.abs(offsetX) <= WALK_STOP_DISTANCE || nextX === this.x || !this.isTargetInAggroRange(offsetX);
  }

  /**
   * Gets the horizontal offset from the boss center to the target hitbox center.
   * @returns {number} Offset in pixels, negative if the target is left.
   */
  getTargetOffsetX() {
    if (!this.target) return 0;
    const targetHitbox = this.target.getHitbox();
    return targetHitbox.x + targetHitbox.width / 2 - (this.x + this.width / 2);
  }

  /**
   * Turns toward the target unless it is almost centered.
   * @param {number} offsetX - Horizontal offset to the target.
   */
  faceTarget(offsetX) {
    if (Math.abs(offsetX) <= FACE_DEAD_ZONE) return;
    this.faceDirection(offsetX < 0);
  }

  /**
   * Gets the x position after one step in facing direction, clamped to the arena.
   * @returns {number} Next x position.
   */
  getNextX() {
    if (!this.arena) return this.x;
    const step = this.isOppositeDirection ? -this.speed : this.speed;
    return Math.min(Math.max(this.x + step, this.arena.minX), this.arena.maxX);
  }

  /**
   * Gets a random number in a range.
   * @param {number[]} range - [min, max].
   * @returns {number} Random number between min and max.
   */
  getRandomBetween([min, max]) {
    return min + Math.random() * (max - min);
  }

  /**
   * Gets a random integer in an inclusive range.
   * @param {number[]} range - [min, max].
   * @returns {number} Random integer between min and max.
   */
  getRandomInt([min, max]) {
    return min + Math.floor(Math.random() * (max - min + 1));
  }
}
