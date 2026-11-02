import { gameLoop } from "./game-loop.class.js";
import { MoveableObject } from "./movable-object.class.js";
import { VERDAN_SETTINGS } from "../data.js";
import { playSfx } from "../sfx.js";

const VERDAN_PATH = "assets/images/4_final_boss/verdan/verdan_";
const VERDAN_FRAME_WIDTH = 360;
const VERDAN_FRAME_HEIGHT = 336;
const MAX_SHEET_COLUMNS = 8;
const IS_SMOOTHING_ENABLED = true;

export class VerdanBase extends MoveableObject {
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
  offset = { top: 98, right: 146, bottom: 18, left: 146 };
  speed = VERDAN_SETTINGS.walk.speed;
  isOppositeDirection = true;
  isFinalBoss = true;
  isKeptAfterDeath = true;
  isRage = false;
  state = "idle";
  animationStartedAt = 0;
  effectFrames = {};
  attackFrames = {};
  playedSounds = new Set();

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
  }

  loadSheet({ file, frames, width = VERDAN_FRAME_WIDTH, height = VERDAN_FRAME_HEIGHT }) {
    const columns = Math.min(frames, MAX_SHEET_COLUMNS);
    return this.loadSpriteSheet(`${VERDAN_PATH}${file}.webp`, frames, width, height, null, columns);
  }

  loadSheetGroup(prefix) {
    const keys = Object.keys(VERDAN_SETTINGS).filter((key) => key.startsWith(prefix));
    return Object.fromEntries(keys.map((key) => [key, this.loadSheet(VERDAN_SETTINGS[key])]));
  }

  getPhaseKey(key) {
    const rageKey = `${key}Rage`;
    return this.isRage && VERDAN_SETTINGS[rageKey] ? rageKey : key;
  }

  getPhaseSettings(key) {
    return VERDAN_SETTINGS[this.getPhaseKey(key)];
  }

  getPhaseValue({ normal, rage }) {
    return this.isRage ? rage : normal;
  }

  startAnimation(state) {
    this.state = state;
    this.animationStartedAt = gameLoop.now();
    this.playedSounds.clear();
  }

  playSoundsAtFrame(sounds = [], frame) {
    sounds.forEach((sound, index) => {
      if (frame < sound.frame || this.playedSounds.has(index)) return;
      this.playedSounds.add(index);
      playSfx(sound.name, { volume: sound.volume });
    });
  }

  playLoop(images, frameDuration) {
    this.setFrame(images, this.getElapsedFrame(frameDuration) % images.length);
  }

  getElapsedTime() {
    return gameLoop.now() - this.animationStartedAt;
  }

  getElapsedFrame(frameDuration) {
    return Math.floor(this.getElapsedTime() / frameDuration);
  }

  setFrame(images, frame) {
    this.currentImage = frame;
    this.img = this.imageCache[images[frame]];
  }

  faceDirection(isLeft) {
    this.isOppositeDirection = isLeft;
  }

  getFootPoint() {
    return { x: this.x + this.width / 2, y: this.y + this.height - this.offset.bottom };
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
