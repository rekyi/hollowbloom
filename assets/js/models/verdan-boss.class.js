import { gameLoop } from "./game-loop.class.js";
import { MoveableObject } from "./movable-object.class.js";

const VERDAN_PATH = "assets/images/4_final_boss/verdan/verdan_";
const VERDAN_FRAME_WIDTH = 360;
const VERDAN_FRAME_HEIGHT = 336;
const MAX_SHEET_COLUMNS = 8;
const IS_SMOOTHING_ENABLED = true;

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
  width = VERDAN_FRAME_WIDTH;
  height = VERDAN_FRAME_HEIGHT;
  hp = 8;
  maxHp = 8;
  offset = { top: 98, right: 146, bottom: 18, left: 146 };
  isOppositeDirection = true;
  isFinalBoss = true;
  isDeathAnimationFinished = false;
  target = null;
  arena = null;
  animationStartedAt = 0;
  drawHitbox = true;

  constructor() {
    super();
    this.IMAGES_IDLE = this.loadSheet(VERDAN_SETTINGS.idle);
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
    this.playLoop(this.IMAGES_IDLE, VERDAN_SETTINGS.idle.frameDuration);
  }

  playLoop(images, frameDuration) {
    const frame = Math.floor((gameLoop.now() - this.animationStartedAt) / frameDuration) % images.length;
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
