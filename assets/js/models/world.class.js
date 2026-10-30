import { gameLoop } from "./game-loop.class.js";
import { Enemy } from "./enemies.class.js";
import { FinalBoss } from "./final-boss.class.js";
import { createLevel, loadLevelAssets } from "../level/level-loader.js";
import { LEVEL_COUNT } from "../data.js";
import { placeOnEntity } from "./level.class.js";
import { FemaleCharacter } from "./female-character.class.js";
import { AudioError } from "./audio-error.class.js";
import { applyMusicVolume } from "../audio.js";
import { WorldRendering } from "./world-rendering.class.js";

const READY_DURATION_MS = 1500;

export class World extends WorldRendering {
  constructor(canvasRef, keyboard, onGameOver, CharacterClass = FemaleCharacter, onVictory = () => {}, levelAssets, levelIndex = 0) {
    super();
    this.canvasRef = canvasRef;
    this.ctx = canvasRef.getContext("2d");
    this.setupCanvasContext();
    this.keyboard = keyboard;
    this.character = new CharacterClass();
    this.character.world = this;
    this.onGameOver = onGameOver;
    this.onVictory = onVictory;
    this.setupGameplayMusic();
    this.enterLevel(levelAssets, levelIndex);
    this.run();
  }

  enterLevel(levelAssets, levelIndex) {
    this.levelIndex = levelIndex;
    this.level = createLevel(levelAssets);
    this.hasKey = false;
    this.activeCheckpoint = null;
    this.placeCharacterAtStart();
    this.character.speedY = 0;
    this.spawnPoint = { x: this.character.x, y: this.character.y };
    this.updateCamera(true);
    this.setEnemyTargets();
  }

  async loadNextLevel() {
    const nextLevelIndex = this.levelIndex + 1;
    if (nextLevelIndex >= LEVEL_COUNT) return this.triggerVictory();
    this.isLevelLoading = true;
    try {
      this.enterLevel(await loadLevelAssets(nextLevelIndex), nextLevelIndex);
      this.isLevelLoading = false;
    } catch (error) {
      // Flag bleibt gesetzt, sonst würde jeder Frame das Laden erneut auslösen.
      console.error(error);
      alert("Das nächste Level konnte nicht geladen werden. Bitte die Seite neu laden.");
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
      if (enemy instanceof Enemy || enemy instanceof FinalBoss) enemy.target = this.character;
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
    const boss = this.level.enemies.find((enemy) => enemy instanceof FinalBoss);
    if (this.character.isDead() || boss?.isDead()) return;
    this.startGameplayMusic();
  }

  stopGameplayMusic() {
    AudioError.stop(this.gameplayMusic);
  }
}
