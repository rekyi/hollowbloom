import { gameLoop } from "./game-loop.class.js";
import { drawGlow } from "../glow-sprite.js";
import { LEVEL_THEMES } from "../level-themes.js";

const CANVAS_WIDTH = 1280;
const CANVAS_HEIGHT = 720;
const PARTICLE_FACTOR = 0.8;
const layerImages = new Map();

/** Themed parallax background with sky fill, floating particles and vignette. */
export class Background {
  theme = null;
  layers = [];
  particles = [];
  vignetteGradient = null;

  /** Creates the background with the forest theme. */
  constructor() {
    this.setTheme(LEVEL_THEMES.forest);
  }

  /**
   * Switches to a theme and rebuilds layers and particles.
   * @param {Object} theme - Level theme from LEVEL_THEMES.
   */
  setTheme(theme) {
    if (this.theme === theme) return;
    this.theme = theme;
    this.layers = theme.layers.map(({ src, factor, isOpaque = false }) => ({ image: this.getLayerImage(src), factor, isOpaque }));
    this.particles = Array.from({ length: theme.particles.count }, () => this.createParticle(theme.particles));
    this.vignetteGradient = null;
  }

  /**
   * Gets a cached layer image, loading it on first use.
   * @param {string} src - Image path.
   * @returns {HTMLImageElement} The layer image.
   */
  getLayerImage(src) {
    if (!layerImages.has(src)) {
      const image = new Image();
      image.src = src;
      layerImages.set(src, image);
    }
    return layerImages.get(src);
  }

  /**
   * Creates a randomly placed rising particle.
   * @param {{riseSpeed: number[], driftSpeed: number, size: number[]}} settings - Particle settings of the theme.
   * @returns {Object} The particle.
   */
  createParticle({ riseSpeed, driftSpeed, size }) {
    return {
      x: Math.random() * CANVAS_WIDTH,
      y: Math.random() * CANVAS_HEIGHT,
      speedX: (Math.random() - 0.5) * driftSpeed,
      speedY: -this.randomBetween(riseSpeed),
      size: this.randomBetween(size),
      twinkleSpeed: 0.001 + Math.random() * 0.002,
      twinklePhase: Math.random() * Math.PI * 2,
    };
  }

  /**
   * Gets a random number in a range.
   * @param {number[]} range - [min, max].
   * @returns {number} Random number between min and max.
   */
  randomBetween([min, max]) {
    return min + Math.random() * (max - min);
  }

  /**
   * Draws all parallax layers and particles behind the level.
   * @param {CanvasRenderingContext2D} ctx - Target canvas context.
   * @param {{left: number, top: number, width: number, height: number}} view - Visible world area.
   * @param {number} levelHeight - Level height in pixels.
   */
  drawBehindLevel(ctx, view, levelHeight) {
    this.layers.forEach((layer) => this.drawParallaxLayer(ctx, layer, view, levelHeight));
    this.drawParticles(ctx, view);
  }

  /**
   * Draws a horizontally tiled layer with parallax offset, bottom-aligned to the level.
   * @param {CanvasRenderingContext2D} ctx - Target canvas context.
   * @param {{image: HTMLImageElement, factor: number, isOpaque: boolean}} layer - Layer to draw.
   * @param {{left: number, top: number, width: number, height: number}} view - Visible world area.
   * @param {number} levelHeight - Level height in pixels.
   */
  drawParallaxLayer(ctx, { image, factor, isOpaque }, view, levelHeight) {
    const isLoaded = image.complete && image.naturalWidth > 0;
    const height = isLoaded ? image.height : 0;
    const bottomAlignedY = levelHeight - height - (levelHeight - view.height) * (1 - factor);
    const y = Math.round(view.top * (1 - factor) + bottomAlignedY);
    if (isOpaque) this.fillSkyAroundLayer(ctx, view, y, height);
    if (!isLoaded) return;
    const originX = view.left * (1 - factor);
    let x = originX + Math.floor((view.left - originX) / image.width) * image.width;
    for (; x < view.left + view.width; x += image.width) {
      ctx.drawImage(image, Math.round(x), y);
    }
  }

