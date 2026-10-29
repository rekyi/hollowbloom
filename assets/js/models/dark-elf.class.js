import { ConfigurableEnemy } from "./configurable-enemy.class.js";

const DARK_ELF_PATH = "assets/images/3_enemies/dark_elf/";
function getDarkElfSprite(name, frameCount, frameSize = 300, frameHeight = 300, columns = 10, placement = { width: frameSize, height: 384 }) {
  return { path: `${DARK_ELF_PATH}dark_elf_${name}.webp`, frameCount, frameSize, frameHeight, columns, placement };
}
const DARK_ELF_SETTINGS = {
  attackAnimationInterval: 60,
  position: { x: 0, y: 0, width: 170, height: 190, speed: 2, minX: 0, maxX: 0 },
  hitbox: { top: 28, right: 42, bottom: 44, left: 42 },
  attackHitbox: { top: 40, right: 14, bottom: 44, left: 14 },
  attackHitStartFrame: 3,
  sprites: {
    idle: getDarkElfSprite("walk", 13),
    walk: getDarkElfSprite("walk", 13),
    run: getDarkElfSprite("run", 9),
    attack: [
      { ...getDarkElfSprite("attack_0", 14), hitStartFrame: 7 },
      { ...getDarkElfSprite("attack_1", 20, 400, 300, 10, { width: 400, height: 384 }), hitStartFrame: 3 },
    ],
    hurt: [getDarkElfSprite("hurt_0", 8), getDarkElfSprite("hurt_1", 6), getDarkElfSprite("hurt_2", 13)],
    death: getDarkElfSprite("death", 10, 400, 400, 10, { width: 400, height: 400 }),
    frozen: getDarkElfSprite("frozen", 10),
    shock: getDarkElfSprite("shock", 16),
  },
};

export class DarkElf extends ConfigurableEnemy {
  constructor(positionOverrides = {}) {
    super(DARK_ELF_SETTINGS, positionOverrides);
  }
}
