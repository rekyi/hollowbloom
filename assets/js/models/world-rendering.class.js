import { gameLoop } from "./game-loop.class.js";
import { WorldLogic } from "./world-logic.class.js";

const LOGICAL_CANVAS_WIDTH = 720;
const LOGICAL_CANVAS_HEIGHT = 480;
const BACKGROUND_COLOR = "#000";

export class WorldRendering extends WorldLogic {
  setupCanvasContext() {
    this.ctx.imageSmoothingEnabled = false;
    this.ctx.setTransform(this.canvasRef.width / LOGICAL_CANVAS_WIDTH, 0, 0, this.canvasRef.height / LOGICAL_CANVAS_HEIGHT, 0, 0);
  }

  draw() {
    const shake = this.getShakeOffset();
    const cameraX = Math.round(this.cameraX);
    this.ctx.fillStyle = BACKGROUND_COLOR;
    this.ctx.fillRect(0, 0, LOGICAL_CANVAS_WIDTH, LOGICAL_CANVAS_HEIGHT);
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

  drawScene(offsetX, offsetY) {
    this.ctx.save();
    this.ctx.translate(offsetX, offsetY);
    this.addObjectsToMap(this.level.items.filter((item) => !item.isCollected));
    this.addToMap(this.character);
    this.addObjectsToMap(this.level.enemies);
    this.ctx.restore();
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
    this.ctx.strokeText("READY!", LOGICAL_CANVAS_WIDTH / 2, LOGICAL_CANVAS_HEIGHT / 2);
    this.ctx.fillText("READY!", LOGICAL_CANVAS_WIDTH / 2, LOGICAL_CANVAS_HEIGHT / 2);
    this.ctx.restore();
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
    this.ctx.strokeText(text, LOGICAL_CANVAS_WIDTH - 20, 16);
    this.ctx.fillText(text, LOGICAL_CANVAS_WIDTH - 20, 16);
    this.ctx.restore();
  }

  addObjectsToMap(objects) {
    objects.forEach((object) => {
      this.addToMap(object);
    });
  }

  addToMap(movableObject) {
    if (movableObject.isOppositeDirection !== movableObject.isSpriteDirectionInverted) {
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
