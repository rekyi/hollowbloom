import { appState } from "../data.js";
import { gameLoop } from "./game-loop.class.js";
import { StatusBar } from "./status-bar.class.js";
import { Enemy } from "./enemies.class.js";
import { FinalBoss } from "./final-boss.class.js";
import { createLevel1 } from "../level/level1.js";
import { FemaleCharacter } from "./female-character.class.js";
import { AudioError } from "./audio-error.class.js";
import { applyMusicVolume } from "../audio.js";
import { playSfx } from "../sfx.js";

const READY_DURATION_MS = 1500;

export class World {
  character;
  level;
  gameplayMusic;
  canvasRef;
  ctx;
  keyboard;
  cameraX = 0;
  statusBar = new StatusBar();
  shakeStartedAt = Number.NEGATIVE_INFINITY;
  shakeDurationMs = 180;
  shakeMagnitude = 7;
  timerStartMs = null;
  timerStopMs = null;
  defeatedEnemies = 0;
  countedDefeatedEnemies = new Set();
  gameOverDelayStartedAt = null;
  gameOverDelayMs = 1000;
  isGameOver = false;
  isVictory = false;
  onGameOver;
  onVictory;

  constructor(canvasRef, keyboard, onGameOver, CharacterClass = FemaleCharacter, onVictory = () => {}) {
    this.canvasRef = canvasRef;
    this.ctx = canvasRef.getContext("2d");
    this.keyboard = keyboard;
    this.character = new CharacterClass();
    this.level = createLevel1();
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
    this.cameraX = -this.character.x;
    this.level.enemies.forEach((enemy) => {
      if (enemy instanceof Enemy || enemy instanceof FinalBoss) enemy.target = this.character;
    });
  }

  draw() {
    const shake = this.getShakeOffset();
    const cameraX = Math.round(this.cameraX);
    this.updateLevelBackground(cameraX + shake.x);
    this.ctx.clearRect(0, 0, this.canvasRef.width, this.canvasRef.height);
    this.drawScene(cameraX + shake.x, shake.y);
    this.statusBar.draw(this.ctx);
    this.drawTimer();
    this.drawReadyMessage();
  }

  getShakeOffset() {
    const shakeElapsed = gameLoop.now() - this.shakeStartedAt;
    const isShaking = Number.isFinite(shakeElapsed) && shakeElapsed >= 0 && shakeElapsed < this.shakeDurationMs;
    if (!isShaking) return { x: 0, y: 0 };
    const shakeIntensity = 1 - shakeElapsed / this.shakeDurationMs;
    return {
      x: Math.round(Math.sin(shakeElapsed * 0.08) * this.shakeMagnitude * shakeIntensity),
      y: Math.round(Math.cos(shakeElapsed * 0.11) * this.shakeMagnitude * 0.5 * shakeIntensity),
    };
  }

  updateLevelBackground(offsetX) {
    const backgroundMargin = this.shakeMagnitude + 1;
    this.level.updateBackground(offsetX + backgroundMargin, this.canvasRef.width + backgroundMargin * 2);
  }

  drawScene(offsetX, offsetY) {
    this.ctx.save();
    this.ctx.translate(offsetX, offsetY);
    this.addObjectsToMap(this.level.background);
    this.addObjectsToMap(this.level.items.filter((item) => !item.isCollected));
    this.addToMap(this.character);
    this.addObjectsToMap(this.level.enemies);
    this.addObjectsToMap(this.level.clouds);
    this.ctx.restore();
  }

  run() {
    gameLoop.runEvery(1000 / 25, () => this.removeDeadEnemies());
    gameLoop.start(
      (dt) => this.update(dt),
      () => this.draw(),
      READY_DURATION_MS,
    );
  }

  drawReadyMessage() {
    if (!gameLoop.isStarting) return;
    this.ctx.save();
    this.ctx.fillStyle = "white";
    this.ctx.strokeStyle = "black";
    this.ctx.lineWidth = 5;
    this.ctx.font = "bold 56px sans-serif";
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.ctx.strokeText("READY!", this.canvasRef.width / 2, this.canvasRef.height / 2);
    this.ctx.fillText("READY!", this.canvasRef.width / 2, this.canvasRef.height / 2);
    this.ctx.restore();
  }

