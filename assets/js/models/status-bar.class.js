import { EXTRA_ATTACK_COIN_COST } from "../data.js";
import { DrawableObject } from "./drawable-object.class.js";

const COIN_FRAME_SIZE = 16;
const COIN_ICON_SIZE = 32;
const COIN_ICON_X = 168;
const COIN_COUNT_X = 206;
const SPECIAL_BADGE_X = 252;
const SPECIAL_BADGE_SIZE = 40;
const COIN_PULSE_MS = 220;
const SPECIAL_DENIED_MS = 350;
const DENIED_COLOR = "#ff6b6b";
const SPECIAL_COLORS = { female: "#8fe3ff", male: "#ffe27a" };
const LIGHTNING_POINTS = [
  [-2, -13],
  [7, -13],
  [2, -3],
  [8, -3],
  [-5, 13],
  [-1, 1],
  [-7, 1],
];

export class StatusBar extends DrawableObject {
  IMAGES = {
    BACKGROUND: "assets/images/7_statusbars/health_bar/background.webp",
    HEART: "assets/images/7_statusbars/health_bar/heart.webp",
    BORDER: "assets/images/7_statusbars/health_bar/border.webp",
    COIN: "assets/images/8_items/item_charge.webp",
  };
  maxHearts = 3;
  hearts = 3;
  coins = 0;
  heartSize = 40;
  heartGap = 5;
  specialType = "female";
  coinPulseStartedAt = Number.NEGATIVE_INFINITY;
  specialDeniedStartedAt = Number.NEGATIVE_INFINITY;

  constructor() {
    super();
    this.x = 15;
    this.y = 35;
    this.loadImages(Object.values(this.IMAGES));
  }

  setHearts(hearts) {
    this.hearts = Math.max(0, Math.min(this.maxHearts, hearts));
  }

  setCoins(coins) {
    this.coins = coins;
  }

  setSpecialType(specialType) {
    this.specialType = specialType;
  }

  showCoinPickup() {
    this.coinPulseStartedAt = performance.now();
  }

  showSpecialDenied() {
    this.specialDeniedStartedAt = performance.now();
  }

  isSpecialDenied() {
    return performance.now() - this.specialDeniedStartedAt < SPECIAL_DENIED_MS;
  }

  draw(ctx) {
    this.drawHearts(ctx);
    this.drawCoinIcon(ctx);
    this.drawCoinCount(ctx);
    this.drawSpecialBadge(ctx);
  }

  drawHearts(ctx) {
    for (let i = 0; i < this.maxHearts; i++) {
      const x = this.x + i * (this.heartSize + this.heartGap);
      this.drawLayer(ctx, this.IMAGES.BACKGROUND, x);
      if (i < this.hearts) this.drawLayer(ctx, this.IMAGES.HEART, x);
      this.drawLayer(ctx, this.IMAGES.BORDER, x);
    }
  }

  drawCoinIcon(ctx) {
    const img = this.imageCache[this.IMAGES.COIN];
    if (!img || !img.complete || img.naturalWidth === 0) return;
    const y = this.y + (this.heartSize - COIN_ICON_SIZE) / 2;
    ctx.drawImage(img, 0, 0, COIN_FRAME_SIZE, COIN_FRAME_SIZE, COIN_ICON_X, y, COIN_ICON_SIZE, COIN_ICON_SIZE);
  }

  drawCoinCount(ctx) {
    const scale = 1 + 0.35 * this.getCoinPulse();
    ctx.save();
    ctx.translate(COIN_COUNT_X, this.y + this.heartSize / 2);
    ctx.scale(scale, scale);
    ctx.fillStyle = this.isSpecialDenied() ? DENIED_COLOR : "white";
    ctx.strokeStyle = "black";
    ctx.lineWidth = 4;
    ctx.lineJoin = "round";
    ctx.font = "bold 24px monospace";
    ctx.textBaseline = "middle";
    ctx.strokeText(String(this.coins), 0, 0);
    ctx.fillText(String(this.coins), 0, 0);
    ctx.restore();
  }

  getCoinPulse() {
    const progress = (performance.now() - this.coinPulseStartedAt) / COIN_PULSE_MS;
    return progress >= 0 && progress < 1 ? 1 - progress : 0;
  }

