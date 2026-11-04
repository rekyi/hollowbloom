import { gameLoop } from "./game-loop.class.js";
import { BossEffect } from "./boss-effect.class.js";
import { VerdanBase } from "./verdan-base.class.js";
import { VERDAN_SETTINGS } from "../data.js";

/** Verdan boss attacks: root spikes, arrow volleys and pulse burst. */
export class VerdanAttacks extends VerdanBase {
  currentAttack = null;
  pendingCombo = null;
  spikeRow = null;

  /** Starts the roots attack that spawns a row of spikes. */
  startRootsAttack() {
    this.startAttack("attackRoots", (settings) => this.startSpikeRow(settings));
  }

  /** Starts the bow attack that shoots an arrow volley. */
  startBowAttack() {
    this.startAttack("attackBow", (settings) => this.spawnArrowVolley(settings));
  }

  /** Starts the pulse attack that spawns an expanding ring. */
  startPulseAttack() {
    this.startAttack("attackPulse", ({ spawn }) => this.spawnEffect("fxPulseBurst", { spawn }));
  }

  /**
   * Starts an attack animation.
   * @param {string} key - Attack settings key.
   * @param {Function} onAction - Called with the attack settings at the action frame.
   */
  startAttack(key, onAction) {
    this.currentAttack = { key, onAction, isActionTriggered: false };
    this.startAnimation("attack");
  }

  /** Plays the current attack, its sounds and triggers its action at the action frame. */
  playAttack() {
    const phaseKey = this.getPhaseKey(this.currentAttack.key);
    const settings = VERDAN_SETTINGS[phaseKey];
    const frame = this.getElapsedFrame(settings.frameDuration);
    if (frame >= settings.frames) return this.finishAttack();
    this.setFrame(this.attackFrames[phaseKey], frame);
    this.playSoundsAtFrame(settings.sounds, frame);
    if (frame >= settings.actionFrame) this.triggerAttackAction(settings);
  }

  /**
   * Runs the attack action once.
   * @param {Object} settings - Phase settings of the attack.
   */
  triggerAttackAction(settings) {
    if (this.currentAttack.isActionTriggered) return;
    this.currentAttack.isActionTriggered = true;
    this.currentAttack.onAction(settings);
  }

  /**
   * Spawns one seed arrow per vertical speed; each spawns an impact on the ground.
   * @param {{spawn: {x: number, y: number}, arrows: {speedX: number, speedsY: number[], gravity: number}}} settings - Bow attack settings.
   */
  spawnArrowVolley({ spawn, arrows }) {
    const { speedX, speedsY, gravity } = arrows;
    const effectKey = this.getPhaseKey("fxSeedArrow");
    const impactKey = this.getPhaseKey("fxSeedImpact");
    const onGroundHit = (placement) => this.spawnEffect(impactKey, placement);
    speedsY.forEach((speedY) => this.spawnEffect(effectKey, { spawn, speedX, speedY, gravity, isLooping: true, isRotating: true, isDestroyedOnGround: true, onGroundHit }));
  }

  /**
   * Prepares a spike row, starting at the target if it stands close in front.
   * @param {{spawn: {x: number, y: number}, spikes: {count: number, spacing: number, interval: number}}} settings - Roots attack settings.
   */
  startSpikeRow({ spawn, spikes }) {
    const targetOffsetX = this.getTargetOffsetX();
    const isTargetInFront = (targetOffsetX < 0) === this.isOppositeDirection;
    const firstSpike = { x: isTargetInFront ? Math.min(spawn.x, Math.abs(targetOffsetX)) : spawn.x, y: spawn.y };
    this.spikeRow = { spawn: firstSpike, spikes, spawnedCount: 0, startedAt: gameLoop.now(), origin: this.getFootPoint(), isLeft: this.isOppositeDirection, effectKey: this.getPhaseKey("fxRootSpike") };
  }

  /** Spawns the next spike when due and ends the row after the last one. */
  updateSpikeRow() {
    if (!this.spikeRow) return;
    const { spikes, startedAt, spawnedCount } = this.spikeRow;
    const dueCount = Math.floor((gameLoop.now() - startedAt) / spikes.interval) + 1;
    if (spawnedCount < dueCount) this.spawnRowSpike();
    if (this.spikeRow.spawnedCount >= spikes.count) this.spikeRow = null;
  }

  /** Spawns the next spike of the row. */
  spawnRowSpike() {
    const { spawn, spikes, spawnedCount, origin, isLeft, effectKey } = this.spikeRow;
    const spikeSpawn = { x: spawn.x + spawnedCount * spikes.spacing, y: spawn.y };
    this.spawnEffect(effectKey, { origin, spawn: spikeSpawn, isLeft });
    this.spikeRow.spawnedCount++;
  }

  /**
   * Spawns a boss effect relative to an origin, mirrored by facing direction.
   * @param {string} key - Effect settings key.
   * @param {Object} [placement] - Placement and motion options.
   * @param {{x: number, y: number}} [placement.origin] - Origin point, defaults to the foot point.
   * @param {{x: number, y: number}} [placement.spawn] - Offset from the origin.
   * @param {boolean} [placement.isLeft] - Whether to mirror to the left.
   * @param {number} [placement.speedX=0] - Horizontal speed in facing direction.
   */
  spawnEffect(key, { origin = this.getFootPoint(), spawn = { x: 0, y: 0 }, isLeft = this.isOppositeDirection, speedX = 0, ...motion } = {}) {
    const pivotX = origin.x + (isLeft ? -spawn.x : spawn.x);
    const pivotY = origin.y + spawn.y;
    const effect = new BossEffect(VERDAN_SETTINGS[key], this.effectFrames[key], this.imageCache, { ...motion, pivotX, pivotY, isLeft, speedX: isLeft ? -speedX : speedX });
    this.world.level.bossEffects.push(effect);
  }

  /** Stops the spike row and combo and removes all boss effects. */
  cancelAttacks() {
    this.spikeRow = null;
    this.pendingCombo = null;
    this.world?.clearBossEffects();
  }
}
