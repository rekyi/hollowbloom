import { gameLoop } from "./game-loop.class.js";
import { Enemy } from "./enemies.class.js";
import { createLevel, loadLevelAssets } from "../level/level-loader.js";
import { LEVEL_COUNT } from "../data.js";
import { placeOnEntity } from "./level.class.js";
import { FemaleCharacter } from "./female-character.class.js";
import { AudioError } from "./audio-error.class.js";
import { playSfx } from "../sfx.js";
import { applyMusicVolume } from "../audio.js";
import { translate } from "../translation.js";
import { WorldRendering } from "./world-rendering.class.js";
import { CAMERA_INTRO_TOTAL_MS } from "../camera-intro.js";

const READY_DURATION_MS = 1500;

export class World extends WorldRendering {
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
    this.setupGameplayMusic();
    this.enterLevel(levelAssets, levelIndex);
    this.run();
  }

  applyCarryOver({ coins = 0, coinsCollected = 0, timeMs = 0, defeatedEnemies = 0, deaths = 0, restarts = 0 }) {
    this.character.coins = coins;
    this.statusBar.setCoins(coins);
    this.coinsCollected = coinsCollected;
    this.timerCarryMs = timeMs;
    this.defeatedEnemies = defeatedEnemies;
    this.deaths = deaths;
    this.restarts = restarts;
  }

  enterLevel(levelAssets, levelIndex) {
    this.levelIndex = levelIndex;
    this.levelStartCoins = this.character.coins;
    this.levelStartCoinsCollected = this.coinsCollected;
    this.levelStartDefeatedEnemies = this.defeatedEnemies;
    this.level = createLevel(levelAssets);
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

  startCameraIntro() {
    if (this.level.getEntities("Boss").length > 0) gameLoop.startIntro(CAMERA_INTRO_TOTAL_MS);
  }

  prepareEnemyWorld() {
    this.level.enemies.forEach((enemy) => (enemy.world = this));
  }

  async loadNextLevel(exit) {
    const nextLevelIndex = this.levelIndex + 1;
    const isLastLevel = nextLevelIndex >= LEVEL_COUNT;
    playSfx(exit.isBossExit ? "exitPortalBossLevel" : "exitPortalNormalLevel");
    if (isLastLevel) return this.triggerVictory();
    this.isLevelLoading = true;
    try {
      this.enterLevel(await loadLevelAssets(nextLevelIndex), nextLevelIndex);
      this.isLevelLoading = false;
    } catch (error) {
      console.error(error);
      alert(translate("message.nextLevelLoadFailed"));
    }
  }

  placeCharacterAtStart() {
    const [playerStart] = this.level.getEntities("Player");
    if (playerStart) placeOnEntity(this.character, playerStart);
  }

  setupGameplayMusic() {
    this.gameplayMusic = new Audio("assets/audio/music/gameplay.ogg");
    this.gameplayMusic.loop = true;
    applyMusicVolume(this.gameplayMusic);
    this.startGameplayMusic();
  }

  setEnemyTargets() {
    this.level.enemies.forEach((enemy) => {
      if (enemy instanceof Enemy || enemy.isFinalBoss) enemy.target = this.character;
    });
  }

  run() {
    gameLoop.runEvery(1000 / 25, () => this.removeDeadEnemies());
    gameLoop.start(
      (dt) => this.update(dt),
      () => this.draw(),
      READY_DURATION_MS,
    );
  }

  startGameplayMusic() {
    AudioError.play(this.gameplayMusic);
  }

  pauseGameplayMusic() {
    AudioError.pause(this.gameplayMusic);
  }

  resumeGameplayMusic() {
    const boss = this.level.enemies.find((enemy) => enemy.isFinalBoss);
    if (this.character.isDead() || boss?.isDead()) return;
    this.startGameplayMusic();
  }

  stopGameplayMusic() {
    AudioError.stop(this.gameplayMusic);
  }
}
