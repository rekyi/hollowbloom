import { BOSS_INTRO_MUSIC_MS } from "./data.js";

export const CAMERA_INTRO_ZOOM_OUT_MS = 1400;
export const CAMERA_INTRO_ZOOM_IN_MS = 1200;
export const CAMERA_INTRO_TOTAL_MS = BOSS_INTRO_MUSIC_MS;

/**
 * Calculates how far the boss intro camera is zoomed out.
 * @param {number} elapsedMs - Time since the intro started in milliseconds.
 * @returns {number} Blend between 0 (normal view) and 1 (fully zoomed out).
 */
export function getIntroBlend(elapsedMs) {
  const zoomInStartMs = CAMERA_INTRO_TOTAL_MS - CAMERA_INTRO_ZOOM_IN_MS;
  if (elapsedMs < CAMERA_INTRO_ZOOM_OUT_MS) return easeInOut(elapsedMs / CAMERA_INTRO_ZOOM_OUT_MS);
  if (elapsedMs < zoomInStartMs) return 1;
  return 1 - easeInOut((elapsedMs - zoomInStartMs) / CAMERA_INTRO_ZOOM_IN_MS);
}

/**
 * Applies a smoothstep ease-in-out curve.
 * @param {number} progress - Linear progress, clamped to 0..1.
 * @returns {number} Eased progress between 0 and 1.
 */
function easeInOut(progress) {
  const clamped = Math.min(Math.max(progress, 0), 1);
  return clamped * clamped * (3 - 2 * clamped);
}
