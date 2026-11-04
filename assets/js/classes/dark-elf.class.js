import { ConfigurableEnemy } from "./configurable-enemy.class.js";

const DARK_ELF_PATH = "assets/images/enemies/dark_elf/";
const DARK_ELF_FRAME = { frameSize: 162, frameHeight: 128 };
/**
 * Builds the sprite config of a dark elf animation.
 * @param {string} name - Animation name in the file name.
 * @param {number} frameCount - Number of frames.
 * @returns {Object} Sprite path, frame count, frame size and columns.
 */
function getDarkElfSprite(name, frameCount) {
  return { path: `${DARK_ELF_PATH}dark_elf_${name}.webp`, frameCount, ...DARK_ELF_FRAME, columns: Math.min(10, frameCount) };
}
const DARK_ELF_SETTINGS = {
  pixelScale: 1,
  attackAnimationInterval: 60,
  chaseSpeedFactor: 1.8,
  aggroFootTolerance: 108,
  position: { x: 0, y: 0, width: DARK_ELF_FRAME.frameSize, height: DARK_ELF_FRAME.frameHeight, speed: 2, minX: 0, maxX: 0 },
  hitbox: { top: 25, right: 46, bottom: 4, left: 46 },
  attackHitbox: { top: 36, right: 16, bottom: 4, left: 30 },
  attackHitStartFrame: 3,
  sfx: { hurt: "darkElfHurt", death: "darkElfDeath" },
  sprites: {
    idle: getDarkElfSprite("idle", 12),
    walk: getDarkElfSprite("walk", 13),
    run: getDarkElfSprite("run", 9),
    attack: [
      { ...getDarkElfSprite("attack_0", 14), hitStartFrame: 7, weight: 3, sfx: "darkElfAttack0", sfxFrame: 5 },
      { ...getDarkElfSprite("attack_1", 20), hitStartFrame: 6, weight: 2, sfx: "darkElfAttack1", sfxFrame: 0 },
    ],
    hurt: [getDarkElfSprite("hurt_0", 5), getDarkElfSprite("hurt_1", 5), getDarkElfSprite("hurt_2", 5)],
    death: getDarkElfSprite("death", 10),
    frozen: getDarkElfSprite("frozen", 10),
    shock: getDarkElfSprite("shock", 16),
  },
};

/** Fast dark elf enemy with two weighted attack animations. */
export class DarkElf extends ConfigurableEnemy {
  /**
   * @param {Object} [positionOverrides={}] - Values that override the default position settings.
   */
  constructor(positionOverrides = {}) {
    super(DARK_ELF_SETTINGS, positionOverrides);
  }
}
