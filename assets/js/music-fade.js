import { appState } from "./data.js";

const FADE_STEP_MS = 50;
const fadeLevels = new WeakMap();
const fadeTimers = new WeakMap();

/**
 * Applies volume settings, fade level and mute state to a music track.
 * @param {HTMLAudioElement} music - Music track.
 */
export function updateMusicVolume(music) {
  const fadeLevel = fadeLevels.get(music) ?? 1;
  music.volume = appState.masterVolume * appState.musicVolume * fadeLevel * fadeLevel;
  music.muted = appState.isAudioMuted;
}

/**
 * Cancels any running fade and sets the fade level directly.
 * @param {HTMLAudioElement} music - Music track.
 * @param {number} level - Fade level between 0 and 1.
 */
export function setMusicFadeLevel(music, level) {
  cancelMusicFade(music);
  fadeLevels.set(music, level);
  updateMusicVolume(music);
}

/**
 * Fades a music track linearly to a target fade level.
 * @param {HTMLAudioElement} music - Music track.
 * @param {number} targetLevel - Target fade level between 0 and 1.
 * @param {number} durationMs - Fade duration in milliseconds.
 * @param {Function} [onFinished] - Called when the fade completes.
 */
export function fadeMusic(music, targetLevel, durationMs, onFinished = () => {}) {
  cancelMusicFade(music);
  const startLevel = fadeLevels.get(music) ?? 1;
  const startTimeMs = performance.now();
  const timer = setInterval(() => {
    const progress = Math.min((performance.now() - startTimeMs) / durationMs, 1);
    fadeLevels.set(music, startLevel + (targetLevel - startLevel) * progress);
    updateMusicVolume(music);
    if (progress < 1) return;
    cancelMusicFade(music);
    onFinished();
  }, FADE_STEP_MS);
  fadeTimers.set(music, timer);
}

/**
 * Stops a running fade of a music track.
 * @param {HTMLAudioElement} music - Music track.
 */
export function cancelMusicFade(music) {
  clearInterval(fadeTimers.get(music));
  fadeTimers.delete(music);
}
