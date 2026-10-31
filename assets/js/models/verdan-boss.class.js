import { gameLoop } from "./game-loop.class.js";
import { playSfx } from "../sfx.js";
import { MoveableObject } from "./movable-object.class.js";
import { BossEffect } from "./boss-effect.class.js";

const VERDAN_PATH = "assets/images/4_final_boss/verdan/verdan_";
const VERDAN_FRAME_WIDTH = 360;
const VERDAN_FRAME_HEIGHT = 336;
const MAX_SHEET_COLUMNS = 8;
const IS_SMOOTHING_ENABLED = true;
const ATTACK_RANGE = 150;
const FACE_DEAD_ZONE = 8;
const IS_DEBUG_ATTACK_ENABLED = true;
const DEBUG_ATTACK_KEYS = { Digit1: "startRootsAttack", Digit0: "spawnTestSpike", Digit9: "spawnTestArrow" };
const TEST_ARROW_MOTION = { speedX: 375, speedY: -143, gravity: 255 };

export const VERDAN_SETTINGS = {
  idle: { file: "idle", frames: 8, frameDuration: 125 },
  idleRage: { file: "idle_rage", frames: 8, frameDuration: 100 },
  walk: { file: "walk", frames: 8, frameDuration: 100, speed: 1.75 },
  walkRage: { file: "walk_rage", frames: 8, frameDuration: 83, speed: 2.4 },
  attackBow: { file: "attack_bow", frames: 14, frameDuration: 83, warningFrames: [5, 8], actionFrame: 9, spawn: { x: 88, y: -170 } },
  attackBowRage: { file: "attack_bow_rage", frames: 14, frameDuration: 71, warningFrames: [5, 8], actionFrame: 9, spawn: { x: 95, y: -163 } },
  attackRoots: { file: "attack_roots", frames: 14, frameDuration: 83, warningFrames: [2, 6], actionFrame: 7, spawn: { x: 63, y: 0 }, spikes: { count: 5, spacing: 48, interval: 110 } },
  attackRootsRage: { file: "attack_roots_rage", frames: 14, frameDuration: 71, warningFrames: [2, 6], actionFrame: 7, spawn: { x: 63, y: 0 }, spikes: { count: 7, spacing: 42, interval: 110 } },
  attackPulse: { file: "attack_pulse", frames: 16, frameDuration: 83, warningFrames: [2, 8], actionFrame: 9, spawn: { x: -2, y: -165 } },
  hurt: { file: "hurt", frames: 5, frameDuration: 83 },
  hurtRage: { file: "hurt_rage", frames: 5, frameDuration: 83 },
  phaseTransition: { file: "phase_transition", frames: 22, frameDuration: 100, rageFrame: 12, roarFrame: 14 },
  death: { file: "death", frames: 26, frameDuration: 100, decayFrame: 11 },
  fxSeedArrow: { file: "fx_seed_arrow", frames: 4, frameDuration: 83, width: 126, height: 60, pivot: { x: 78, y: 30 } },
  fxSeedArrowRage: { file: "fx_seed_arrow_rage", frames: 4, frameDuration: 83, width: 126, height: 60, pivot: { x: 78, y: 30 } },
  fxSeedImpact: { file: "fx_seed_impact", frames: 12, frameDuration: 83, width: 108, height: 96, pivot: { x: 54, y: 87 }, damageFrames: [3, 8], hitbox: { width: 39, height: 45 } },
  fxSeedImpactRage: { file: "fx_seed_impact_rage", frames: 12, frameDuration: 83, width: 108, height: 96, pivot: { x: 54, y: 87 }, damageFrames: [3, 8], hitbox: { width: 39, height: 45 } },
  fxRootSpike: { file: "fx_root_spike", frames: 14, frameDuration: 71, width: 84, height: 180, pivot: { x: 42, y: 171 }, warningFrames: [0, 3], damageFrames: [4, 10], hitbox: { width: 24, height: 135 } },
  fxRootSpikeRage: { file: "fx_root_spike_rage", frames: 14, frameDuration: 71, width: 84, height: 180, pivot: { x: 42, y: 171 }, warningFrames: [0, 3], damageFrames: [4, 10], hitbox: { width: 24, height: 135 } },
  fxPulseBurst: { file: "fx_pulse_burst", frames: 12, frameDuration: 71, width: 384, height: 384, pivot: { x: 192, y: 192 }, maxRadius: 159 },
  fxPulseWave: { file: "fx_pulse_wave", frames: 6, frameDuration: 83, width: 108, height: 96, pivot: { x: 54, y: 90 }, hitbox: { width: 30, height: 45 } },
};

