import { gameLoop } from "./game-loop.class.js";
import { drawGlow } from "../glow-sprite.js";
import { TILE_SIZE } from "./level.class.js";

const AREA_PER_FIREFLY = 75000;
const FRONT_SHARE = 0.25;
const SPAWN_HEIGHT = [30, 260];
const MAX_SPAWN_TRIES = 40;
const HALO_SIZE = 64;
const CORE_SIZE = 12;
const VIEW_MARGIN = 60;
const DRIFT = { amplitude: [40, 110], speed: [0.00015, 0.0004] };
const FLUTTER = { amplitude: [4, 12], speed: [0.001, 0.002] };
const FLASH = { attack: [180, 300], hold: [80, 160], release: [500, 900], pause: [1200, 3800], doubleChance: 0.3, doubleDelay: [220, 320] };

export class Fireflies {
  fireflies = [];
  colors = null;

  populate(level, theme) {
    this.colors = theme.fireflies;
    this.fireflies = [];
    const count = Math.round((level.width * level.height) / AREA_PER_FIREFLY);
    for (let i = 0; i < count; i++) {
      const home = this.findHome(level.collisionGrid);
      if (home) this.fireflies.push(this.createFirefly(home));
    }
  }

  findHome(grid) {
    if (!grid?.length) return null;
    for (let attempt = 0; attempt < MAX_SPAWN_TRIES; attempt++) {
      const column = Math.floor(Math.random() * grid[0].length);
      const surfaceRows = this.getSurfaceRows(grid, column);
      if (!surfaceRows.length) continue;
      const surfaceRow = surfaceRows[Math.floor(Math.random() * surfaceRows.length)];
      const home = { x: (column + 0.5) * TILE_SIZE, y: surfaceRow * TILE_SIZE - this.randomBetween(SPAWN_HEIGHT) };
      if (this.isAir(grid, home)) return home;
    }
    return null;
  }

  getSurfaceRows(grid, column) {
    const rows = [];
    for (let row = 1; row < grid.length; row++) {
      if (grid[row - 1][column] === 0 && grid[row][column] !== 0) rows.push(row);
    }
    return rows;
  }

  isAir(grid, { x, y }) {
    return grid[Math.floor(y / TILE_SIZE)]?.[Math.floor(x / TILE_SIZE)] === 0;
  }

  createFirefly(home) {
    const isInFront = Math.random() < FRONT_SHARE;
    return {
      home,
      isInFront,
      scale: isInFront ? this.randomBetween([1.2, 1.5]) : this.randomBetween([0.7, 1]),
      waves: { x: [this.createWave(DRIFT), this.createWave(FLUTTER)], y: [this.createWave(DRIFT, 0.5), this.createWave(FLUTTER)] },
      flash: this.createFlash(gameLoop.now() + Math.random() * FLASH.pause[1]),
    };
  }

  createWave({ amplitude, speed }, amplitudeScale = 1) {
    return { amplitude: this.randomBetween(amplitude) * amplitudeScale, speed: this.randomBetween(speed), phase: Math.random() * Math.PI * 2 };
  }

  createFlash(startAt) {
    return {
      startAt,
      attack: this.randomBetween(FLASH.attack),
      hold: this.randomBetween(FLASH.hold),
      release: this.randomBetween(FLASH.release),
      repeatDelay: this.randomBetween(FLASH.doubleDelay),
      isDouble: Math.random() < FLASH.doubleChance,
    };
  }

  randomBetween([min, max]) {
    return min + Math.random() * (max - min);
  }

  drawBehind(ctx, view) {
    this.draw(ctx, view, false);
  }

  drawFront(ctx, view) {
    this.draw(ctx, view, true);
  }

  draw(ctx, view, isInFront) {
    const now = gameLoop.now();
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.imageSmoothingEnabled = true;
    this.fireflies.forEach((firefly) => {
      if (firefly.isInFront === isInFront) this.drawFirefly(ctx, firefly, view, now);
    });
    ctx.restore();
  }

  drawFirefly(ctx, firefly, view, now) {
    const brightness = this.getBrightness(firefly, now);
    if (brightness <= 0.01) return;
    const x = firefly.home.x + this.sumWaves(firefly.waves.x, now);
    const y = firefly.home.y + this.sumWaves(firefly.waves.y, now);
    if (!this.isInView(x, y, view)) return;
    const haloSize = HALO_SIZE * firefly.scale * (0.6 + 0.4 * brightness);
    drawGlow(ctx, this.colors.haloColor, x, y, haloSize, brightness * 0.9);
    drawGlow(ctx, this.colors.coreColor, x, y, CORE_SIZE * firefly.scale, brightness);
  }

  sumWaves(waves, now) {
    return waves.reduce((sum, { amplitude, speed, phase }) => sum + amplitude * Math.sin(now * speed + phase), 0);
  }

  isInView(x, y, view) {
    return x > view.left - VIEW_MARGIN && x < view.left + view.width + VIEW_MARGIN && y > view.top - VIEW_MARGIN && y < view.top + view.height + VIEW_MARGIN;
  }

  getBrightness(firefly, now) {
    const flash = firefly.flash;
    const repeatOffset = flash.attack + flash.hold + flash.repeatDelay;
    const flashEnd = flash.startAt + flash.attack + flash.hold + flash.release + (flash.isDouble ? repeatOffset : 0);
    if (now > flashEnd) {
      firefly.flash = this.createFlash(flashEnd + this.randomBetween(FLASH.pause));
      return 0;
    }
    const first = this.getPulse(flash, now - flash.startAt);
    const second = flash.isDouble ? this.getPulse(flash, now - flash.startAt - repeatOffset) * 0.8 : 0;
    return Math.max(first, second);
  }

  getPulse({ attack, hold, release }, elapsed) {
    if (elapsed < 0) return 0;
    if (elapsed < attack) return (elapsed / attack) ** 2;
    if (elapsed < attack + hold) return 1;
    if (elapsed < attack + hold + release) return (1 - (elapsed - attack - hold) / release) ** 2;
    return 0;
  }
}
