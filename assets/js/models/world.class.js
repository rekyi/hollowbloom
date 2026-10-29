import { gameLoop } from "./game-loop.class.js";
import { Enemy } from "./enemies.class.js";
import { FinalBoss } from "./final-boss.class.js";
import { createLevel1 } from "../level/level1.js";
import { FemaleCharacter } from "./female-character.class.js";
import { AudioError } from "./audio-error.class.js";
import { applyMusicVolume } from "../audio.js";
import { WorldRendering } from "./world-rendering.class.js";

const READY_DURATION_MS = 1500;

export class World extends WorldRendering {
  constructor(canvasRef, keyboard, onGameOver, CharacterClass = FemaleCharacter, onVictory = () => {}, levelAssets) {
    super();
    this.canvasRef = canvasRef;
    this.ctx = canvasRef.getContext("2d");
    this.setupCanvasContext();
    this.keyboard = keyboard;
    this.character = new CharacterClass();
    this.level = createLevel1(levelAssets);
    this.onGameOver = onGameOver;
    this.onVictory = onVictory;
    this.setupGameplayMusic();
    this.setWorld();
    this.run();
  }

  setupGameplayMusic() {
    this.gameplayMusic = new Audio("assets/audio/music/gameplay.ogg");
    this.gameplayMusic.loop = true;
    applyMusicVolume(this.gameplayMusic);
    this.startGameplayMusic();
  }

  setWorld() {
    this.character.world = this;
    this.updateCamera(true);
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
