import { appState } from "./data.js";

const FADE_STEP_MS = 50;
const fadeLevels = new WeakMap();
const fadeTimers = new WeakMap();

export function updateMusicVolume(music) {
  const fadeLevel = fadeLevels.get(music) ?? 1;
  music.volume = appState.masterVolume * appState.musicVolume * fadeLevel * fadeLevel;
  music.muted = appState.isAudioMuted;
}

export function setMusicFadeLevel(music, level) {
  cancelMusicFade(music);
  fadeLevels.set(music, level);
  updateMusicVolume(music);
}

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

export function cancelMusicFade(music) {
  clearInterval(fadeTimers.get(music));
  fadeTimers.delete(music);
}