  /**
   * Fills the visible area above and below the far layer with sky colors.
   * @param {CanvasRenderingContext2D} ctx - Target canvas context.
   * @param {{left: number, top: number, width: number, height: number}} view - Visible world area.
   * @param {number} layerTop - Top of the layer.
   * @param {number} layerHeight - Height of the layer.
   */
  fillSkyAroundLayer(ctx, view, layerTop, layerHeight) {
    const layerBottom = layerTop + layerHeight;
    const viewBottom = view.top + view.height;
    if (layerTop > view.top) {
      ctx.fillStyle = this.theme.skyTopColor;
      ctx.fillRect(view.left, view.top, view.width, layerTop - view.top);
    }
    if (layerBottom < viewBottom) {
      const fillTop = Math.max(layerBottom, view.top);
      ctx.fillStyle = this.theme.skyBottomColor;
      ctx.fillRect(view.left, fillTop, view.width, viewBottom - fillTop);
    }
  }

  /**
   * Draws the twinkling particles with slight parallax.
   * @param {CanvasRenderingContext2D} ctx - Target canvas context.
   * @param {{left: number, top: number, width: number, height: number}} view - Visible world area.
   */
  drawParticles(ctx, view) {
    const { color, alpha } = this.theme.particles;
    const now = gameLoop.now();
    const originX = view.left * (1 - PARTICLE_FACTOR);
    const originY = view.top * (1 - PARTICLE_FACTOR);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.imageSmoothingEnabled = true;
    this.particles.forEach((particle) => {
      const x = this.wrap(particle.x + particle.speedX * now, CANVAS_WIDTH);
      const y = this.wrap(particle.y + particle.speedY * now, CANVAS_HEIGHT);
      const brightness = alpha + alpha * Math.sin(now * particle.twinkleSpeed + particle.twinklePhase);
      this.drawRepeated(ctx, color, originX + x, originY + y, particle.size, brightness, view);
    });
    ctx.restore();
  }

  /**
   * Draws a particle repeated across the view in canvas-sized tiles.
   * @param {CanvasRenderingContext2D} ctx - Target canvas context.
   * @param {string} color - RGB color as "r, g, b".
   * @param {number} fieldX - Particle x in its tile.
   * @param {number} fieldY - Particle y in its tile.
   * @param {number} size - Glow size.
   * @param {number} brightness - Glow opacity.
   * @param {{left: number, top: number, width: number, height: number}} view - Visible world area.
   */
  drawRepeated(ctx, color, fieldX, fieldY, size, brightness, view) {
    const startX = fieldX + Math.ceil((view.left - size - fieldX) / CANVAS_WIDTH) * CANVAS_WIDTH;
    const startY = fieldY + Math.ceil((view.top - size - fieldY) / CANVAS_HEIGHT) * CANVAS_HEIGHT;
    for (let x = startX; x < view.left + view.width; x += CANVAS_WIDTH) {
      for (let y = startY; y < view.top + view.height; y += CANVAS_HEIGHT) {
        drawGlow(ctx, color, x, y, size, brightness);
      }
    }
  }

  /**
   * Wraps a value into 0..size.
   * @param {number} value - Value to wrap.
   * @param {number} size - Range size.
   * @returns {number} Wrapped value.
   */
  wrap(value, size) {
    return ((value % size) + size) % size;
  }

  /**
   * Draws the vignette over the whole canvas.
   * @param {CanvasRenderingContext2D} ctx - Target canvas context.
   */
  drawVignette(ctx) {
    this.vignetteGradient ??= this.createVignetteGradient(ctx);
    ctx.fillStyle = this.vignetteGradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }

  /**
   * Creates the radial vignette gradient in the theme color.
   * @param {CanvasRenderingContext2D} ctx - Target canvas context.
   * @returns {CanvasGradient} The gradient.
   */
  createVignetteGradient(ctx) {
    const centerX = CANVAS_WIDTH / 2;
    const centerY = CANVAS_HEIGHT / 2;
    const gradient = ctx.createRadialGradient(centerX, centerY, CANVAS_HEIGHT * 0.45, centerX, centerY, Math.hypot(centerX, centerY));
    gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
    gradient.addColorStop(1, this.theme.vignetteColor);
    return gradient;
  }
}
