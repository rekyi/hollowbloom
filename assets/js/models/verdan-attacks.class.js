import { gameLoop } from "./game-loop.class.js";
import { BossEffect } from "./boss-effect.class.js";
import { VerdanBase } from "./verdan-base.class.js";
import { VERDAN_SETTINGS } from "../data.js";

export class VerdanAttacks extends VerdanBase {
  currentAttack = null;
  pendingCombo = null;
  spikeRow = null;

  startRootsAttack() {
    this.startAttack("attackRoots", (settings) => this.startSpikeRow(settings));
  }

  startBowAttack() {
    this.startAttack("attackBow", (settings) => this.spawnArrowVolley(settings));
  }

  startPulseAttack() {
    this.startAttack("attackPulse", ({ spawn }) => this.spawnEffect("fxPulseBurst", { spawn }));
  }

  startAttack(key, onAction) {
    this.currentAttack = { key, onAction, isActionTriggered: false };
    this.startAnimation("attack");
  }

  playAttack() {
    const phaseKey = this.getPhaseKey(this.currentAttack.key);
    const settings = VERDAN_SETTINGS[phaseKey];
    const frame = this.getElapsedFrame(settings.frameDuration);
    if (frame >= settings.frames) return this.finishAttack();
    this.setFrame(this.attackFrames[phaseKey], frame);
    this.playSoundsAtFrame(settings.sounds, frame);
    if (frame >= settings.actionFrame) this.triggerAttackAction(settings);
  }

  triggerAttackAction(settings) {
    if (this.currentAttack.isActionTriggered) return;
    this.currentAttack.isActionTriggered = true;
    this.currentAttack.onAction(settings);
  }

  spawnArrowVolley({ spawn, arrows }) {
    const { speedX, speedsY, gravity } = arrows;
    const effectKey = this.getPhaseKey("fxSeedArrow");
    const impactKey = this.getPhaseKey("fxSeedImpact");
    const onGroundHit = (placement) => this.spawnEffect(impactKey, placement);
    speedsY.forEach((speedY) => this.spawnEffect(effectKey, { spawn, speedX, speedY, gravity, isLooping: true, isRotating: true, isDestroyedOnGround: true, onGroundHit }));
  }

  startSpikeRow({ spawn, spikes }) {
    const targetOffsetX = this.getTargetOffsetX();
    const isTargetInFront = (targetOffsetX < 0) === this.isOppositeDirection;
    const firstSpike = { x: isTargetInFront ? Math.min(spawn.x, Math.abs(targetOffsetX)) : spawn.x, y: spawn.y };
    this.spikeRow = { spawn: firstSpike, spikes, spawnedCount: 0, startedAt: gameLoop.now(), origin: this.getFootPoint(), isLeft: this.isOppositeDirection, effectKey: this.getPhaseKey("fxRootSpike") };
  }

  updateSpikeRow() {
    if (!this.spikeRow) return;
    const { spikes, startedAt, spawnedCount } = this.spikeRow;
    const dueCount = Math.floor((gameLoop.now() - startedAt) / spikes.interval) + 1;
    if (spawnedCount < dueCount) this.spawnRowSpike();
    if (this.spikeRow.spawnedCount >= spikes.count) this.spikeRow = null;
  }

  spawnRowSpike() {
    const { spawn, spikes, spawnedCount, origin, isLeft, effectKey } = this.spikeRow;
    const spikeSpawn = { x: spawn.x + spawnedCount * spikes.spacing, y: spawn.y };
    this.spawnEffect(effectKey, { origin, spawn: spikeSpawn, isLeft });
    this.spikeRow.spawnedCount++;
  }

  spawnEffect(key, { origin = this.getFootPoint(), spawn = { x: 0, y: 0 }, isLeft = this.isOppositeDirection, speedX = 0, ...motion } = {}) {
    const pivotX = origin.x + (isLeft ? -spawn.x : spawn.x);
    const pivotY = origin.y + spawn.y;
    const effect = new BossEffect(VERDAN_SETTINGS[key], this.effectFrames[key], this.imageCache, { ...motion, pivotX, pivotY, isLeft, speedX: isLeft ? -speedX : speedX });
    this.world.level.bossEffects.push(effect);
  }

  cancelAttacks() {
    this.spikeRow = null;
    this.pendingCombo = null;
    this.world?.clearBossEffects();
  }
}
