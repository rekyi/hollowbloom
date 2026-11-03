import { gameLoop } from "./game-loop.class.js";
import { drawGlow } from "../glow-sprite.js";

const CENTER_X = 640;
const BAR_WIDTH = 620;
const BAR_HEIGHT = 10;
const BAR_X = CENTER_X - BAR_WIDTH / 2;
const BAR_Y = 40;
const BAR_MIDDLE_Y = BAR_Y + BAR_HEIGHT / 2;
const BAR_TIP = 18;
const BAR_SHARE_PER_SECOND = 1;
const TRAIL_SHARE_PER_SECOND = 0.6;
const TRAIL_DELAY_MS = 450;
const HIT_FLASH_MS = 220;
const DEATH_FADE_DELAY_MS = 1100;
const DEATH_FADE_MS = 600;
const EMBERS_PER_SECOND = { normal: 5, rage: 16 };
const EMBER_LIFE_SECONDS = 1.2;
const EMBER_RISE_SPEED = 25;
const HEAD_GLOW_SIZE = 44;
const HEAD_CORE_SIZE = 14;
const HEAD_CORE_COLOR = "255, 255, 240";
const TRAIL_COLOR = "246, 231, 176";
const bossNameRef = document.getElementById("boss-name");
const COLORS = {
  normal: { dark: "36, 104, 58", light: "155, 227, 155", glow: "143, 240, 160" },
  rage: { dark: "143, 31, 20", light: "255, 179, 107", glow: "255, 122, 61" },
};

export class BossHealthBar {
  boss = null;
  shownHp = 0;
  trailHp = 0;
  diedAt = null;
  embers = [];

  update(boss, dt) {
    if (boss !== this.boss) this.reset(boss);
    if (!boss) return;
    if (boss.isDead()) this.diedAt ??= gameLoop.now();
    const fullBarStep = boss.maxHp * dt;
    this.shownHp = moveToward(this.shownHp, Math.max(0, boss.hp), fullBarStep * BAR_SHARE_PER_SECOND);
    const isTrailWaiting = gameLoop.now() - boss.lastHit < TRAIL_DELAY_MS;
    if (!isTrailWaiting) this.trailHp = moveToward(this.trailHp, this.shownHp, fullBarStep * TRAIL_SHARE_PER_SECOND);
    this.trailHp = Math.max(this.trailHp, this.shownHp);
    this.updateEmbers(dt);
  }

  reset(boss) {
    this.boss = boss;
    this.shownHp = 0;
    this.trailHp = 0;
    this.diedAt = null;
    this.embers = [];
  }

  updateEmbers(dt) {
    this.embers.forEach((ember) => {
      ember.x += ember.drift * dt;
      ember.y -= EMBER_RISE_SPEED * dt;
      ember.life -= dt;
    });
    this.embers = this.embers.filter((ember) => ember.life > 0);
    const emberChance = (this.boss.isRage ? EMBERS_PER_SECOND.rage : EMBERS_PER_SECOND.normal) * dt;
    if (this.shownHp > 0 && Math.random() < emberChance) this.spawnEmber();
  }

  spawnEmber() {
    this.embers.push({
      x: BAR_X + Math.random() * this.getWidth(this.shownHp),
      y: BAR_MIDDLE_Y,
      drift: (Math.random() - 0.5) * 15,
      size: 5 + Math.random() * 5,
      life: EMBER_LIFE_SECONDS,
    });
  }

  getWidth(hp) {
    return BAR_WIDTH * clamp01(hp / this.boss.maxHp);
  }

  getAlpha() {
    if (!this.boss || gameLoop.isStarting || gameLoop.isIntroPlaying) return 0;
    if (this.diedAt === null) return 1;
    return clamp01(1 - (gameLoop.now() - this.diedAt - DEATH_FADE_DELAY_MS) / DEATH_FADE_MS);
  }

  draw(ctx) {
    const alpha = this.getAlpha();
    bossNameRef.style.opacity = alpha;
    if (alpha <= 0) return;
    const colors = this.boss.isRage ? COLORS.rage : COLORS.normal;
    const fillWidth = this.getWidth(this.shownHp);
    ctx.save();
    ctx.globalAlpha = alpha;
    this.drawBar(ctx, colors, fillWidth);
    ctx.globalCompositeOperation = "lighter";
    ctx.imageSmoothingEnabled = true;
    if (fillWidth > 0) this.drawHead(ctx, colors, BAR_X + fillWidth, alpha);
    this.embers.forEach((ember) => drawGlow(ctx, colors.glow, ember.x, ember.y, ember.size, alpha * (ember.life / EMBER_LIFE_SECONDS)));
    ctx.restore();
  }

  drawBar(ctx, colors, fillWidth) {
    ctx.save();
    this.traceBar(ctx);
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fill();
    ctx.clip();
    ctx.fillStyle = `rgb(${TRAIL_COLOR})`;
    ctx.fillRect(BAR_X, BAR_Y, this.getWidth(this.trailHp), BAR_HEIGHT);
    ctx.fillStyle = this.createFillGradient(ctx, colors);
    ctx.fillRect(BAR_X, BAR_Y, fillWidth, BAR_HEIGHT);
    ctx.fillStyle = `rgba(255, 255, 255, ${0.65 * this.getHitFlash()})`;
    ctx.fillRect(BAR_X, BAR_Y, fillWidth, BAR_HEIGHT);
    ctx.restore();
    this.traceBar(ctx);
    ctx.strokeStyle = "rgba(255, 225, 190, 0.28)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  traceBar(ctx) {
    ctx.beginPath();
    ctx.moveTo(BAR_X, BAR_MIDDLE_Y);
    ctx.lineTo(BAR_X + BAR_TIP, BAR_Y);
    ctx.lineTo(BAR_X + BAR_WIDTH - BAR_TIP, BAR_Y);
    ctx.lineTo(BAR_X + BAR_WIDTH, BAR_MIDDLE_Y);
    ctx.lineTo(BAR_X + BAR_WIDTH - BAR_TIP, BAR_Y + BAR_HEIGHT);
    ctx.lineTo(BAR_X + BAR_TIP, BAR_Y + BAR_HEIGHT);
    ctx.closePath();
  }

  createFillGradient(ctx, colors) {
    const gradient = ctx.createLinearGradient(BAR_X, 0, BAR_X + BAR_WIDTH, 0);
    gradient.addColorStop(0, `rgb(${colors.dark})`);
    gradient.addColorStop(1, `rgb(${colors.light})`);
    return gradient;
  }

  getHitFlash() {
    return clamp01(1 - (gameLoop.now() - this.boss.lastHit) / HIT_FLASH_MS);
  }

  drawHead(ctx, colors, x, alpha) {
    const pulse = 0.75 + 0.25 * Math.sin(gameLoop.now() / 180);
    drawGlow(ctx, colors.glow, x, BAR_MIDDLE_Y, HEAD_GLOW_SIZE * pulse, alpha);
    drawGlow(ctx, HEAD_CORE_COLOR, x, BAR_MIDDLE_Y, HEAD_CORE_SIZE * pulse, alpha);
  }
}

function moveToward(current, target, maxStep) {
  return current < target ? Math.min(target, current + maxStep) : Math.max(target, current - maxStep);
}

function clamp01(value) {
  return Math.min(Math.max(value, 0), 1);
}
