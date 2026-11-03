import { gameLoop } from "./game-loop.class.js";
import { drawGlow } from "../glow-sprite.js";
import { LEVEL_THEMES } from "../level-themes.js";

const CANVAS_WIDTH = 1280;
const CANVAS_HEIGHT = 720;
const PARTICLE_FACTOR = 0.8;
const layerImages = new Map();

export class Background {
  theme = null;
  layers = [];
  particles = [];
  vignetteGradient = null;

  constructor() {
    this.setTheme(LEVEL_THEMES.forest);
  }

  setTheme(theme) {
    if (this.theme === theme) return;
    this.theme = theme;
    this.layers = theme.layers.map(({ src, factor, isOpaque = false }) => ({ image: this.getLayerImage(src), factor, isOpaque }));
    this.particles = Array.from({ length: theme.particles.count }, () => this.createParticle(theme.particles));
    this.vignetteGradient = null;
  }

  getLayerImage(src) {
    if (!layerImages.has(src)) {
      const image = new Image();
      image.src = src;
      layerImages.set(src, image);
    }
    return layerImages.get(src);
  }

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

  randomBetween([min, max]) {
    return min + Math.random() * (max - min);
  }

  drawBehindLevel(ctx, view, levelHeight) {
    this.layers.forEach((layer) => this.drawParallaxLayer(ctx, layer, view, levelHeight));
    this.drawParticles(ctx, view);
  }

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

  drawRepeated(ctx, color, fieldX, fieldY, size, brightness, view) {
    const startX = fieldX + Math.ceil((view.left - size - fieldX) / CANVAS_WIDTH) * CANVAS_WIDTH;
    const startY = fieldY + Math.ceil((view.top - size - fieldY) / CANVAS_HEIGHT) * CANVAS_HEIGHT;
    for (let x = startX; x < view.left + view.width; x += CANVAS_WIDTH) {
      for (let y = startY; y < view.top + view.height; y += CANVAS_HEIGHT) {
        drawGlow(ctx, color, x, y, size, brightness);
      }
    }
  }

  wrap(value, size) {
    return ((value % size) + size) % size;
  }

  drawVignette(ctx) {
    this.vignetteGradient ??= this.createVignetteGradient(ctx);
    ctx.fillStyle = this.vignetteGradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }

  createVignetteGradient(ctx) {
    const centerX = CANVAS_WIDTH / 2;
    const centerY = CANVAS_HEIGHT / 2;
    const gradient = ctx.createRadialGradient(centerX, centerY, CANVAS_HEIGHT * 0.45, centerX, centerY, Math.hypot(centerX, centerY));
    gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
    gradient.addColorStop(1, this.theme.vignetteColor);
    return gradient;
  }
}
