export const ENTITY_SCALE = 0.7;
export const LEVEL_COUNT = 2;
export const START_LEVEL = 2;
export const EXTRA_ATTACK_COIN_THRESHOLD = 5;
export const MOVE_RIGHT_KEYS = ["ArrowRight", "KeyD"];
export const MOVE_LEFT_KEYS = ["ArrowLeft", "KeyA"];
export const JUMP_KEYS = ["ArrowUp", "Space"];
export const RUN_KEYS = ["ShiftLeft", "ShiftRight"];
export const ATTACK_KEYS = ["KeyF", "KeyJ"];
export const EXTRA_ATTACK_KEYS = ["KeyG", "KeyK"];
export const TIMER_START_KEYS = ["ArrowLeft", "ArrowRight", "ArrowUp", "KeyA", "KeyD", "Space", "KeyF", "KeyJ", "KeyG", "KeyK"];

export const CHARACTER_SETTING_KEYS = [
  "width",
  "height",
  "x",
  "y",
  "hp",
  "walkSpeed",
  "runSpeedFactor",
  "attackReach",
  "attackDamageFrame",
  "attackTicksPerFrame",
  "legsArea",
  "extraAttackDamageFrame",
  "extraAttackReach",
  "offset",
];

export const SCALED_SETTING_KEYS = ["width", "height", "walkSpeed", "attackReach", "extraAttackReach"];

export const MALE_CHARACTER_CONFIG = {
  width: 200,
  height: 200,
  x: 320,
  y: 760,
  hp: 300,
  walkSpeed: 7,
  runSpeedFactor: 1.5,
  attackReach: 60,
  attackDamageFrame: 5,
  attackTicksPerFrame: 2,
  extraAttackDamageFrame: 5,
  extraAttackReach: 150,
  legsArea: { x: 30, y: 98, w: 52, h: 30 },
  offset: { top: 80, right: 80, bottom: 0, left: 52 },
  spriteFrameSize: 140,
  spritePath: "assets/images/character/male/",
  sprites: {
    walking: { file: "walk.webp", count: 7 },
    running: { file: "run.webp", count: 8 },
    idle: { file: "idle.webp", count: 6 },
    idleLong: { file: "idle_long.webp", count: 5 },
    attack: { file: "attack_1.webp", count: 10 },
    extraAttack: { file: "attack_3.webp", count: 7 },
    jumping: { file: "jump.webp", count: 11 },
    hurt: { file: "hurt.webp", count: 4 },
    dead: { file: "dead.webp", count: 4 },
    // bubble: { file: "idle_long_bubble.png", count: 2, frameSize: 15, frameHeight: 16 },
  },
};

export const FEMALE_CHARACTER_CONFIG = {
  extraAttackDamageFrame: 6,
  attackDamageFrame: 3,
  extraAttackReach: 150,
  offset: { top: 90, right: 72, bottom: 8, left: 48 },
  spritePath: "assets/images/character/female/",
  sprites: {
    walking: { file: "walk.webp", count: 8 },
    running: { file: "run.webp", count: 8 },
    idle: { file: "idle.webp", count: 5 },
    idleLong: null,
    attack: { file: "attack_1.webp", count: 6 },
    extraAttack: { file: "attack_4.webp", count: 10 },
    jumping: { file: "jump.webp", count: 8 },
    standing: { file: "walk.webp", count: 8 },
    hurt: { file: "hurt.webp", count: 2 },
    dead: { file: "dead.webp", count: 5 },
    bubble: null,
  },
};

