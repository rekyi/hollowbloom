const GLOW_SPRITE_SIZE = 64;
const glowSprites = new Map();

/**
 * Draws a cached radial glow centered on a point.
 * @param {CanvasRenderingContext2D} ctx - Target canvas context.
 * @param {string} color - RGB color as "r, g, b".
 * @param {number} centerX - Glow center x.
 * @param {number} centerY - Glow center y.
 * @param {number} size - Glow diameter.
 * @param {number} alpha - Glow opacity; skipped if near zero.
 */
export function drawGlow(ctx, color, centerX, centerY, size, alpha) {
  if (alpha <= 0.01) return;
  ctx.globalAlpha = Math.min(alpha, 1);
  ctx.drawImage(getGlowSprite(color), centerX - size / 2, centerY - size / 2, size, size);
}

/**
 * Gets the glow sprite for a color, creating and caching it if needed.
 * @param {string} color - RGB color as "r, g, b".
 * @returns {HTMLCanvasElement} The glow sprite.
 */
function getGlowSprite(color) {
  if (!glowSprites.has(color)) glowSprites.set(color, createGlowSprite(color));
  return glowSprites.get(color);
}

/**
 * Renders a radial gradient glow onto an offscreen canvas.
 * @param {string} color - RGB color as "r, g, b".
 * @returns {HTMLCanvasElement} The rendered glow sprite.
 */
function createGlowSprite(color) {
  const canvas = document.createElement("canvas");
  canvas.width = GLOW_SPRITE_SIZE;
  canvas.height = GLOW_SPRITE_SIZE;
  const ctx = canvas.getContext("2d");
  const center = GLOW_SPRITE_SIZE / 2;
  const gradient = ctx.createRadialGradient(center, center, 0, center, center, center);
  gradient.addColorStop(0, `rgba(${color}, 1)`);
  gradient.addColorStop(0.25, `rgba(${color}, 0.55)`);
  gradient.addColorStop(0.6, `rgba(${color}, 0.15)`);
  gradient.addColorStop(1, `rgba(${color}, 0)`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, GLOW_SPRITE_SIZE, GLOW_SPRITE_SIZE);
  return canvas;
}
