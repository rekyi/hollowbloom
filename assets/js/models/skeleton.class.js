import { ConfigurableEnemy } from "./configurable-enemy.class.js";

const SKELETON_PATH = "assets/images/3_enemies/skeleton/";
function getSkeletonSprite(name, frameCount) {
  return { path: `${SKELETON_PATH}skeleton_${name}.webp`, frameCount, frameSize: 256, frameHeight: 256 };
}
const SKELETON_SETTINGS = {
  position: { x: 2600, y: 341, width: 140, height: 140, speed: 1.8, minX: 2450, maxX: 2700 },
  hitbox: { top: 24, right: 34, bottom: 10, left: 34 },
  attackHitbox: { top: 30, right: 8, bottom: 12, left: 8 },
  attackHitStartFrame: 8,
  sprites: {
    idle: getSkeletonSprite("walk", 20),
    walk: getSkeletonSprite("walk", 20),
    run: getSkeletonSprite("run", 15),
    attack: [getSkeletonSprite("attack_0", 62), getSkeletonSprite("attack_1", 64)],
    death: getSkeletonSprite("death", 45),
  },
};

export class Skeleton extends ConfigurableEnemy {
  isSpriteDirectionInverted = true;

  constructor() {
    super(SKELETON_SETTINGS);
  }
}