  drawSpecialBadge(ctx) {
    const isDenied = this.isSpecialDenied();
    const charge = Math.min(this.coins / EXTRA_ATTACK_COIN_COST, 1);
    const isReady = charge >= 1;
    const color = SPECIAL_COLORS[this.specialType] ?? SPECIAL_COLORS.female;
    const x = SPECIAL_BADGE_X + (isDenied ? this.getDeniedShake() : 0);
    ctx.save();
    this.traceBadge(ctx, x);
    ctx.fillStyle = "rgba(10, 20, 24, 0.85)";
    ctx.fill();
    this.drawBadgeCharge(ctx, x, charge, color);
    this.traceBadge(ctx, x);
    ctx.lineWidth = 2;
    ctx.strokeStyle = this.getBadgeBorderColor(isDenied, isReady, color);
    if (isReady && !isDenied) {
      ctx.shadowColor = color;
      ctx.shadowBlur = 10;
    }
    ctx.stroke();
    ctx.restore();
    this.drawSpecialIcon(ctx, x + SPECIAL_BADGE_SIZE / 2, this.y + SPECIAL_BADGE_SIZE / 2, isReady);
  }

  getBadgeBorderColor(isDenied, isReady, color) {
    if (isDenied) return DENIED_COLOR;
    return isReady ? color : "rgba(255, 255, 255, 0.35)";
  }

  traceBadge(ctx, x) {
    ctx.beginPath();
    ctx.roundRect(x, this.y, SPECIAL_BADGE_SIZE, SPECIAL_BADGE_SIZE, 8);
  }

  drawBadgeCharge(ctx, x, charge, color) {
    if (charge <= 0) return;
    const height = SPECIAL_BADGE_SIZE * charge;
    ctx.save();
    this.traceBadge(ctx, x);
    ctx.clip();
    ctx.globalAlpha = charge >= 1 ? 0.35 : 0.25;
    ctx.fillStyle = color;
    ctx.fillRect(x, this.y + SPECIAL_BADGE_SIZE - height, SPECIAL_BADGE_SIZE, height);
    ctx.restore();
  }

  getDeniedShake() {
    const elapsedMs = performance.now() - this.specialDeniedStartedAt;
    return Math.round(Math.sin(elapsedMs / 35) * 2.5);
  }

  drawSpecialIcon(ctx, centerX, centerY, isReady) {
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.globalAlpha = isReady ? 1 : 0.45;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    if (this.specialType === "male") this.drawLightning(ctx);
    else this.drawSnowflake(ctx);
    ctx.restore();
  }

  drawLightning(ctx) {
    const path = new Path2D();
    LIGHTNING_POINTS.forEach(([x, y], index) => (index === 0 ? path.moveTo(x, y) : path.lineTo(x, y)));
    path.closePath();
    ctx.lineWidth = 4;
    ctx.strokeStyle = "black";
    ctx.stroke(path);
    ctx.fillStyle = "white";
    ctx.fill(path);
  }

  drawSnowflake(ctx) {
    const path = new Path2D();
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      this.addRay(path, angle, 0, 12);
      this.addBranches(path, angle, 7, 4);
    }
    ctx.lineWidth = 5;
    ctx.strokeStyle = "black";
    ctx.stroke(path);
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = "white";
    ctx.stroke(path);
  }

  addRay(path, angle, fromDistance, toDistance) {
    path.moveTo(Math.cos(angle) * fromDistance, Math.sin(angle) * fromDistance);
    path.lineTo(Math.cos(angle) * toDistance, Math.sin(angle) * toDistance);
  }

  addBranches(path, angle, distance, length) {
    const startX = Math.cos(angle) * distance;
    const startY = Math.sin(angle) * distance;
    [-1, 1].forEach((side) => {
      const branchAngle = angle + (side * Math.PI) / 4;
      path.moveTo(startX, startY);
      path.lineTo(startX + Math.cos(branchAngle) * length, startY + Math.sin(branchAngle) * length);
    });
  }

  drawLayer(ctx, path, x) {
    const img = this.imageCache[path];
    if (img && img.complete && img.naturalWidth > 0) {
      ctx.drawImage(img, x, this.y, this.heartSize, this.heartSize);
    }
  }
}
