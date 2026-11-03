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

export class VerdanBoss extends VerdanHealth {
  target = null;
  arena = null;
  idleDuration = INTRO_IDLE;
  walkDuration = 0;
  lastStepFrame = -1;
  rageAttackCount = 0;
  isAggro = false;

  constructor() {
    super();
    gameLoop.runEvery(1000 / 60, () => this.updateBoss());
  }

  setArena({ left, right }) {
    const hitbox = this.getHitbox();
    const hitboxOffsetX = hitbox.x - this.x;
    this.arena = { minX: left - hitboxOffsetX, maxX: right - hitboxOffsetX - hitbox.width };
  }

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

  updateIdle() {
    this.faceTarget(this.getTargetOffsetX());
    this.playLoop(this.IMAGES_IDLE, this.getPhaseSettings("idle").frameDuration);
    this.updateAggro();
    if (this.isIdleFinished()) this.selectAttack();
  }

  updateAggroLoss() {
    const isBusy = this.state === "death" || this.state === "transition";
    if (!this.isAggro || isBusy || this.isTargetInAggroRange(this.getTargetOffsetX())) return;
    this.isAggro = false;
    this.pendingCombo = null;
  }

  resetAggro() {
    if (this.state === "death" || this.state === "transition") return;
    this.isAggro = false;
    this.cancelAttacks();
    if (this.state === "attack" || this.state === "walk") this.startIdle();
  }

  updateAggro() {
    const isInRange = this.isTargetInAggroRange(this.getTargetOffsetX());
    if (this.isAggro || !isInRange || !this.canChooseAttack()) return;
    this.isAggro = true;
    this.startAnimation("idle");
  }

  isTargetInAggroRange(offsetX) {
    return Math.abs(offsetX) <= AGGRO_DISTANCE;
  }

  isIdleFinished() {
    return this.isAggro && this.getElapsedTime() >= this.idleDuration && this.canChooseAttack();
  }

  canChooseAttack() {
    return Boolean(this.world && this.target) && !this.target.isDead();
  }

  selectAttack() {
    const distance = Math.abs(this.getTargetOffsetX());
    if (this.isApproachNeeded(distance)) return this.startWalk(APPROACH_CYCLES);
    if (this.isRage) this.rageAttackCount++;
    if (this.shouldPulse(distance)) this.startPulseAttack();
    else if (distance <= this.getPhaseValue(ROOTS_MAX_DISTANCE)) this.startRootsSequence();
    else this.startBowAttack();
  }

  isApproachNeeded(distance) {
    const isBetweenAttacks = distance > this.getPhaseValue(ROOTS_MAX_DISTANCE) && distance < this.getPhaseValue(BOW_MIN_DISTANCE);
    const isTooFarForBow = distance > BOW_MAX_DISTANCE;
    return (isBetweenAttacks || isTooFarForBow) && this.getNextX() !== this.x;
  }

  shouldPulse(distance) {
    return this.isRage && this.rageAttackCount % PULSE_INTERVAL === 1 && distance <= PULSE_RANGE;
  }

  startRootsSequence() {
    this.pendingCombo = this.isRage && Math.random() < COMBO_CHANCE ? "startBowAttack" : null;
    this.startRootsAttack();
  }

  finishAttack() {
    if (this.isRagePending) return this.startTransition();
    if (this.pendingCombo) return this.startPendingCombo();
    this.startWalk(this.getRandomInt(WALK_CYCLES));
  }

  startPendingCombo() {
    const action = this.pendingCombo;
    this.pendingCombo = null;
    this.faceTarget(this.getTargetOffsetX());
    this[action]();
  }

  startIdle(duration = this.getRandomBetween(this.getPhaseValue(IDLE_DURATION))) {
    this.idleDuration = duration;
    this.startAnimation("idle");
  }

  startCounterIdle() {
    this.startIdle(this.getPhaseValue(COUNTER_DELAY));
  }

  prepareCounter() {
    if (this.state !== "idle") return;
    this.idleDuration = Math.min(this.idleDuration, this.getElapsedTime() + this.getPhaseValue(COUNTER_DELAY));
  }

  startWalk(cycles) {
    const { frames, frameDuration } = this.getPhaseSettings("walk");
    this.walkDuration = cycles * frames * frameDuration;
    this.lastStepFrame = -1;
    this.startAnimation("walk");
  }

  updateWalk() {
    const offsetX = this.getTargetOffsetX();
    this.faceTarget(offsetX);
    const nextX = this.getNextX();
    if (this.isWalkFinished(offsetX, nextX)) return this.startIdle();
    this.x = nextX;
    this.playLoop(this.IMAGES_WALK, this.getPhaseSettings("walk").frameDuration);
    this.playWalkStep();
  }

  playWalkStep() {
    if (this.currentImage === this.lastStepFrame) return;
    this.lastStepFrame = this.currentImage;
    if (this.getPhaseSettings("walk").stepFrames.includes(this.currentImage)) playSfx("verdanWalk");
  }

  isWalkFinished(offsetX, nextX) {
    return this.getElapsedTime() >= this.walkDuration || Math.abs(offsetX) <= WALK_STOP_DISTANCE || nextX === this.x || !this.isTargetInAggroRange(offsetX);
  }

  getTargetOffsetX() {
    if (!this.target) return 0;
    const targetHitbox = this.target.getHitbox();
    return targetHitbox.x + targetHitbox.width / 2 - (this.x + this.width / 2);
  }

  faceTarget(offsetX) {
    if (Math.abs(offsetX) <= FACE_DEAD_ZONE) return;
    this.faceDirection(offsetX < 0);
  }

  getNextX() {
    if (!this.arena) return this.x;
    const step = this.isOppositeDirection ? -this.speed : this.speed;
    return Math.min(Math.max(this.x + step, this.arena.minX), this.arena.maxX);
  }

  getRandomBetween([min, max]) {
    return min + Math.random() * (max - min);
  }

  getRandomInt([min, max]) {
    return min + Math.floor(Math.random() * (max - min + 1));
  }
}
