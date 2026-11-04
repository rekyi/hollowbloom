import { gameLoop } from "./game-loop.class.js";
import { Enemy } from "./enemies.class.js";
import { createLevel, loadLevelAssets, preloadLevelSprites, releaseLevelAssets } from "../level/level-loader.js";
import { LEVEL_COUNT } from "../data.js";
import { placeOnEntity } from "./level.class.js";
import { FemaleCharacter } from "./female-character.class.js";
import { playSfx } from "../sfx.js";
import { gameMusic } from "./game-music.class.js";
import { translate } from "../translation.js";
import { WorldRendering } from "./world-rendering.class.js";
import { CAMERA_INTRO_TOTAL_MS } from "../camera-intro.js";
import { getLevelTheme } from "../level-themes.js";
import { prepareLevelLighting } from "./lighting.class.js";
import { waitForPendingImages } from "./drawable-object.class.js";

const READY_DURATION_MS = 1500;
const PRELOAD_DELAY_MS = 2000;
const GAMEPLAY_MUSIC_DELAY_MS = 1000;

/** Game world that owns the character and the current level, loads levels, and runs the game loop. */
export class World extends WorldRendering {
  /**
   * Creates the world and enters the first level; the game loop starts with start().
   * @param {HTMLCanvasElement} canvasRef - Canvas to render on.
   * @param {Keyboard} keyboard - Keyboard state used by the character.
   * @param {Function} onGameOver - Called when the game is over.
   * @param {Function} [CharacterClass=FemaleCharacter] - Constructor of the playable character.
   * @param {Function} [onVictory] - Called when the final boss is defeated.
   * @param {Object} levelAssets - Loaded assets of the level to start in.
   * @param {number} [levelIndex=0] - Index of the level to start in.
   * @param {Object} [carryOver={}] - Stats carried over from a previous world (coins, time, deaths, ...).
   */
  constructor(canvasRef, keyboard, onGameOver, CharacterClass = FemaleCharacter, onVictory = () => {}, levelAssets, levelIndex = 0, carryOver = {}) {
    super();
    this.canvasRef = canvasRef;
    this.ctx = canvasRef.getContext("2d");
    this.setupCanvasContext();
    this.keyboard = keyboard;
    this.character = new CharacterClass();
    this.character.world = this;
    this.statusBar.setSpecialType(this.character.characterType);
    this.applyCarryOver(carryOver);
    this.onGameOver = onGameOver;
    this.onVictory = onVictory;
    this.enterLevel(levelAssets, levelIndex);
  }

  /**
   * Waits until all requested sprites are loaded, then starts the game loop and schedules the level music.
   * @returns {Promise<void>}
   */
  async start() {
    await waitForPendingImages();
    this.run();
    this.startLevelMusic(READY_DURATION_MS);
  }

  /**
   * Restores the stats carried over from a previous world.
   * @param {Object} carryOver - Stats to restore.
   * @param {number} [carryOver.coins=0] - Coins held by the character.
   * @param {number} [carryOver.coinsCollected=0] - Total coins collected.
   * @param {number} [carryOver.timeMs=0] - Elapsed run time in milliseconds.
   * @param {number} [carryOver.defeatedEnemies=0] - Enemies defeated so far.
   * @param {number} [carryOver.deaths=0] - Number of deaths.
   * @param {number} [carryOver.restarts=0] - Number of restarts.
   */
  applyCarryOver({ coins = 0, coinsCollected = 0, timeMs = 0, defeatedEnemies = 0, deaths = 0, restarts = 0 }) {
    this.character.coins = coins;
    this.statusBar.setCoins(coins);
    this.coinsCollected = coinsCollected;
    this.timerCarryMs = timeMs;
    this.defeatedEnemies = defeatedEnemies;
    this.deaths = deaths;
    this.restarts = restarts;
  }

  /**
   * Builds the level from its assets and resets the per-level state.
   * @param {Object} levelAssets - Loaded assets of the level.
   * @param {number} levelIndex - Index of the level.
   */
  enterLevel(levelAssets, levelIndex) {
    this.levelIndex = levelIndex;
    this.levelStartCoins = this.character.coins;
    this.levelStartCoinsCollected = this.coinsCollected;
    this.levelStartDefeatedEnemies = this.defeatedEnemies;
    this.level = createLevel(levelAssets);
    this.applyLevelTheme();
    this.preloadNextLevel();
    this.hasKey = false;
    this.activeCheckpoint = null;
    this.placeCharacterAtStart();
    this.character.speedY = 0;
    this.spawnPoint = { x: this.character.x, y: this.character.y };
    this.updateCamera(true);
    this.setEnemyTargets();
    this.prepareEnemyWorld();
    this.startCameraIntro();
  }

