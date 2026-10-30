export const ENTITY_SCALE = 0.7;
export const LEVEL_COUNT = 2;
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
  spritePath: "assets/images/character/male/",
  sprites: {
    walking: { file: "walk.png", count: 7 },
    running: { file: "run.png", count: 8 },
    idle: { file: "idle.png", count: 6 },
    idleLong: { file: "idle_long.png", count: 5 },
    attack: { file: "attack_1.png", count: 10 },
    extraAttack: { file: "attack_3.png", count: 7 },
    jumping: { file: "jump.png", count: 11 },
    hurt: { file: "hurt.png", count: 4 },
    dead: { file: "dead.png", count: 4 },
    bubble: { file: "idle_long_bubble.png", count: 2, frameSize: 15, frameHeight: 16 },
  },
};

export const FEMALE_CHARACTER_CONFIG = {
  extraAttackDamageFrame: 6,
  attackDamageFrame: 3,
  extraAttackReach: 150,
  offset: { top: 90, right: 72, bottom: 8, left: 48 },
  spritePath: "assets/images/character/female/",
  sprites: {
    walking: { file: "walk.png", count: 8 },
    running: { file: "run.png", count: 8 },
    idle: { file: "idle.png", count: 5 },
    idleLong: null,
    attack: { file: "attack_1.png", count: 6 },
    extraAttack: { file: "attack_4.png", count: 10 },
    jumping: { file: "jump.png", count: 8 },
    standing: { file: "walk.png", count: 8 },
    hurt: { file: "hurt.png", count: 2 },
    dead: { file: "dead.png", count: 5 },
    bubble: null,
  },
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
