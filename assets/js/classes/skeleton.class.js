import { ConfigurableEnemy } from "./configurable-enemy.class.js";

const SKELETON_PATH = "assets/images/3_enemies/skeleton/";
const SKELETON_FRAME = { frameSize: 196, frameHeight: 117 };
/**
 * Builds the sprite config of a skeleton animation.
 * @param {string} name - Animation name in the file name.
 * @param {number} frameCount - Number of frames.
 * @returns {Object} Sprite path, frame count, frame size and columns.
 */
function getSkeletonSprite(name, frameCount) {
  return { path: `${SKELETON_PATH}skeleton_${name}.webp`, frameCount, ...SKELETON_FRAME, columns: Math.min(10, frameCount) };
}
const SKELETON_SETTINGS = {
  pixelScale: 1,
  hp: 4,
  hasAttackArmor: true,
  attackAnimationInterval: 30,
  deathAnimationInterval: 60,
  frozenAnimationInterval: 80,
  chaseSpeedFactor: 1.5,
  aggroFootTolerance: 103,
  position: { x: 0, y: 0, width: SKELETON_FRAME.frameSize, height: SKELETON_FRAME.frameHeight, speed: 1.8, minX: 0, maxX: 0 },
  hitbox: { top: 35, right: 56, bottom: 9.4, left: 56 },
  attackHitbox: { top: 42, right: 35, bottom: 11.4, left: 46 },
  attackHitStartFrame: 8,
  sfx: { hurt: "skeletonHurt", death: "skeletonDeath" },
  sprites: {
    idle: getSkeletonSprite("idle", 12),
    walk: getSkeletonSprite("walk", 20),
    run: getSkeletonSprite("run", 15),
    hurt: [getSkeletonSprite("hurt", 5)],
    attack: [
      { ...getSkeletonSprite("attack_0", 62), hitStartFrame: 30, sfx: "skeletonAttack0", sfxFrame: 23 },
      { ...getSkeletonSprite("attack_1", 64), hitStartFrame: 50, sfx: "skeletonAttack1", sfxFrame: 44 },
    ],
    death: getSkeletonSprite("death", 45),
    frozen: getSkeletonSprite("frozen", 30),
    shock: getSkeletonSprite("shock", 16),
  },
};

/** Armored skeleton enemy with slow, long attack animations. */
export class Skeleton extends ConfigurableEnemy {
  isSpriteDirectionInverted = true;

  /**
   * @param {Object} [positionOverrides={}] - Values that override the default position settings.
   */
  constructor(positionOverrides = {}) {
    super(SKELETON_SETTINGS, positionOverrides);
  }

  /**
   * Gets the animation scheduler interval.
   * @returns {number} Interval in milliseconds (60 fps).
   */
  getAnimationSchedulerInterval() {
    return 1000 / 60;
  }
}
