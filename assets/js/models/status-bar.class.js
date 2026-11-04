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

/** HUD showing hearts, coin count and the special attack charge badge. */
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

  /** Positions the HUD and loads its images. */
  constructor() {
    super();
    this.x = 15;
    this.y = 35;
    this.loadImages(Object.values(this.IMAGES));
  }

  /**
   * Sets the number of filled hearts.
   * @param {number} hearts - Hearts to show, clamped to 0..maxHearts.
   */
  setHearts(hearts) {
    this.hearts = Math.max(0, Math.min(this.maxHearts, hearts));
  }

  /**
   * Sets the coin count.
   * @param {number} coins - Coins to show.
   */
  setCoins(coins) {
    this.coins = coins;
  }

  /**
   * Sets which special attack icon and color to show.
   * @param {string} specialType - "female" or "male".
   */
  setSpecialType(specialType) {
    this.specialType = specialType;
  }

  /** Starts the coin count pulse. */
  showCoinPickup() {
    this.coinPulseStartedAt = performance.now();
  }

  /** Starts the denied feedback for a special attack without enough coins. */
  showSpecialDenied() {
    this.specialDeniedStartedAt = performance.now();
  }

  /**
   * Checks whether the denied feedback is active.
   * @returns {boolean} True shortly after a denied special attack.
   */
  isSpecialDenied() {
    return performance.now() - this.specialDeniedStartedAt < SPECIAL_DENIED_MS;
  }

  /**
   * Draws hearts, coin icon, coin count and special badge.
   * @param {CanvasRenderingContext2D} ctx - Target canvas context.
   */
  draw(ctx) {
    this.drawHearts(ctx);
    this.drawCoinIcon(ctx);
    this.drawCoinCount(ctx);
    this.drawSpecialBadge(ctx);
  }

  /**
   * Draws all heart slots, filled up to the current hearts.
   * @param {CanvasRenderingContext2D} ctx - Target canvas context.
   */
  drawHearts(ctx) {
    for (let i = 0; i < this.maxHearts; i++) {
      const x = this.x + i * (this.heartSize + this.heartGap);
      this.drawLayer(ctx, this.IMAGES.BACKGROUND, x);
      if (i < this.hearts) this.drawLayer(ctx, this.IMAGES.HEART, x);
      this.drawLayer(ctx, this.IMAGES.BORDER, x);
    }
  }

  /**
   * Draws the first coin frame as icon.
   * @param {CanvasRenderingContext2D} ctx - Target canvas context.
   */
  drawCoinIcon(ctx) {
    const img = this.imageCache[this.IMAGES.COIN];
    if (!img || !img.complete || img.naturalWidth === 0) return;
    const y = this.y + (this.heartSize - COIN_ICON_SIZE) / 2;
    ctx.drawImage(img, 0, 0, COIN_FRAME_SIZE, COIN_FRAME_SIZE, COIN_ICON_X, y, COIN_ICON_SIZE, COIN_ICON_SIZE);
  }

  /**
   * Draws the outlined coin count with pulse and denied color.
   * @param {CanvasRenderingContext2D} ctx - Target canvas context.
   */
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

  /**
   * Gets the fading strength of the coin pulse.
   * @returns {number} Value from 1 (just picked up) to 0.
   */
  getCoinPulse() {
    const progress = (performance.now() - this.coinPulseStartedAt) / COIN_PULSE_MS;
    return progress >= 0 && progress < 1 ? 1 - progress : 0;
  }

  /**
   * Draws the special attack badge with charge fill, border, glow and icon.
   * @param {CanvasRenderingContext2D} ctx - Target canvas context.
   */
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

  /**
   * Picks the badge border color.
   * @param {boolean} isDenied - Whether the denied feedback is active.
   * @param {boolean} isReady - Whether the special attack is charged.
   * @param {string} color - Special attack color.
   * @returns {string} CSS color.
   */
  getBadgeBorderColor(isDenied, isReady, color) {
    if (isDenied) return DENIED_COLOR;
    return isReady ? color : "rgba(255, 255, 255, 0.35)";
  }

  /**
   * Traces the rounded badge path.
   * @param {CanvasRenderingContext2D} ctx - Target canvas context.
   * @param {number} x - Badge x position.
   */
  traceBadge(ctx, x) {
    ctx.beginPath();
    ctx.roundRect(x, this.y, SPECIAL_BADGE_SIZE, SPECIAL_BADGE_SIZE, 8);
  }

  /**
   * Fills the badge from the bottom according to the charge.
   * @param {CanvasRenderingContext2D} ctx - Target canvas context.
   * @param {number} x - Badge x position.
   * @param {number} charge - Charge between 0 and 1.
   * @param {string} color - Fill color.
   */
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

  /**
   * Gets the horizontal shake offset of the denied feedback.
   * @returns {number} Offset in pixels.
   */
  getDeniedShake() {
    const elapsedMs = performance.now() - this.specialDeniedStartedAt;
    return Math.round(Math.sin(elapsedMs / 35) * 2.5);
  }

  /**
   * Draws the lightning or snowflake icon, dimmed if not ready.
   * @param {CanvasRenderingContext2D} ctx - Target canvas context.
   * @param {number} centerX - Icon center x.
   * @param {number} centerY - Icon center y.
   * @param {boolean} isReady - Whether the special attack is charged.
   */
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

  /**
   * Draws an outlined lightning bolt at the origin.
   * @param {CanvasRenderingContext2D} ctx - Target canvas context.
   */
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

  /**
   * Draws an outlined six-ray snowflake at the origin.
   * @param {CanvasRenderingContext2D} ctx - Target canvas context.
   */
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

  /**
   * Adds a straight ray from the origin direction to a path.
   * @param {Path2D} path - Target path.
   * @param {number} angle - Ray angle in radians.
   * @param {number} fromDistance - Start distance from the origin.
   * @param {number} toDistance - End distance from the origin.
   */
  addRay(path, angle, fromDistance, toDistance) {
    path.moveTo(Math.cos(angle) * fromDistance, Math.sin(angle) * fromDistance);
    path.lineTo(Math.cos(angle) * toDistance, Math.sin(angle) * toDistance);
  }

  /**
   * Adds two angled branches to a snowflake ray.
   * @param {Path2D} path - Target path.
   * @param {number} angle - Ray angle in radians.
   * @param {number} distance - Branch start distance from the origin.
   * @param {number} length - Branch length.
   */
  addBranches(path, angle, distance, length) {
    const startX = Math.cos(angle) * distance;
    const startY = Math.sin(angle) * distance;
    [-1, 1].forEach((side) => {
      const branchAngle = angle + (side * Math.PI) / 4;
      path.moveTo(startX, startY);
      path.lineTo(startX + Math.cos(branchAngle) * length, startY + Math.sin(branchAngle) * length);
    });
  }

  /**
   * Draws one heart layer image if loaded.
   * @param {CanvasRenderingContext2D} ctx - Target canvas context.
   * @param {string} path - Image path.
   * @param {number} x - Heart x position.
   */
  drawLayer(ctx, path, x) {
    const img = this.imageCache[path];
    if (img && img.complete && img.naturalWidth > 0) {
      ctx.drawImage(img, x, this.y, this.heartSize, this.heartSize);
    }
  }
}
