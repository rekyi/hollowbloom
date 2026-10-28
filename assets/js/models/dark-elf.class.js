import { ConfigurableEnemy } from "./configurable-enemy.class.js";

const DARK_ELF_PATH = "assets/images/3_enemies/dark_elf/";
function getDarkElfSprite(name, frameCount = 6) {
  return { path: `${DARK_ELF_PATH}dark_elf_${name}.webp`, frameCount, frameSize: 300, frameHeight: 384 };
}
const DARK_ELF_SETTINGS = {
  position: { x: 2150, y: 300, width: 170, height: 190, speed: 1.8, minX: 2050, maxX: 2300 },
  hitbox: { top: 28, right: 42, bottom: 20, left: 42 },
  attackHitbox: { top: 40, right: 14, bottom: 20, left: 14 },
  attackHitStartFrame: 3,
  sprites: {
    idle: getDarkElfSprite("walk"),
    walk: getDarkElfSprite("walk"),
    run: getDarkElfSprite("run"),
    attack: [getDarkElfSprite("attack_0"), getDarkElfSprite("attack_1")],
    hurt: [getDarkElfSprite("hurt_0"), getDarkElfSprite("hurt_1"), getDarkElfSprite("hurt_2")],
    death: getDarkElfSprite("death"),
    frozen: getDarkElfSprite("frozen"),
    shock: getDarkElfSprite("shock"),
  },
};

export class DarkElf extends ConfigurableEnemy {
  constructor() {
    super(DARK_ELF_SETTINGS);
  }

  playIdle() {
    this.img = this.imageCache[this.IMAGES_IDLE[0]];
  }
}
