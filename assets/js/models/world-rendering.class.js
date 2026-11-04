import { gameLoop } from "./game-loop.class.js";
import { WorldLogic } from "./world-logic.class.js";
import { LEVEL_SCALE } from "./level.class.js";
import { translate } from "../translation.js";
import { getIntroBlend } from "../camera-intro.js";
import { Background } from "./background.class.js";
import { Fireflies } from "./fireflies.class.js";
import { Lighting } from "./lighting.class.js";

const CANVAS_WIDTH = 1280;
const CANVAS_HEIGHT = 720;
const CAMERA_ZOOM = 1;
const VIEWPORT_WIDTH = CANVAS_WIDTH / CAMERA_ZOOM;
const VIEWPORT_HEIGHT = CANVAS_HEIGHT / CAMERA_ZOOM;
const CAMERA_SMOOTHING_X = 0.12;
const CAMERA_SMOOTHING_Y = 0.1;
const CAMERA_LOOK_AHEAD_PX = 100;
const CAMERA_LOOK_AHEAD_SMOOTHING = 0.04;
const SHAKE_NOISE_HZ = 40;
const SHAKE_NOISE_Y_SEED = 57;
const SHAKE_KICK_MS = 90;
const SHAKE_KICK_FACTOR = 0.8;
const DAMAGE_FLASH_MAX_ALPHA = 0.3;
const DAMAGE_FLASH_INNER_RADIUS = CANVAS_HEIGHT * 0.4;
const BEHIND_PORTAL_LAYERS = ["Background", "Deco_Hazard", "Hills"];
const BEHIND_ENTITIES_LAYERS = ["Ground", "Platforms"];
const FRONT_LAYERS = ["Hanging"];

/** Camera, screen effects and scene drawing of the world. */
export class WorldRendering extends WorldLogic {
  background = new Background();
  fireflies = new Fireflies();
  lighting = new Lighting();

