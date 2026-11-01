import { gameLoop } from "./game-loop.class.js";
import { WorldLogic } from "./world-logic.class.js";
import { LEVEL_SCALE, TILE_SIZE } from "./level.class.js";
import { translate } from "../translation.js";

const CANVAS_WIDTH = 1280;
const CANVAS_HEIGHT = 720;
const CAMERA_ZOOM = 1;
const VIEWPORT_WIDTH = CANVAS_WIDTH / CAMERA_ZOOM;
const VIEWPORT_HEIGHT = CANVAS_HEIGHT / CAMERA_ZOOM;
const BACKGROUND_COLOR = "#000";
const CAMERA_SMOOTHING_Y = 0.1;
const BEHIND_ENTITIES_LAYERS = ["Background.png", "Deco_Hazard.png", "Hills.png"];
const FRONT_LAYERS = ["Ground.png", "Platforms.png", "Hanging.png"];
const COLLISION_OVERLAY_COLORS = { 1: "rgba(255, 0, 0, 0.35)", 2: "rgba(255, 165, 0, 0.5)", 3: "rgba(0, 128, 255, 0.5)" };

export class WorldRendering extends WorldLogic {
  setupCanvasContext() {
    this.ctx.imageSmoothingEnabled = false;
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  updateCamera(isInstant = false) {
    const { x, y, width, height } = this.character;
    const maxCameraX = Math.max(0, this.level.width - VIEWPORT_WIDTH);
    const maxCameraY = Math.max(0, this.level.height - VIEWPORT_HEIGHT);
    const targetX = Math.min(Math.max(x + width / 2 - VIEWPORT_WIDTH / 2, 0), maxCameraX);
    const targetY = Math.min(Math.max(y + height / 2 - VIEWPORT_HEIGHT / 2, 0), maxCameraY);
    this.cameraX = -targetX;
    this.cameraY = isInstant ? -targetY : this.cameraY + (-targetY - this.cameraY) * CAMERA_SMOOTHING_Y;
  }

  draw() {
    const shake = this.getShakeOffset();
    this.ctx.fillStyle = BACKGROUND_COLOR;
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    this.drawScene(this.cameraX + shake.x, this.cameraY + shake.y);
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
    this.ctx.setTransform(CAMERA_ZOOM, 0, 0, CAMERA_ZOOM, Math.round(offsetX * CAMERA_ZOOM), Math.round(offsetY * CAMERA_ZOOM));
    this.drawLayers(BEHIND_ENTITIES_LAYERS);
    this.addObjectsToMap(this.level.exits);
    this.addObjectsToMap(this.level.items.filter((item) => !item.isCollected));
    this.addObjectsToMap(this.level.keys.filter((key) => !key.isCollected));
    this.addObjectsToMap(this.level.enemies);
    this.addObjectsToMap(this.level.bossEffects);
    this.addToMap(this.character);
    this.drawLayers(FRONT_LAYERS);
    this.drawCollisionOverlay();
    this.ctx.restore();
  }

  toggleCollisionOverlay() {
    this.isCollisionOverlayVisible = !this.isCollisionOverlayVisible;
  }

  drawCollisionOverlay() {
    if (!this.isCollisionOverlayVisible) return;
    this.level.collisionGrid.forEach((cells, row) => cells.forEach((value, column) => this.drawCollisionTile(value, column, row)));
  }

  drawCollisionTile(value, column, row) {
    const color = COLLISION_OVERLAY_COLORS[value];
    if (!color) return;
    this.ctx.fillStyle = color;
    this.ctx.fillRect(column * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE);
  }

  drawLayers(layerNames) {
    layerNames.forEach((layerName) => this.drawLayer(layerName));
  }

  drawLayer(layerName) {
    const layer = this.level.layers.find((levelLayer) => levelLayer.name === layerName);
    if (!layer) throw new Error(`Missing level layer: ${layerName}`);
    this.ctx.drawImage(layer.image, 0, 0, layer.image.width * LEVEL_SCALE, layer.image.height * LEVEL_SCALE);
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
    const text = translate("game.ready");
    this.ctx.strokeText(text, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    this.ctx.fillText(text, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
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
    this.ctx.strokeText(text, CANVAS_WIDTH - 20, 36);
    this.ctx.fillText(text, CANVAS_WIDTH - 20, 36);
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
