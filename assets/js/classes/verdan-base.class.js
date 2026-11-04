import { gameLoop } from "./game-loop.class.js";
import { getSharedImage } from "./drawable-object.class.js";
import { MoveableObject } from "./movable-object.class.js";
import { VERDAN_SETTINGS } from "../data.js";
import { playSfx } from "../sfx.js";

const VERDAN_PATH = "assets/images/final_boss/verdan/verdan_";
const VERDAN_FRAME_WIDTH = 360;
const VERDAN_FRAME_HEIGHT = 336;
const MAX_SHEET_COLUMNS = 8;
const IS_SMOOTHING_ENABLED = true;

/** Starts loading all boss sprite sheets before the boss is created. */
export function preloadVerdanSheets() {
  Object.values(VERDAN_SETTINGS).filter((settings) => settings.file).forEach(({ file }) => getSharedImage(getVerdanSheetPath(file)));
}

/**
 * Builds the path of a boss sprite sheet.
 * @param {string} file - Sheet name from VERDAN_SETTINGS.
 * @returns {string} Sheet path.
 */
function getVerdanSheetPath(file) {
  return `${VERDAN_PATH}${file}.webp`;
}

/** Base of the Verdan boss: sprite loading, phase lookup, time-based animation and sounds. */
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

  /** Loads all body, attack and effect sprites of the boss. */
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

  /**
   * Loads a boss sprite sheet whose frames are drawn straight from the sheet to save memory.
   * @param {{file: string, frames: number, width?: number, height?: number}} sheet - Sheet settings.
   * @returns {string[]} Image cache keys of the frames.
   */
  loadSheet({ file, frames, width = VERDAN_FRAME_WIDTH, height = VERDAN_FRAME_HEIGHT }) {
    const columns = Math.min(frames, MAX_SHEET_COLUMNS);
    return this.loadSpriteSheetRegions(getVerdanSheetPath(file), frames, width, height, columns);
  }

  /**
   * Loads all sheets whose settings key starts with a prefix.
   * @param {string} prefix - Key prefix, e.g. "fx" or "attack".
   * @returns {Object<string, string[]>} Frames per settings key.
   */
  loadSheetGroup(prefix) {
    const keys = Object.keys(VERDAN_SETTINGS).filter((key) => key.startsWith(prefix));
    return Object.fromEntries(keys.map((key) => [key, this.loadSheet(VERDAN_SETTINGS[key])]));
  }

  /**
   * Gets the rage variant of a settings key if in rage and one exists.
   * @param {string} key - Base settings key.
   * @returns {string} Settings key for the current phase.
   */
  getPhaseKey(key) {
    const rageKey = `${key}Rage`;
    return this.isRage && VERDAN_SETTINGS[rageKey] ? rageKey : key;
  }

  /**
   * Gets the settings of a key for the current phase.
   * @param {string} key - Base settings key.
   * @returns {Object} Phase settings.
   */
  getPhaseSettings(key) {
    return VERDAN_SETTINGS[this.getPhaseKey(key)];
  }

  /**
   * Picks a value for the current phase.
   * @param {{normal: *, rage: *}} values - Values per phase.
   * @returns {*} The rage value in rage, otherwise the normal value.
   */
  getPhaseValue({ normal, rage }) {
    return this.isRage ? rage : normal;
  }

  /**
   * Switches to a state and restarts its animation timer and sounds.
   * @param {string} state - New boss state.
   */
  startAnimation(state) {
    this.state = state;
    this.animationStartedAt = gameLoop.now();
    this.playedSounds.clear();
  }

  /**
   * Plays each sound once its frame is reached.
   * @param {Array<{frame: number, name: string, volume?: number}>} [sounds=[]] - Sounds of the animation.
   * @param {number} frame - Current frame.
   */
  playSoundsAtFrame(sounds = [], frame) {
    sounds.forEach((sound, index) => {
      if (frame < sound.frame || this.playedSounds.has(index)) return;
      this.playedSounds.add(index);
      playSfx(sound.name, { volume: sound.volume });
    });
  }

  /**
   * Shows the frame of a looping animation based on elapsed time.
   * @param {string[]} images - Frames of the animation.
   * @param {number} frameDuration - Duration per frame in milliseconds.
   */
  playLoop(images, frameDuration) {
    this.setFrame(images, this.getElapsedFrame(frameDuration) % images.length);
  }

  /**
   * Gets the time since the current animation started.
   * @returns {number} Elapsed time in milliseconds.
   */
  getElapsedTime() {
    return gameLoop.now() - this.animationStartedAt;
  }

  /**
   * Gets the number of frames elapsed since the animation started.
   * @param {number} frameDuration - Duration per frame in milliseconds.
   * @returns {number} Elapsed frame index.
   */
  getElapsedFrame(frameDuration) {
    return Math.floor(this.getElapsedTime() / frameDuration);
  }

  /**
   * Shows a specific frame.
   * @param {string[]} images - Frames of the animation.
   * @param {number} frame - Frame index.
   */
  setFrame(images, frame) {
    this.currentImage = frame;
    this.img = this.imageCache[images[frame]];
  }

  /**
   * Turns the boss left or right.
   * @param {boolean} isLeft - True to face left.
   */
  faceDirection(isLeft) {
    this.isOppositeDirection = isLeft;
  }

  /**
   * Gets the point between the boss's feet.
   * @returns {{x: number, y: number}} Foot point.
   */
  getFootPoint() {
    return { x: this.x + this.width / 2, y: this.y + this.height - this.offset.bottom };
  }

  /**
   * The boss body never deals contact damage; its effects do.
   * @returns {boolean} Always false.
   */
  isAttackFrameActive() {
    return false;
  }

  /**
   * Draws the boss with image smoothing.
   * @param {CanvasRenderingContext2D} ctx - Target canvas context.
   */
  draw(ctx) {
    ctx.save();
    ctx.imageSmoothingEnabled = IS_SMOOTHING_ENABLED;
    super.draw(ctx);
    ctx.restore();
  }
}