  update() {
    this.trackDefeatedEnemies();
    this.checkCollision();
    this.checkItemCollection();
    this.checkTimerStop();
    this.checkVictory();
    this.checkGameOver();
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

  checkItemCollection() {
    if (this.character.isDead()) return;
    const characterHitbox = this.character.getHitbox();
    this.level.items.forEach((item) => {
      if (item.isCollected || !this.hitboxesOverlap(characterHitbox, item.getHitbox())) return;
      item.isCollected = true;
      playSfx("coinCollect");
      this.character.collectCoin();
      this.statusBar.setCoins(this.character.coins);
    });
  }

  checkGameOver() {
    if (this.isGameOver || this.isVictory || !this.character.isDead()) return;
    this.stopGameplayMusic();
    this.timerStopMs ??= gameLoop.now();
    if (!this.isDeathAnimationDone()) return;
    this.gameOverDelayStartedAt ??= gameLoop.now();
    if (gameLoop.now() - this.gameOverDelayStartedAt < this.gameOverDelayMs) return;
    this.finishGame();
  }

  isDeathAnimationDone() {
    return this.character.isDeathStarted && this.character.currentImage >= this.character.IMAGES_DEAD.length * 4;
  }

  finishGame() {
    this.isGameOver = true;
    gameLoop.stop();
    this.onGameOver();
  }

  checkVictory() {
    this.dyingBoss ??= this.level.enemies.find((enemy) => enemy instanceof FinalBoss && enemy.isDead());
    if (this.isVictory || !this.dyingBoss?.isDeathAnimationFinished) return;
    this.isVictory = true;
    this.stopGameplayMusic();
    this.timerStopMs ??= gameLoop.now();
    gameLoop.stop();
    window.setTimeout(this.onVictory, 1000);
  }

  startTimer() {
    if (this.timerStartMs === null) this.timerStartMs = gameLoop.now();
  }

  checkTimerStop() {
    const boss = this.level.enemies.find((enemy) => enemy instanceof FinalBoss);
    if (!boss || !boss.isDead()) return;
    this.stopGameplayMusic();
    if (this.timerStartMs !== null && this.timerStopMs === null) this.timerStopMs = gameLoop.now();
  }

  trackDefeatedEnemies() {
    this.level.enemies.forEach((enemy) => {
      if (!enemy.isDead() || this.countedDefeatedEnemies.has(enemy)) return;
      this.countedDefeatedEnemies.add(enemy);
      this.defeatedEnemies++;
    });
  }

  getTimerText() {
    const elapsedMs = this.timerStartMs === null ? 0 : (this.timerStopMs ?? gameLoop.now()) - this.timerStartMs;
    const totalSeconds = Math.floor(elapsedMs / 1000);
    const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
    const seconds = String(totalSeconds % 60).padStart(2, "0");
    const millis = String(Math.floor(elapsedMs % 1000)).padStart(3, "0");
    return `${minutes}:${seconds}:${millis}`;
  }

  drawTimer() {
    const text = this.getTimerText();
    this.ctx.save();
    this.ctx.fillStyle = "white";
    this.ctx.strokeStyle = "black";
    this.ctx.lineWidth = 3;
    this.ctx.font = "bold 24px monospace";
    this.ctx.textAlign = "right";
    this.ctx.textBaseline = "top";
    this.ctx.strokeText(text, this.canvasRef.width - 20, 16);
    this.ctx.fillText(text, this.canvasRef.width - 20, 16);
    this.ctx.restore();
  }

  checkCollision() {
    this.level.enemies.forEach((enemy) => this.checkEnemyAttack(enemy));
  }

  checkEnemyAttack(enemy) {
    if (enemy.isDead() || !enemy.isAttackFrameActive() || enemy.isAttackHitRegistered) return;
    if (!this.hitboxesOverlap(this.character.getHitbox(), enemy.getAttackHitbox())) return;
    if (!this.character.hitByEnemy(enemy)) return;
    this.statusBar.setHearts(this.character.hp);
    enemy.isAttackHitRegistered = true;
    this.triggerHitFeedback();
  }

  triggerHitFeedback() {
    gameLoop.hitStop(60);
    this.shakeStartedAt = gameLoop.now();
  }

  hitboxesOverlap(a, b) {
    return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
  }

  removeDeadEnemies() {
    this.trackDefeatedEnemies();
    this.level.enemies = this.level.enemies.filter((enemy) => !(enemy instanceof Enemy || enemy instanceof FinalBoss ? enemy.isDeathAnimationFinished : enemy.isDead()));
  }

  addObjectsToMap(objects) {
    objects.forEach((object) => {
      this.addToMap(object);
    });
  }

  addToMap(movableObject) {
    if (movableObject.isOppositeDirection) {
      this.drawFlipped(movableObject);
    } else {
      movableObject.draw(this.ctx);
    }

    movableObject.drawFrame(this.ctx);
  }

  drawFlipped(movableObject) {
    const centerX = movableObject.x + movableObject.width / 2;
    this.ctx.save();
    this.ctx.translate(centerX, 0);
    this.ctx.scale(-1, 1);
    this.ctx.translate(-centerX, 0);
    movableObject.draw(this.ctx);
    this.ctx.restore();
  }
}
