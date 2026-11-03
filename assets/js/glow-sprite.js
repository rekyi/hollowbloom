const GLOW_SPRITE_SIZE = 64;
const glowSprites = new Map();

export function drawGlow(ctx, color, centerX, centerY, size, alpha) {
  if (alpha <= 0.01) return;
  ctx.globalAlpha = Math.min(alpha, 1);
  ctx.drawImage(getGlowSprite(color), centerX - size / 2, centerY - size / 2, size, size);
}

function getGlowSprite(color) {
  if (!glowSprites.has(color)) glowSprites.set(color, createGlowSprite(color));
  return glowSprites.get(color);
}

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
