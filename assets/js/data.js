export const ENTITY_SCALE = 0.7;
export const LEVEL_COUNT = 2;
export const START_LEVEL = 2;
export const EXTRA_ATTACK_COIN_THRESHOLD = 5;
export const MOVE_RIGHT_KEYS = ["ArrowRight", "KeyD"];
export const MOVE_LEFT_KEYS = ["ArrowLeft", "KeyA"];
export const JUMP_KEYS = ["ArrowUp", "KeyW", "Space"];
export const RUN_KEYS = ["ShiftLeft", "ShiftRight"];
export const ATTACK_KEYS = ["KeyJ", "KeyX"];
export const EXTRA_ATTACK_KEYS = ["KeyK", "KeyC"];
export const PAUSE_KEYS = ["Escape", "KeyP"];
export const TIMER_START_KEYS = ["ArrowLeft", "ArrowRight", "ArrowUp", "KeyA", "KeyD", "KeyW", "Space", "KeyJ", "KeyK", "KeyX", "KeyC"];

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
  "attackLunge",
  "legsArea",
  "extraAttackDamageFrame",
  "extraAttackReach",
  "offset",
];

export const SCALED_SETTING_KEYS = ["width", "height", "walkSpeed", "attackReach", "attackLunge", "extraAttackReach"];

export const MALE_CHARACTER_CONFIG = {
  width: 200,
  height: 200,
  x: 320,
  y: 760,
  hp: 3,
  walkSpeed: 7,
  runSpeedFactor: 1.5,
  attackReach: 75,
  attackDamageFrame: 5,
  attackTicksPerFrame: 1.5,
  attackLunge: 15,
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
    // bubble: { file: "idle_long_bubble.webp", count: 2, frameSize: 15, frameHeight: 16 },
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
  walk: { file: "walk", frames: 8, frameDuration: 100, speed: 1.75, stepFrames: [0, 4] },
  walkRage: { file: "walk_rage", frames: 8, frameDuration: 83, speed: 2.4, stepFrames: [0, 4] },
  attackBow: {
    file: "attack_bow",
    frames: 14,
    frameDuration: 83,
    warningFrames: [5, 8],
    actionFrame: 9,
    sounds: [
      { frame: 0, name: "verdanBowDraw" },
      { frame: 9, name: "verdanBowShoot" },
    ],
    spawn: { x: 88, y: -170 },
    arrows: { speedX: 375, speedsY: [-143, -53, 38], gravity: 255 },
  },
  attackBowRage: {
    file: "attack_bow_rage",
    frames: 14,
    frameDuration: 71,
    warningFrames: [5, 8],
    actionFrame: 9,
    sounds: [
      { frame: 0, name: "verdanBowDraw" },
      { frame: 9, name: "verdanBowShoot" },
    ],
    spawn: { x: 95, y: -163 },
    arrows: { speedX: 375, speedsY: [-180, -105, -38, 30, 90], gravity: 255 },
  },
  attackRoots: {
    file: "attack_roots",
    frames: 14,
    frameDuration: 83,
    warningFrames: [2, 6],
    actionFrame: 7,
    sounds: [{ frame: 7, name: "verdanRootStrike" }],
    spawn: { x: 63, y: 0 },
    spikes: { count: 5, spacing: 48, interval: 110 },
  },
  attackRootsRage: {
    file: "attack_roots_rage",
    frames: 14,
    frameDuration: 71,
    warningFrames: [2, 6],
    actionFrame: 7,
    sounds: [{ frame: 7, name: "verdanRootStrike" }],
    spawn: { x: 63, y: 0 },
    spikes: { count: 7, spacing: 42, interval: 110 },
  },
  attackPulse: { file: "attack_pulse", frames: 16, frameDuration: 83, warningFrames: [2, 8], actionFrame: 9, sounds: [{ frame: 2, name: "verdanPulseLoad" }], spawn: { x: -2, y: -165 } },
  hurt: { file: "hurt", frames: 5, frameDuration: 83 },
  hurtRage: { file: "hurt_rage", frames: 5, frameDuration: 83 },
  phaseTransition: { file: "phase_transition", frames: 22, frameDuration: 100, rageFrame: 12, roarFrame: 14, sounds: [{ frame: 8, name: "verdanPhaseTransition" }] },
  death: {
    file: "death",
    frames: 26,
    frameDuration: 100,
    decayFrame: 11,
    sounds: [
      { frame: 0, name: "verdanDeath" },
      { frame: 20, name: "verdanDeathSprout" },
    ],
  },
  fxSeedArrow: { file: "fx_seed_arrow", frames: 4, frameDuration: 83, width: 126, height: 60, pivot: { x: 78, y: 30 }, tipDistance: 32, hitbox: { width: 36, height: 16, isCentered: true } },
  fxSeedArrowRage: { file: "fx_seed_arrow_rage", frames: 4, frameDuration: 83, width: 126, height: 60, pivot: { x: 78, y: 30 }, tipDistance: 32, hitbox: { width: 36, height: 16, isCentered: true } },
  fxSeedImpact: {
    file: "fx_seed_impact",
    frames: 12,
    frameDuration: 83,
    width: 108,
    height: 96,
    pivot: { x: 54, y: 87 },
    damageFrames: [3, 8],
    hitbox: { width: 39, height: 45 },
    sound: { frame: 0, name: "verdanSeedArrowGround", volume: 0.4 },
  },
  fxSeedImpactRage: {
    file: "fx_seed_impact_rage",
    frames: 12,
    frameDuration: 83,
    width: 108,
    height: 96,
    pivot: { x: 54, y: 87 },
    damageFrames: [3, 8],
    hitbox: { width: 39, height: 45 },
    sound: { frame: 0, name: "verdanSeedArrowGround", volume: 0.4 },
  },
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
    sound: { frame: 0, name: "verdanRootSpike", volume: 0.35 },
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
    sound: { frame: 0, name: "verdanRootSpike", volume: 0.35 },
  },
  fxPulseBurst: {
    file: "fx_pulse_burst",
    frames: 12,
    frameDuration: 71,
    width: 384,
    height: 384,
    pivot: { x: 192, y: 192 },
    ring: { minRadius: 15, maxRadius: 159, width: 20 },
    sound: { frame: 0, name: "verdanPulseBurst" },
  },
};