export const VERDAN_SETTINGS = {
  idle: { file: "idle", frames: 8, frameDuration: 125 },
  idleRage: { file: "idle_rage", frames: 8, frameDuration: 100 },
  walk: { file: "walk", frames: 8, frameDuration: 100, speed: 1.75 },
  walkRage: { file: "walk_rage", frames: 8, frameDuration: 83, speed: 2.4 },
  attackBow: { file: "attack_bow", frames: 14, frameDuration: 83, warningFrames: [5, 8], actionFrame: 9, spawn: { x: 88, y: -170 }, arrows: { speedX: 375, speedsY: [-143, -53, 38], gravity: 255 } },
  attackBowRage: {
    file: "attack_bow_rage",
    frames: 14,
    frameDuration: 71,
    warningFrames: [5, 8],
    actionFrame: 9,
    spawn: { x: 95, y: -163 },
    arrows: { speedX: 375, speedsY: [-180, -105, -38, 30, 90], gravity: 255 },
  },
  attackRoots: { file: "attack_roots", frames: 14, frameDuration: 83, warningFrames: [2, 6], actionFrame: 7, spawn: { x: 63, y: 0 }, spikes: { count: 5, spacing: 48, interval: 110 } },
  attackRootsRage: { file: "attack_roots_rage", frames: 14, frameDuration: 71, warningFrames: [2, 6], actionFrame: 7, spawn: { x: 63, y: 0 }, spikes: { count: 7, spacing: 42, interval: 110 } },
  attackPulse: { file: "attack_pulse", frames: 16, frameDuration: 83, warningFrames: [2, 8], actionFrame: 9, spawn: { x: -2, y: -165 } },
  hurt: { file: "hurt", frames: 5, frameDuration: 83 },
  hurtRage: { file: "hurt_rage", frames: 5, frameDuration: 83 },
  phaseTransition: { file: "phase_transition", frames: 22, frameDuration: 100, rageFrame: 12, roarFrame: 14 },
  death: { file: "death", frames: 26, frameDuration: 100, decayFrame: 11 },
  fxSeedArrow: { file: "fx_seed_arrow", frames: 4, frameDuration: 83, width: 126, height: 60, pivot: { x: 78, y: 30 }, hitbox: { width: 36, height: 16, isCentered: true } },
  fxSeedArrowRage: { file: "fx_seed_arrow_rage", frames: 4, frameDuration: 83, width: 126, height: 60, pivot: { x: 78, y: 30 }, hitbox: { width: 36, height: 16, isCentered: true } },
  fxSeedImpact: { file: "fx_seed_impact", frames: 12, frameDuration: 83, width: 108, height: 96, pivot: { x: 54, y: 87 }, damageFrames: [3, 8], hitbox: { width: 39, height: 45 } },
  fxSeedImpactRage: { file: "fx_seed_impact_rage", frames: 12, frameDuration: 83, width: 108, height: 96, pivot: { x: 54, y: 87 }, damageFrames: [3, 8], hitbox: { width: 39, height: 45 } },
  fxRootSpike: {
    file: "fx_root_spike",
    frames: 14,
    frameDuration: 71,
    width: 84,
    height: 180,
    pivot: { x: 42, y: 171 },
    warningFrames: [0, 3],
    damageFrames: [4, 10],
    hitbox: { width: 24, height: 135 },
  },
  fxRootSpikeRage: {
    file: "fx_root_spike_rage",
    frames: 14,
    frameDuration: 71,
    width: 84,
    height: 180,
    pivot: { x: 42, y: 171 },
    warningFrames: [0, 3],
    damageFrames: [4, 10],
    hitbox: { width: 24, height: 135 },
  },
  fxPulseBurst: { file: "fx_pulse_burst", frames: 12, frameDuration: 71, width: 384, height: 384, pivot: { x: 192, y: 192 }, ring: { minRadius: 15, maxRadius: 159, width: 20 } },
};

export const startScreenMusic = new Audio("assets/audio/music/start_screen.ogg");
export const deathScreenMusic = new Audio("assets/audio/music/death_screen.wav");
export const pressedKeys = new Set();
export const appState = {
  canvasRef: null,
  world: null,
  keyboard: null,
  selectedCharacterClass: null,
  masterVolume: 1,
  musicVolume: 1,
  soundEffectsVolume: 1,
  isAudioMuted: false,
};
