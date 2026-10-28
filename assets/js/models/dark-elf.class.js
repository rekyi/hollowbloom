import { ConfigurableEnemy } from "./configurable-enemy.class.js";

const DARK_ELF_PATH = "assets/images/3_enemies/dark_elf/";
function getDarkElfSprite(name, frameCount = 6, frameSize = 300, frameHeight = 384, columns = frameCount, placement = null) {
  return { path: `${DARK_ELF_PATH}dark_elf_${name}.webp`, frameCount, frameSize, frameHeight, columns, placement };
}
const DARK_ELF_SETTINGS = {
  attackAnimationInterval: 60,
  position: { x: 2150, y: 300, width: 170, height: 190, speed: 2, minX: 2050, maxX: 2300 },
  hitbox: { top: 28, right: 42, bottom: 20, left: 42 },
  attackHitbox: { top: 40, right: 14, bottom: 20, left: 14 },
  attackHitStartFrame: 3,
  sprites: {
    idle: getDarkElfSprite("walk"),
    walk: getDarkElfSprite("walk"),
    run: getDarkElfSprite("run"),
    attack: [
      { ...getDarkElfSprite("attack_0", 10), hitStartFrame: 7 },
      { ...getDarkElfSprite("attack_1", 20, 400, 300, 10, { width: 400, height: 384 }), hitStartFrame: 3 },
    ],
    hurt: [getDarkElfSprite("hurt_0"), getDarkElfSprite("hurt_1"), getDarkElfSprite("hurt_2")],
    death: getDarkElfSprite("death"),
    frozen: getDarkElfSprite("frozen"),
    shock: getDarkElfSprite("shock"),
  },
};

export class DarkElf extends ConfigurableEnemy {
  constructor(positionOverrides = {}) {
    super(DARK_ELF_SETTINGS, positionOverrides);
  }
}
