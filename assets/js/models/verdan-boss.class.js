import { gameLoop } from "./game-loop.class.js";
import { playSfx } from "../sfx.js";
import { MoveableObject } from "./movable-object.class.js";

const VERDAN_PATH = "assets/images/4_final_boss/verdan/verdan_";
const VERDAN_FRAME_WIDTH = 360;
const VERDAN_FRAME_HEIGHT = 336;
const MAX_SHEET_COLUMNS = 8;
const IS_SMOOTHING_ENABLED = true;
const ATTACK_RANGE = 150;
const FACE_DEAD_ZONE = 8;

export const VERDAN_SETTINGS = {
  idle: { file: "idle", frames: 8, frameDuration: 125 },
  idleRage: { file: "idle_rage", frames: 8, frameDuration: 100 },
  walk: { file: "walk", frames: 8, frameDuration: 100, speed: 1.75 },
  walkRage: { file: "walk_rage", frames: 8, frameDuration: 83, speed: 2.4 },
  attackBow: { file: "attack_bow", frames: 14, frameDuration: 83, warningFrames: [5, 8], actionFrame: 9, spawn: { x: 88, y: -170 } },
  attackBowRage: { file: "attack_bow_rage", frames: 14, frameDuration: 71, warningFrames: [5, 8], actionFrame: 9, spawn: { x: 95, y: -163 } },
  attackRoots: { file: "attack_roots", frames: 14, frameDuration: 83, warningFrames: [2, 6], actionFrame: 7, spawn: { x: 63, y: 0 } },
  attackRootsRage: { file: "attack_roots_rage", frames: 14, frameDuration: 71, warningFrames: [2, 6], actionFrame: 7, spawn: { x: 63, y: 0 } },
  attackPulse: { file: "attack_pulse", frames: 16, frameDuration: 83, warningFrames: [2, 8], actionFrame: 9, spawn: { x: -2, y: -165 } },
  hurt: { file: "hurt", frames: 5, frameDuration: 83 },
  hurtRage: { file: "hurt_rage", frames: 5, frameDuration: 83 },
  phaseTransition: { file: "phase_transition", frames: 22, frameDuration: 100, rageFrame: 12 },
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
  state = "idle";
  target = null;
  arena = null;
  animationStartedAt = 0;
  drawHitbox = true;

  constructor() {
    super();
    this.IMAGES_IDLE = this.loadSheet(VERDAN_SETTINGS.idle);
    this.IMAGES_WALK = this.loadSheet(VERDAN_SETTINGS.walk);
    this.IMAGES_HURT = this.loadSheet(VERDAN_SETTINGS.hurt);
    this.IMAGES_DEATH = this.loadSheet(VERDAN_SETTINGS.death);
    this.img = this.imageCache[this.IMAGES_IDLE[0]];
    this.animationStartedAt = gameLoop.now();
    gameLoop.runEvery(1000 / 60, () => this.updateBoss());
  }

  loadSheet({ file, frames }) {
    const columns = Math.min(frames, MAX_SHEET_COLUMNS);
    return this.loadSpriteSheet(`${VERDAN_PATH}${file}.webp`, frames, VERDAN_FRAME_WIDTH, VERDAN_FRAME_HEIGHT, null, columns);
  }

  setArena(range) {
    this.arena = { minX: this.x - range / 2, maxX: this.x + range / 2 };
  }

  updateBoss() {
    if (this.state === "death") this.playDeath();
    else if (this.state === "hurt") this.playHurt();
    else this.updateMovement();
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
    if (this.state === "walk") this.playLoop(this.IMAGES_WALK, VERDAN_SETTINGS.walk.frameDuration);
    else this.playLoop(this.IMAGES_IDLE, VERDAN_SETTINGS.idle.frameDuration);
  }

  hit() {
    if (!super.hit()) return false;
    playSfx("enemyHit");
    if (this.isDead()) this.startDeath();
    else this.startAnimation("hurt");
    return true;
  }

  startDeath() {
    playSfx("finalBossDeath");
    this.startAnimation("death");
  }

  startAnimation(state) {
    this.state = state;
    this.animationStartedAt = gameLoop.now();
  }

  playHurt() {
    const frame = this.getElapsedFrame(VERDAN_SETTINGS.hurt.frameDuration);
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

  draw(ctx) {
    ctx.save();
    ctx.imageSmoothingEnabled = IS_SMOOTHING_ENABLED;
    super.draw(ctx);
    ctx.restore();
  }
}
