import { CHARACTER_SETTING_KEYS, ENTITY_SCALE, MALE_CHARACTER_CONFIG, SCALED_SETTING_KEYS } from "../data.js";
import { gameLoop } from "./game-loop.class.js";
import { MoveableObject } from "./movable-object.class.js";

/** Base of the playable character: settings, sprite loading and state machine. */
export class CharacterBase extends MoveableObject {
  width;
  height;
  y;
  hp;
  speed;
  walkSpeed;
  runSpeedFactor;
  IMAGES_WALKING;
  IMAGES_RUNNING;
  IMAGES_IDLE;
  IMAGES_IDLE_LONG;
  idleSince = gameLoop.now();
  lastIdleFrame = 0;
  idleLongFrame = 0;
  animationElapsedMs = 0;
  stepElapsedSeconds = 0;
  activeFootstepSfx = null;
  footstepStartDelaySeconds = 0;
  IMAGES_JUMPING;
  IMAGES_STANDING;
  IMAGES_ATTACK;
  IMAGES_EXTRA_ATTACK;
  extraAttackDamageFrame;
  extraAttackReach;
  activeAttackImages;
  activeAttackDamageFrame;
  activeAttackReach;
  attackTick = 0;
  attackTicksPerFrame;
  attackLunge;
  legsImg = null;
  legsArea;
  attackDamageFrame;
  attackReach;
  IMAGES_HURT;
  IMAGES_DEAD;
  state = "idle";
  stateActions = {
    idle: ["move", "jump", "attack"],
    run: ["move", "jump", "attack"],
    jump: ["move", "attack"],
    attack: ["move", "jump"],
    hurt: ["move"],
    dead: [],
  };
  knockbackDirection = 0;
  knockbackSpeed = 0;
  invulnerableUntil = 0;

  world;
  isDeathStarted = false;
  IMAGES_BUBBLE;
  isBubbleVisible = false;
  coins = 0;

  /**
   * Merges a character config with the male defaults, including nested objects.
   * @param {Object} config - Character-specific settings.
   * @returns {Object} The merged settings.
   */
  mergeSettings(config) {
    return {
      ...MALE_CHARACTER_CONFIG,
      ...config,
      offset: { ...MALE_CHARACTER_CONFIG.offset, ...config.offset },
      legsArea: { ...MALE_CHARACTER_CONFIG.legsArea, ...config.legsArea },
      sprites: { ...MALE_CHARACTER_CONFIG.sprites, ...config.sprites },
    };
  }

  /**
   * Copies the settings onto the character and scales size-related values.
   * @param {Object} settings - Merged character settings.
   */
  applySettings(settings) {
    CHARACTER_SETTING_KEYS.forEach((key) => {
      this[key] = settings[key];
    });
    SCALED_SETTING_KEYS.forEach((key) => {
      this[key] = settings[key] * ENTITY_SCALE;
    });
    this.offset = this.scaleOffset(settings.offset);
    this.speed = this.walkSpeed;
  }

  /**
   * Loads one character animation from its sprite sheet.
   * @param {Object} settings - Merged character settings.
   * @param {string} name - Sprite name, e.g. "walking".
   * @returns {string[]} Image cache keys, or an empty array if the sprite is missing.
   */
  loadCharacterSprites(settings, name) {
    const sprite = settings.sprites[name];
    if (!sprite) return [];
    const frameSize = sprite.frameSize ?? settings.spriteFrameSize;
    return this.loadSpriteSheet(settings.spritePath + sprite.file, sprite.count, frameSize, sprite.frameHeight);
  }

  /**
   * Loads the walk, run, idle, jump and standing animations.
   * @param {Object} settings - Merged character settings.
   */
  loadMovementSprites(settings) {
    this.IMAGES_WALKING = this.loadCharacterSprites(settings, "walking");
    this.IMAGES_RUNNING = this.loadCharacterSprites(settings, "running");
    this.IMAGES_IDLE = this.loadCharacterSprites(settings, "idle");
    this.IMAGES_IDLE_LONG = settings.sprites.idleLong ? this.loadCharacterSprites(settings, "idleLong") : this.IMAGES_IDLE;
    this.IMAGES_JUMPING = this.loadCharacterSprites(settings, "jumping");
    this.IMAGES_STANDING = settings.sprites.standing ? this.loadCharacterSprites(settings, "standing") : this.IMAGES_JUMPING;
  }

  /**
   * Loads the attack, hurt, death and bubble animations.
   * @param {Object} settings - Merged character settings.
   */
  loadCombatSprites(settings) {
    this.IMAGES_ATTACK = this.loadCharacterSprites(settings, "attack");
    this.IMAGES_EXTRA_ATTACK = this.loadCharacterSprites(settings, "extraAttack");
    this.setActiveAttack(this.IMAGES_ATTACK, this.attackDamageFrame, this.attackReach);
    this.IMAGES_HURT = this.loadCharacterSprites(settings, "hurt");
    this.IMAGES_DEAD = this.loadCharacterSprites(settings, "dead");
    this.IMAGES_BUBBLE = this.loadCharacterSprites(settings, "bubble");
  }

  /** Updates the current state from the character's situation. */
  updateState() {
    this.state = this.getState();
  }

  /**
   * Determines the current state by priority.
   * @returns {string} "dead", "hurt", "attack", "jump", "run" or "idle".
   */
  getState() {
    if (this.isDead()) return "dead";
    if (this.gettingHit()) return "hurt";
    if (this.isAttacking) return "attack";
    if (this.isAboveGround()) return "jump";
    if (this.world && this.world.keyboard.RIGHT !== this.world.keyboard.LEFT) return "run";
    return "idle";
  }

  /**
   * Checks whether the current state allows an action.
   * @param {string} action - "move", "jump" or "attack".
   * @returns {boolean} True if the action is allowed.
   */
  canPerformAction(action) {
    return this.stateActions[this.state].includes(action);
  }
}