  /** Disables image smoothing and resets the canvas transform. */
  setupCanvasContext() {
    this.ctx.imageSmoothingEnabled = false;
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  /**
   * Moves the camera towards the character, clamped to the level bounds.
   * @param {boolean} [isInstant=false] - Jump to the target without smoothing.
   */
  updateCamera(isInstant = false) {
    const { x, y, width, height } = this.character;
    this.updateCameraLookAhead(isInstant);
    const maxCameraX = Math.max(0, this.level.width - VIEWPORT_WIDTH);
    const maxCameraY = Math.max(0, this.level.height - VIEWPORT_HEIGHT);
    const targetX = Math.min(Math.max(x + width / 2 + this.cameraLookAhead - VIEWPORT_WIDTH / 2, 0), maxCameraX);
    const targetY = Math.min(Math.max(y + height / 2 - VIEWPORT_HEIGHT / 2, 0), maxCameraY);
    this.cameraX = this.getSmoothedValue(this.cameraX, -targetX, CAMERA_SMOOTHING_X, isInstant);
    this.cameraY = this.getSmoothedValue(this.cameraY, -targetY, CAMERA_SMOOTHING_Y, isInstant);
  }

  /**
   * Returns the current camera view, blended with the level overview during the intro.
   * @returns {{zoom: number, x: number, y: number}} Camera view.
   */
  getCameraView() {
    const gameplayView = { zoom: CAMERA_ZOOM, x: this.cameraX, y: this.cameraY };
    if (!gameLoop.isIntroPlaying) return gameplayView;
    return this.blendCameraViews(gameplayView, this.getOverviewView(), getIntroBlend(gameLoop.introElapsedMs));
  }

  /**
   * Returns a view that shows the whole level centered.
   * @returns {{zoom: number, x: number, y: number}} Overview view.
   */
  getOverviewView() {
    const zoom = Math.min(CANVAS_WIDTH / this.level.width, CANVAS_HEIGHT / this.level.height);
    return { zoom, x: (CANVAS_WIDTH / zoom - this.level.width) / 2, y: (CANVAS_HEIGHT / zoom - this.level.height) / 2 };
  }

  /**
   * Interpolates between two camera views, with exponential zoom.
   * @param {{zoom: number, x: number, y: number}} from - Start view.
   * @param {{zoom: number, x: number, y: number}} to - End view.
   * @param {number} blend - Blend factor from 0 to 1.
   * @returns {{zoom: number, x: number, y: number}} Blended view.
   */
  blendCameraViews(from, to, blend) {
    const zoom = from.zoom * (to.zoom / from.zoom) ** blend;
    const fromCenter = this.getViewCenter(from);
    const toCenter = this.getViewCenter(to);
    const centerX = fromCenter.x + (toCenter.x - fromCenter.x) * blend;
    const centerY = fromCenter.y + (toCenter.y - fromCenter.y) * blend;
    return { zoom, x: CANVAS_WIDTH / (2 * zoom) - centerX, y: CANVAS_HEIGHT / (2 * zoom) - centerY };
  }

  /**
   * Returns the level point at the center of a view.
   * @param {{zoom: number, x: number, y: number}} view - Camera view.
   * @returns {{x: number, y: number}} Center in level coordinates.
   */
  getViewCenter({ zoom, x, y }) {
    return { x: CANVAS_WIDTH / (2 * zoom) - x, y: CANVAS_HEIGHT / (2 * zoom) - y };
  }

  /**
   * Smoothly shifts the camera look-ahead in the character's facing direction.
   * @param {boolean} isInstant - Jump to the target without smoothing.
   */
  updateCameraLookAhead(isInstant) {
    const targetLookAhead = this.character.isOppositeDirection ? -CAMERA_LOOK_AHEAD_PX : CAMERA_LOOK_AHEAD_PX;
    this.cameraLookAhead = this.getSmoothedValue(this.cameraLookAhead, targetLookAhead, CAMERA_LOOK_AHEAD_SMOOTHING, isInstant);
  }

  /**
   * Moves a value towards a target by a smoothing factor.
   * @param {number} current - Current value.
   * @param {number} target - Target value.
   * @param {number} smoothing - Fraction of the distance covered per call.
   * @param {boolean} isInstant - Return the target directly.
   * @returns {number} New value.
   */
  getSmoothedValue(current, target, smoothing, isInstant) {
    return isInstant ? target : current + (target - current) * smoothing;
  }

  /** Draws the scene, screen effects, HUD, timer and ready message for one frame. */
  draw() {
    const shake = this.getShakeOffset();
    const view = this.getCameraView();
    this.drawScene(view.zoom, view.x + shake.x, view.y + shake.y);
    this.background.drawVignette(this.ctx);
    this.drawDamageFlash();
    this.statusBar.draw(this.ctx);
    this.bossHealthBar.draw(this.ctx);
    this.drawTimer();
    this.drawReadyMessage();
  }

  /** Draws the red vignette flash while a damage flash is active. */
  drawDamageFlash() {
    const progress = (performance.now() - this.damageFlashStartedAt) / this.damageFlashDurationMs;
    if (!(progress >= 0 && progress < 1)) return;
    this.ctx.fillStyle = this.getDamageFlashGradient(DAMAGE_FLASH_MAX_ALPHA * (1 - progress) ** 2);
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }

  /**
   * Creates the radial gradient of the damage flash.
   * @param {number} alpha - Opacity at the screen edge.
   * @returns {CanvasGradient} Gradient from transparent center to red edge.
   */
  getDamageFlashGradient(alpha) {
    const centerX = CANVAS_WIDTH / 2;
    const centerY = CANVAS_HEIGHT / 2;
    const gradient = this.ctx.createRadialGradient(centerX, centerY, DAMAGE_FLASH_INNER_RADIUS, centerX, centerY, Math.hypot(centerX, centerY));
    gradient.addColorStop(0, "rgba(220, 0, 0, 0)");
    gradient.addColorStop(1, `rgba(220, 0, 0, ${alpha})`);
    return gradient;
  }

  /**
   * Computes the current screen shake offset.
   * @returns {{x: number, y: number}} Offset in pixels, zero when no shake is active.
   */
  getShakeOffset() {
    const elapsedMs = performance.now() - this.shakeStartedAt;
    const { shakeDurationMs, shakeMagnitude } = this.activeShake;
    if (!(elapsedMs >= 0 && elapsedMs < shakeDurationMs)) return { x: 0, y: 0 };
    const intensity = shakeMagnitude * (1 - elapsedMs / shakeDurationMs) ** 2;
    return {
      x: Math.round(this.getShakeNoise(elapsedMs, 0) * intensity + this.getShakeKick(elapsedMs, shakeMagnitude)),
      y: Math.round(this.getShakeNoise(elapsedMs, SHAKE_NOISE_Y_SEED) * intensity * 0.5),
    };
  }

  /**
   * Computes the short horizontal kick at the start of a shake.
   * @param {number} elapsedMs - Time since the shake started.
   * @param {number} magnitude - Shake magnitude in pixels.
   * @returns {number} Horizontal kick in pixels.
   */
  getShakeKick(elapsedMs, magnitude) {
    const kickIntensity = Math.max(0, 1 - elapsedMs / SHAKE_KICK_MS) ** 2;
    return this.shakeDirection * magnitude * SHAKE_KICK_FACTOR * kickIntensity;
  }

  /**
   * Returns smooth noise for the shake by interpolating pseudo-random values.
   * @param {number} elapsedMs - Time since the shake started.
   * @param {number} seed - Offset to decorrelate axes.
   * @returns {number} Noise value between -1 and 1.
   */
  getShakeNoise(elapsedMs, seed) {
    const position = (elapsedMs * SHAKE_NOISE_HZ) / 1000 + seed;
    const index = Math.floor(position);
    const start = this.getNoiseValue(index);
    return start + (this.getNoiseValue(index + 1) - start) * (position - index);
  }

  /**
   * Returns a deterministic pseudo-random value for a noise index.
   * @param {number} index - Noise sample index.
   * @returns {number} Value between -1 and 1.
   */
  getNoiseValue(index) {
    const value = Math.sin((index + this.shakeSeed) * 12.9898) * 43758.5453;
    return (value - Math.floor(value)) * 2 - 1;
  }

  /**
   * Draws background, level layers, objects and effects with the given camera transform.
   * @param {number} zoom - Camera zoom.
   * @param {number} offsetX - Horizontal camera offset in level pixels.
   * @param {number} offsetY - Vertical camera offset in level pixels.
   */
  drawScene(zoom, offsetX, offsetY) {
    this.ctx.save();
    this.ctx.imageSmoothingEnabled = zoom !== CAMERA_ZOOM;
    this.ctx.setTransform(zoom, 0, 0, zoom, Math.round(offsetX * zoom), Math.round(offsetY * zoom));
    const viewRect = this.getViewRect(zoom, offsetX, offsetY);
    this.background.drawBehindLevel(this.ctx, viewRect, this.level.height);
    this.fireflies.drawBehind(this.ctx, viewRect);
    this.drawLayers(BEHIND_PORTAL_LAYERS);
    this.addObjectsToMap(this.level.exits);
    this.addObjectsToMap(this.level.checkpoints);
    this.addObjectsToMap(this.level.healingPlants.filter((plant) => !plant.isCollected));
    this.drawLayers(BEHIND_ENTITIES_LAYERS);
    this.lighting.drawGlows(this.ctx, this.level, this.isExitOpen());
    this.addObjectsToMap(this.level.items.filter((item) => !item.isCollected));
    this.addObjectsToMap(this.level.keys.filter((key) => !key.isCollected));
    this.addObjectsToMap(this.level.enemies);
    this.addObjectsToMap(this.level.bossEffects);
    this.addToMap(this.character);
    this.drawLayers(FRONT_LAYERS);
    this.fireflies.drawFront(this.ctx, viewRect);
    this.ctx.restore();
  }

  /**
   * Returns the visible area in level coordinates.
   * @param {number} zoom - Camera zoom.
   * @param {number} offsetX - Horizontal camera offset.
   * @param {number} offsetY - Vertical camera offset.
   * @returns {{left: number, top: number, width: number, height: number}} Visible rectangle.
   */
  getViewRect(zoom, offsetX, offsetY) {
    return { left: -offsetX, top: -offsetY, width: CANVAS_WIDTH / zoom, height: CANVAS_HEIGHT / zoom };
  }

  /**
   * Draws several level layers in order.
   * @param {Array<string>} layerNames - Names of the layers.
   */
  drawLayers(layerNames) {
    layerNames.forEach((layerName) => this.drawLayer(layerName));
  }

  /**
   * Draws one level layer scaled to level size.
   * @param {string} layerName - Name of the layer.
   * @throws {Error} If the level has no layer with that name.
   */
  drawLayer(layerName) {
    const layer = this.level.layers.find((levelLayer) => levelLayer.name === layerName);
    if (!layer) throw new Error(`Missing level layer: ${layerName}`);
    this.ctx.drawImage(layer.image, 0, 0, layer.image.width * LEVEL_SCALE, layer.image.height * LEVEL_SCALE);
  }

  /** Draws the centered "ready" text during the game start. */
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

  /**
   * Formats the elapsed run time.
   * @returns {string} Time as "MM:SS:mmm".
   */
  getTimerText() {
    const elapsedMs = this.getElapsedMs();
    const totalSeconds = Math.floor(elapsedMs / 1000);
    const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
    const seconds = String(totalSeconds % 60).padStart(2, "0");
    const millis = String(Math.floor(elapsedMs % 1000)).padStart(3, "0");
    return `${minutes}:${seconds}:${millis}`;
  }

  /** Draws the run timer in the top right corner. */
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

  /**
   * Draws a list of objects.
   * @param {Array<DrawableObject>} objects - Objects to draw.
   */
  addObjectsToMap(objects) {
    objects.forEach((object) => {
      this.addToMap(object);
    });
  }

  /**
   * Draws an object, mirrored if its facing differs from its sprite direction.
   * @param {DrawableObject} movableObject - Object to draw.
   */
  addToMap(movableObject) {
    if (movableObject.isOppositeDirection !== movableObject.isSpriteDirectionInverted) {
      this.drawFlipped(movableObject);
    } else {
      movableObject.draw(this.ctx);
    }
  }

  /**
   * Draws an object mirrored horizontally around its center.
   * @param {DrawableObject} movableObject - Object to draw.
   */
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
