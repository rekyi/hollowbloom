import { gameLoop } from "./game-loop.class.js";
import { drawGlow } from "../glow-sprite.js";
import { LEVEL_SCALE } from "./level.class.js";

const BUD_MIN_LUMINANCE = 190;
const BUD_MIN_PIXELS = 25;
const DETECTION_SCALE = 0.5;
const BUD_GLOW = { sizeFactor: 9, alpha: 0.75, pulseSpeed: 0.0015 };
const PICKUP_GLOWS = {
  coin: { color: "255, 200, 70", sizeFactor: 2.4, alpha: 0.6 },
  key: { color: "255, 215, 140", sizeFactor: 3.2, alpha: 0.7 },
  bossKey: { color: "220, 205, 140", sizeFactor: 3.2, alpha: 0.7 },
  portal: { color: "80, 226, 196", sizeFactor: 1.9, alpha: 0.5 },
  bossPortal: { color: "255, 112, 40", sizeFactor: 1.9, alpha: 0.5 },
};
const LOCKED_PORTAL_STRENGTH = 0.35;
const CHECKPOINT_GLOW = { color: "80, 226, 196", size: 170, alpha: 0.5, pulseSpeed: 0.003 };
const budCache = new WeakMap();

export function prepareLevelLighting({ data, layers }) {
  return getBuds({ width: data.width * LEVEL_SCALE, height: data.height * LEVEL_SCALE, layers });
}

export class Lighting {
  buds = [];
  level = null;

  setLevel(level) {
    this.level = level;
    this.buds = [];
    getBuds(level).then((buds) => {
      if (this.level === level) this.buds = buds;
    });
  }

  drawGlows(ctx, level, isExitOpen) {
    const now = gameLoop.now();
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.imageSmoothingEnabled = true;
    this.buds.forEach((bud) => this.drawBudGlow(ctx, bud, now));
    level.items.filter((item) => !item.isCollected).forEach((item) => this.drawObjectGlow(ctx, item, PICKUP_GLOWS.coin, now));
    level.keys.filter((key) => !key.isCollected).forEach((key) => this.drawObjectGlow(ctx, key, key.isBossKey ? PICKUP_GLOWS.bossKey : PICKUP_GLOWS.key, now));
    level.checkpoints.filter((checkpoint) => checkpoint.isActive).forEach((checkpoint) => this.drawCheckpointGlow(ctx, checkpoint, now));
    level.exits.forEach((exit) => this.drawObjectGlow(ctx, exit, exit.isBossExit ? PICKUP_GLOWS.bossPortal : PICKUP_GLOWS.portal, now, isExitOpen ? 1 : LOCKED_PORTAL_STRENGTH));
    ctx.restore();
  }

  drawBudGlow(ctx, { x, y, radius, color, phase }, now) {
    const pulse = 0.8 + 0.2 * Math.sin(now * BUD_GLOW.pulseSpeed + phase);
    drawGlow(ctx, color, x, y, radius * BUD_GLOW.sizeFactor * pulse, BUD_GLOW.alpha * pulse);
  }

  drawCheckpointGlow(ctx, checkpoint, now) {
    const { x, y } = checkpoint.getBloomCenter();
    const pulse = 0.85 + 0.15 * Math.sin(now * CHECKPOINT_GLOW.pulseSpeed);
    drawGlow(ctx, CHECKPOINT_GLOW.color, x, y, CHECKPOINT_GLOW.size * pulse, CHECKPOINT_GLOW.alpha * pulse);
  }

  drawObjectGlow(ctx, object, { color, sizeFactor, alpha }, now, strength = 1) {
    const centerX = object.x + object.width / 2;
    const centerY = object.y + object.height / 2;
    const pulse = 0.85 + 0.15 * Math.sin(now / 350 + centerX * 0.01);
    drawGlow(ctx, color, centerX, centerY, Math.max(object.width, object.height) * sizeFactor * pulse, alpha * strength * pulse);
  }
}

function getBuds(level) {
  const cacheKey = level.layers[0]?.image;
  if (!cacheKey) return Promise.resolve([]);
  if (!budCache.has(cacheKey)) budCache.set(cacheKey, findBuds(level));
  return budCache.get(cacheKey);
}

async function findBuds(level) {
  try {
    const width = Math.ceil(level.width * DETECTION_SCALE);
    const height = Math.ceil(level.height * DETECTION_SCALE);
    const resizeOptions = { resizeWidth: width, resizeHeight: height, resizeQuality: "pixelated" };
    const bitmaps = await Promise.all(level.layers.map(({ image }) => createImageBitmap(image, resizeOptions)));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.imageSmoothingEnabled = false;
    bitmaps.forEach((bitmap) => {
      ctx.drawImage(bitmap, 0, 0, width, height);
      bitmap.close();
    });
    return findBrightBlobs(ctx.getImageData(0, 0, width, height));
  } catch (error) {
    console.error("Glowing plants could not be detected.", error);
    return [];
  }
}

function findBrightBlobs({ data, width, height }) {
  const isBright = new Uint8Array(width * height);
  for (let i = 0; i < isBright.length; i++) {
    const offset = i * 4;
    const luminance = 0.3 * data[offset] + 0.59 * data[offset + 1] + 0.11 * data[offset + 2];
    isBright[i] = data[offset + 3] > 200 && luminance > BUD_MIN_LUMINANCE ? 1 : 0;
  }
  const buds = [];
  for (let start = 0; start < isBright.length; start++) {
    if (isBright[start] !== 1) continue;
    const pixels = collectBlob(isBright, start, width);
    if (pixels.length >= BUD_MIN_PIXELS * DETECTION_SCALE ** 2) buds.push(describeBlob(pixels, data, width));
  }
  return buds;
}

function collectBlob(isBright, start, width) {
  const pixels = [start];
  isBright[start] = 2;
  for (let k = 0; k < pixels.length; k++) {
    const index = pixels[k];
    const column = index % width;
    const neighbours = [index - width, index + width, column > 0 ? index - 1 : -1, column < width - 1 ? index + 1 : -1];
    neighbours.forEach((next) => {
      if (next >= 0 && isBright[next] === 1) {
        isBright[next] = 2;
        pixels.push(next);
      }
    });
  }
  return pixels;
}

function describeBlob(pixels, data, width) {
  let sumX = 0, sumY = 0, sumR = 0, sumG = 0, sumB = 0;
  pixels.forEach((index) => {
    sumX += index % width;
    sumY += Math.floor(index / width);
    sumR += data[index * 4];
    sumG += data[index * 4 + 1];
    sumB += data[index * 4 + 2];
  });
  const count = pixels.length;
  const color = [sumR, sumG, sumB].map((sum) => Math.round(sum / count)).join(", ");
  const radius = Math.sqrt(count / Math.PI);
  return { x: sumX / count / DETECTION_SCALE, y: sumY / count / DETECTION_SCALE, radius: radius / DETECTION_SCALE, color, phase: Math.random() * Math.PI * 2 };
}