export const HIT_FEEDBACK = {
  hit: { shakeMagnitude: 15, shakeDurationMs: 180, hitStopMs: 60, knockbackSpeed: 4 },
  kill: { shakeMagnitude: 12, shakeDurationMs: 220, hitStopMs: 80, knockbackSpeed: 10 },
  special: { shakeMagnitude: 18, shakeDurationMs: 220, hitStopMs: 80, knockbackSpeed: 7 },
  playerHit: { shakeMagnitude: 10, shakeDurationMs: 180, hitStopMs: 60, knockbackSpeed: 3.5, damageFlashMs: 400 },
  bossKill: { shakeMagnitude: 20, shakeDurationMs: 450, hitStopMs: 120, knockbackSpeed: 0 },
  bossRoar: { shakeMagnitude: 9, shakeDurationMs: 180, hitStopMs: 0, knockbackSpeed: 0 },
};

export const KNOCKBACK_FRICTION = 0.8;
export const KNOCKBACK_MIN_SPEED = 0.2;

export const startScreenMusic = new Audio("assets/audio/music/start_screen.ogg");
export const deathScreenMusic = new Audio("assets/audio/music/death_screen.ogg");
export const pressedKeys = new Set();
export const appState = {
  canvasRef: null,
  world: null,
  keyboard: null,
  selectedCharacterClass: null,
  masterVolume: 0.5,
  musicVolume: 0.5,
  soundEffectsVolume: 0.5,
  isAudioMuted: false,
};
