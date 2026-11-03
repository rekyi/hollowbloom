import { BOSS_INTRO_MUSIC_MS } from "./data.js";

export const CAMERA_INTRO_ZOOM_OUT_MS = 1400;
export const CAMERA_INTRO_ZOOM_IN_MS = 1200;
export const CAMERA_INTRO_TOTAL_MS = BOSS_INTRO_MUSIC_MS;

export function getIntroBlend(elapsedMs) {
  const zoomInStartMs = CAMERA_INTRO_TOTAL_MS - CAMERA_INTRO_ZOOM_IN_MS;
  if (elapsedMs < CAMERA_INTRO_ZOOM_OUT_MS) return easeInOut(elapsedMs / CAMERA_INTRO_ZOOM_OUT_MS);
  if (elapsedMs < zoomInStartMs) return 1;
  return 1 - easeInOut((elapsedMs - zoomInStartMs) / CAMERA_INTRO_ZOOM_IN_MS);
}

function easeInOut(progress) {
  const clamped = Math.min(Math.max(progress, 0), 1);
  return clamped * clamped * (3 - 2 * clamped);
}
