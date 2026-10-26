import { appState, startScreenMusic } from "./data.js";
import { gameLoop } from "./models/game-loop.class.js";

let startScreenMusicWasPlaying = false;
let gameplayMusicWasPlaying = false;
let startScreenMusicRestartTimeout = null;
let isStartScreenMusicRequested = false;
let isStartScreenMusicEnded = false;

export function setupStartScreenMusic() {
  startScreenMusic.loop = false;
  startScreenMusic.volume = appState.musicVolume;
  startScreenMusic.addEventListener("ended", handleStartScreenMusicEnded);
}

export function startStartScreenMusic() {
  isStartScreenMusicRequested = true;
  isStartScreenMusicEnded = false;
  clearStartScreenMusicRestart();
  startScreenMusic.play().catch((error) => {
    if (error.name === "NotAllowedError") return;
    console.error("Start-screen music could not be played.", error);
  });
}

export function stopStartScreenMusic() {
  isStartScreenMusicRequested = false;
  isStartScreenMusicEnded = false;
  clearStartScreenMusicRestart();
  startScreenMusic.pause();
  startScreenMusic.currentTime = 0;
}

function handleStartScreenMusicEnded() {
  isStartScreenMusicEnded = true;
  clearStartScreenMusicRestart();
  startScreenMusicRestartTimeout = setTimeout(restartStartScreenMusic, 3000);
}

function restartStartScreenMusic() {
  startScreenMusicRestartTimeout = null;
  if (!isStartScreenMusicRequested || appState.world || document.hidden) return;
  startStartScreenMusic();
}

function clearStartScreenMusicRestart() {
  if (startScreenMusicRestartTimeout === null) return;
  clearTimeout(startScreenMusicRestartTimeout);
  startScreenMusicRestartTimeout = null;
}

export function setupAudioSettings() {
  document.getElementById("music-volume").addEventListener("input", handleMusicVolumeInput);
  document.getElementById("sound-effects-volume").addEventListener("input", handleSoundEffectsVolumeInput);
  document.addEventListener("visibilitychange", handleVisibilityChange);
}

function handleVisibilityChange() {
  if (document.hidden) pauseAudioForHiddenTab();
  else resumeAudioForVisibleTab();
}

function pauseAudioForHiddenTab() {
  startScreenMusicWasPlaying = !startScreenMusic.paused;
  gameplayMusicWasPlaying = Boolean(appState.world && !appState.world.gameplayMusic.paused);
  startScreenMusic.pause();
  appState.world?.pauseGameplayMusic();
}

function resumeAudioForVisibleTab() {
  if (startScreenMusicWasPlaying && !appState.world) startStartScreenMusic();
  if (isStartScreenMusicEnded && startScreenMusicRestartTimeout === null && !appState.world) startStartScreenMusic();
  if (gameplayMusicWasPlaying && appState.world && !gameLoop.isPaused) appState.world.resumeGameplayMusic();
  startScreenMusicWasPlaying = false;
  gameplayMusicWasPlaying = false;
}

function handleMusicVolumeInput(event) {
  appState.musicVolume = Number(event.target.value) / 100;
  showVolumeValue("music-volume-value", event.target.value);
  startScreenMusic.volume = appState.musicVolume;
  if (appState.world) appState.world.gameplayMusic.volume = appState.musicVolume;
}

function handleSoundEffectsVolumeInput(event) {
  showVolumeValue("sound-effects-volume-value", event.target.value);
}

function showVolumeValue(outputId, value) {
  document.getElementById(outputId).value = `${value}%`;
}