export class VerdanBoss extends MoveableObject {
  IMAGES_IDLE = [];
  IMAGES_WALK = [];
  IMAGES_HURT = [];
  IMAGES_DEATH = [];
  IMAGES_IDLE_RAGE = [];
  IMAGES_WALK_RAGE = [];
  IMAGES_HURT_RAGE = [];
  IMAGES_TRANSITION = [];
  width = VERDAN_FRAME_WIDTH;
  height = VERDAN_FRAME_HEIGHT;
  hp = 8;
  maxHp = 8;
  offset = { top: 98, right: 146, bottom: 18, left: 146 };
  speed = VERDAN_SETTINGS.walk.speed;
  isOppositeDirection = true;
  isFinalBoss = true;
  isDeathAnimationFinished = false;
  isKeptAfterDeath = true;
  isRage = false;
  isRoarTriggered = false;
  state = "idle";
  target = null;
  arena = null;
  animationStartedAt = 0;
  effectFrames = {};
  attackFrames = {};
  currentAttack = null;
  spikeRow = null;
  drawHitbox = true;

  constructor() {
    super();
    this.IMAGES_IDLE = this.loadSheet(VERDAN_SETTINGS.idle);
    this.IMAGES_WALK = this.loadSheet(VERDAN_SETTINGS.walk);
    this.IMAGES_HURT = this.loadSheet(VERDAN_SETTINGS.hurt);
    this.IMAGES_DEATH = this.loadSheet(VERDAN_SETTINGS.death);
    this.IMAGES_IDLE_RAGE = this.loadSheet(VERDAN_SETTINGS.idleRage);
    this.IMAGES_WALK_RAGE = this.loadSheet(VERDAN_SETTINGS.walkRage);
    this.IMAGES_HURT_RAGE = this.loadSheet(VERDAN_SETTINGS.hurtRage);
    this.IMAGES_TRANSITION = this.loadSheet(VERDAN_SETTINGS.phaseTransition);
    this.effectFrames = this.loadSheetGroup("fx");
    this.attackFrames = this.loadSheetGroup("attack");
    this.img = this.imageCache[this.IMAGES_IDLE[0]];
    this.animationStartedAt = gameLoop.now();
    gameLoop.runEvery(1000 / 60, () => this.updateBoss());
  }

  loadSheet({ file, frames, width = VERDAN_FRAME_WIDTH, height = VERDAN_FRAME_HEIGHT }) {
    const columns = Math.min(frames, MAX_SHEET_COLUMNS);
    return this.loadSpriteSheet(`${VERDAN_PATH}${file}.webp`, frames, width, height, null, columns);
  }

  loadSheetGroup(prefix) {
    const keys = Object.keys(VERDAN_SETTINGS).filter((key) => key.startsWith(prefix));
    return Object.fromEntries(keys.map((key) => [key, this.loadSheet(VERDAN_SETTINGS[key])]));
  }

  setArena(range) {
    this.arena = { minX: this.x - range / 2, maxX: this.x + range / 2 };
  }

  updateBoss() {
    if (this.state === "death") this.playDeath();
    else if (this.state === "transition") this.playTransition();
    else if (this.state === "hurt") this.playHurt();
    else if (this.state === "attack") this.playAttack();
    else this.updateMovement();
    this.updateSpikeRow();
  }