  /** Releases unused level assets and preloads the next level after a short delay. */
  preloadNextLevel() {
    const nextLevelIndex = this.levelIndex + 1;
    releaseLevelAssets([this.levelIndex, nextLevelIndex]);
    if (nextLevelIndex >= LEVEL_COUNT) return;
    setTimeout(() => loadLevelAssets(nextLevelIndex).then((levelAssets) => this.preloadLevel(levelAssets)).catch(() => {}), PRELOAD_DELAY_MS);
  }

  /**
   * Starts loading the boss sprites of a level and prepares its lighting.
   * @param {Object} levelAssets - Loaded assets of the level.
   * @returns {Promise} Resolves when the lighting is prepared.
   */
  preloadLevel(levelAssets) {
    preloadLevelSprites(levelAssets);
    return prepareLevelLighting(levelAssets);
  }

  /** Applies the theme of the current level to background, fireflies and lighting. */
  applyLevelTheme() {
    const theme = getLevelTheme(this.level);
    this.background.setTheme(theme);
    this.fireflies.populate(this.level, theme);
    this.lighting.setLevel(this.level);
  }

  /**
   * Checks whether the current level contains a boss.
   * @returns {boolean} True if the level has a boss entity.
   */
  isBossLevel() {
    return this.level.getEntities("Boss").length > 0;
  }

  /** Starts the camera intro in boss levels. */
  startCameraIntro() {
    if (this.isBossLevel()) gameLoop.startIntro(CAMERA_INTRO_TOTAL_MS);
  }

  /** Skips the camera intro and starts the boss music loop. */
  skipCameraIntro() {
    gameLoop.skipIntro();
    gameMusic.startBossLoop();
  }

  /**
   * Schedules the boss or gameplay music of the current level.
   * @param {number} introDelayMs - Delay before the boss music starts, in milliseconds.
   */
  startLevelMusic(introDelayMs) {
    if (this.isBossLevel()) gameLoop.runAfter(introDelayMs, () => gameMusic.playBossMusic(gameLoop.introElapsedMs));
    else gameLoop.runAfter(GAMEPLAY_MUSIC_DELAY_MS, () => gameMusic.playGameplayMusic());
  }

  /** Gives every enemy a reference to this world. */
  prepareEnemyWorld() {
    this.level.enemies.forEach((enemy) => (enemy.world = this));
  }

  /**
   * Loads and enters the next level, or triggers the victory after the last level.
   * @param {ExitPortal} exit - Portal the character entered.
   * @returns {Promise<void>}
   */
  async loadNextLevel(exit) {
    const nextLevelIndex = this.levelIndex + 1;
    const isLastLevel = nextLevelIndex >= LEVEL_COUNT;
    playSfx(exit.isBossExit ? "exitPortalBossLevel" : "exitPortalNormalLevel");
    if (isLastLevel) return this.triggerVictory();
    this.isLevelLoading = true;
    try {
      await this.enterLoadedLevel(nextLevelIndex);
      this.isLevelLoading = false;
    } catch (error) {
      console.error(error);
      alert(translate("message.nextLevelLoadFailed"));
    }
  }

  /**
   * Waits for the assets and sprites of a level, then enters it and starts its music.
   * @param {number} levelIndex - Index of the level to enter.
   * @returns {Promise<void>}
   */
  async enterLoadedLevel(levelIndex) {
    const levelAssets = await loadLevelAssets(levelIndex);
    preloadLevelSprites(levelAssets);
    await waitForPendingImages();
    this.enterLevel(levelAssets, levelIndex);
    this.startLevelMusic(0);
  }

  /** Places the character on the player start entity of the level. */
  placeCharacterAtStart() {
    const [playerStart] = this.level.getEntities("Player");
    if (playerStart) placeOnEntity(this.character, playerStart);
  }

  /** Sets the character as target of all enemies and the final boss. */
  setEnemyTargets() {
    this.level.enemies.forEach((enemy) => {
      if (enemy instanceof Enemy || enemy.isFinalBoss) enemy.target = this.character;
    });
  }

  /** Starts the game loop with update and draw callbacks and the periodic enemy cleanup. */
  run() {
    gameLoop.runEvery(1000 / 25, () => this.removeDeadEnemies());
    gameLoop.start(
      (dt) => this.update(dt),
      () => this.draw(),
      READY_DURATION_MS,
    );
  }

  /**
   * Checks whether the level music is playing.
   * @returns {boolean} True if music is playing.
   */
  isGameplayMusicPlaying() {
    return gameMusic.isPlaying;
  }

  /** Pauses the level music. */
  pauseGameplayMusic() {
    gameMusic.pause();
  }

  /** Resumes the level music unless the character or the final boss is dead. */
  resumeGameplayMusic() {
    const boss = this.level.enemies.find((enemy) => enemy.isFinalBoss);
    if (this.character.isDead() || boss?.isDead()) return;
    gameMusic.resume();
  }

  /** Stops the level music. */
  stopGameplayMusic() {
    gameMusic.stop();
  }
}
