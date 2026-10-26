import { appState, startScreenMusic } from "./data.js";
import { gameLoop } from "./models/game-loop.class.js";

const AUDIO_SETTINGS_STORAGE_KEY = "audio-settings";
let startScreenMusicWasPlaying = false;
let gameplayMusicWasPlaying = false;
let startScreenMusicRestartTimeout = null;
let isStartScreenMusicRequested = false;
let isStartScreenMusicEnded = false;

function saveAudioSettings() {
  localStorage.setItem(
    AUDIO_SETTINGS_STORAGE_KEY,
    JSON.stringify({
      musicVolume: appState.musicVolume,
      soundEffectsVolume: appState.soundEffectsVolume,
    }),
  );
}

function loadAudioSettings() {
  const savedSettings = localStorage.getItem(AUDIO_SETTINGS_STORAGE_KEY);
  if (!savedSettings) return;
  try {
    const settings = JSON.parse(savedSettings);
    if (isValidVolume(settings.musicVolume)) appState.musicVolume = settings.musicVolume;
    if (isValidVolume(settings.soundEffectsVolume)) appState.soundEffectsVolume = settings.soundEffectsVolume;
  } catch (error) {
    console.error("Saved audio settings could not be loaded.", error);
  }
}

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
  const musicVolumeInput = document.getElementById("music-volume");
  const soundEffectsVolumeInput = document.getElementById("sound-effects-volume");
  loadAudioSettings();
  syncAudioSettings(musicVolumeInput, soundEffectsVolumeInput);
  musicVolumeInput.addEventListener("input", handleMusicVolumeInput);
  soundEffectsVolumeInput.addEventListener("input", handleSoundEffectsVolumeInput);
  document.addEventListener("visibilitychange", handleVisibilityChange);
}

function isValidVolume(volume) {
  return typeof volume === "number" && Number.isFinite(volume) && volume >= 0 && volume <= 1;
}

function syncAudioSettings(musicVolumeInput, soundEffectsVolumeInput) {
  musicVolumeInput.value = String(Math.round(appState.musicVolume * 100));
  soundEffectsVolumeInput.value = String(Math.round(appState.soundEffectsVolume * 100));
  showVolumeValue("music-volume-value", musicVolumeInput.value);
  showVolumeValue("sound-effects-volume-value", soundEffectsVolumeInput.value);
  startScreenMusic.volume = appState.musicVolume;
  if (appState.world) appState.world.gameplayMusic.volume = appState.musicVolume;
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
  saveAudioSettings();
}

function handleSoundEffectsVolumeInput(event) {
  appState.soundEffectsVolume = Number(event.target.value) / 100;
  showVolumeValue("sound-effects-volume-value", event.target.value);
  saveAudioSettings();
}

function showVolumeValue(outputId, value) {
  document.getElementById(outputId).value = `${value}%`;
}