  updateMovement() {
    const offsetX = this.getTargetOffsetX();
    this.faceTarget(offsetX);
    const nextX = this.getNextX();
    const isWalking = Math.abs(offsetX) > ATTACK_RANGE && nextX !== this.x;
    this.changeState(isWalking ? "walk" : "idle");
    if (isWalking) this.x = nextX;
    this.playMovementLoop();
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

  changeState(state) {
    if (this.state !== state) this.startAnimation(state);
  }

  playMovementLoop() {
    if (this.state === "walk") this.playLoop(this.IMAGES_WALK, this.getPhaseSettings("walk").frameDuration);
    else this.playLoop(this.IMAGES_IDLE, this.getPhaseSettings("idle").frameDuration);
  }

  getPhaseKey(key) {
    return this.isRage ? `${key}Rage` : key;
  }

  getPhaseSettings(key) {
    return VERDAN_SETTINGS[this.getPhaseKey(key)];
  }

  hit() {
    if (this.state === "transition") return false;
    if (!super.hit()) return false;
    playSfx("enemyHit");
    if (this.isDead()) this.startDeath();
    else if (this.shouldEnterRage()) this.startTransition();
    else this.startAnimation("hurt");
    return true;
  }

  shouldEnterRage() {
    return !this.isRage && this.hp <= this.maxHp / 2;
  }

  startTransition() {
    this.clearAttackEffects();
    this.startAnimation("transition");
  }

  startDeath() {
    playSfx("finalBossDeath");
    this.clearAttackEffects();
    this.startAnimation("death");
  }

  clearAttackEffects() {
    this.spikeRow = null;
    this.world?.clearBossEffects();
  }

  startAnimation(state) {
    this.state = state;
    this.animationStartedAt = gameLoop.now();
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
    this.startAnimation("idle");
  }

  playHurt() {
    const frame = this.getElapsedFrame(this.getPhaseSettings("hurt").frameDuration);
    if (frame < this.IMAGES_HURT.length) this.setFrame(this.IMAGES_HURT, frame);
    else this.startAnimation("idle");
  }

  playDeath() {
    const frame = this.getElapsedFrame(VERDAN_SETTINGS.death.frameDuration);
    this.setFrame(this.IMAGES_DEATH, Math.min(frame, this.IMAGES_DEATH.length - 1));
    this.isDeathAnimationFinished = frame >= this.IMAGES_DEATH.length;
  }

  playLoop(images, frameDuration) {
    this.setFrame(images, this.getElapsedFrame(frameDuration) % images.length);
  }

  getElapsedFrame(frameDuration) {
    return Math.floor((gameLoop.now() - this.animationStartedAt) / frameDuration);
  }

  setFrame(images, frame) {
    this.currentImage = frame;
    this.img = this.imageCache[images[frame]];
  }

  faceDirection(isLeft) {
    this.isOppositeDirection = isLeft;
  }

  isAttackFrameActive() {
    return false;
  }

  startRootsAttack() {
    this.startAttack("attackRoots", (settings) => this.startSpikeRow(settings));
  }

  startAttack(key, onAction) {
    if (this.state === "attack") return;
    this.currentAttack = { key, onAction, isActionTriggered: false };
    this.startAnimation("attack");
  }

  playAttack() {
    const phaseKey = this.getPhaseKey(this.currentAttack.key);
    const settings = VERDAN_SETTINGS[phaseKey];
    const frame = this.getElapsedFrame(settings.frameDuration);
    if (frame >= settings.frames) return this.startAnimation("idle");
    this.setFrame(this.attackFrames[phaseKey], frame);
    if (frame >= settings.actionFrame) this.triggerAttackAction(settings);
  }

  triggerAttackAction(settings) {
    if (this.currentAttack.isActionTriggered) return;
    this.currentAttack.isActionTriggered = true;
    this.currentAttack.onAction(settings);
  }

  startSpikeRow({ spawn, spikes }) {
    this.spikeRow = { spawn, spikes, spawnedCount: 0, startedAt: gameLoop.now(), origin: this.getFootPoint(), isLeft: this.isOppositeDirection, effectKey: this.getPhaseKey("fxRootSpike") };
  }

  updateSpikeRow() {
    if (!this.spikeRow) return;
    const { spikes, startedAt, spawnedCount } = this.spikeRow;
    const dueCount = Math.floor((gameLoop.now() - startedAt) / spikes.interval) + 1;
    if (spawnedCount < dueCount) this.spawnRowSpike();
    if (this.spikeRow.spawnedCount >= spikes.count) this.spikeRow = null;
  }

  spawnRowSpike() {
    const { spawn, spikes, spawnedCount, origin, isLeft, effectKey } = this.spikeRow;
    const spikeSpawn = { x: spawn.x + spawnedCount * spikes.spacing, y: spawn.y };
    this.spawnEffect(effectKey, { origin, spawn: spikeSpawn, isLeft });
    this.spikeRow.spawnedCount++;
  }

  handleDebugKey(code) {
    const action = DEBUG_ATTACK_KEYS[code];
    if (!IS_DEBUG_ATTACK_ENABLED || !action || !this.canSpawnEffects()) return;
    this[action]();
  }

  canSpawnEffects() {
    return Boolean(this.world) && !this.isDead() && this.state !== "transition";
  }

  spawnTestSpike() {
    this.spawnEffect("fxRootSpike", { spawn: VERDAN_SETTINGS.attackRoots.spawn });
  }

  spawnTestArrow() {
    this.spawnEffect("fxSeedArrow", { ...TEST_ARROW_MOTION, spawn: VERDAN_SETTINGS.attackBow.spawn, isLooping: true, isRotating: true });
  }

  spawnEffect(key, { origin = this.getFootPoint(), spawn = { x: 0, y: 0 }, isLeft = this.isOppositeDirection, speedX = 0, ...motion } = {}) {
    const pivotX = origin.x + (isLeft ? -spawn.x : spawn.x);
    const pivotY = origin.y + spawn.y;
    const effect = new BossEffect(VERDAN_SETTINGS[key], this.effectFrames[key], this.imageCache, { ...motion, pivotX, pivotY, isLeft, speedX: isLeft ? -speedX : speedX });
    this.world.level.bossEffects.push(effect);
  }

  getFootPoint() {
    return { x: this.x + this.width / 2, y: this.y + this.height - this.offset.bottom };
  }

  draw(ctx) {
    ctx.save();
    ctx.imageSmoothingEnabled = IS_SMOOTHING_ENABLED;
    super.draw(ctx);
    ctx.restore();
  }
}
