import { appState, startScreenMusic } from "./data.js";
import { gameLoop } from "./models/game-loop.class.js";

const AUDIO_SETTINGS_STORAGE_KEY = "audio-settings";
const START_SCREEN_MUSIC_PAUSE_MS = 3000;
let isStartScreenMusicWanted = false;
let startScreenMusicTimeout = null;
let wasGameplayMusicPlaying = false;

export function setupStartScreenMusic() {
  startScreenMusic.loop = false;
  startScreenMusic.addEventListener("ended", handleStartScreenMusicEnded);
}

export function startStartScreenMusic() {
  isStartScreenMusicWanted = true;
  clearTimeout(startScreenMusicTimeout);
  startScreenMusic.play().catch((error) => {
    if (error.name !== "NotAllowedError") console.error("Start-screen music could not be played.", error);
  });
}

export function stopStartScreenMusic() {
  isStartScreenMusicWanted = false;
  clearTimeout(startScreenMusicTimeout);
  startScreenMusic.pause();
  startScreenMusic.currentTime = 0;
}

function handleStartScreenMusicEnded() {
  startScreenMusicTimeout = setTimeout(startStartScreenMusic, START_SCREEN_MUSIC_PAUSE_MS);
}

function handleVisibilityChange() {
  if (document.hidden) pauseAudioForHiddenTab();
  else resumeAudioForVisibleTab();
}

function pauseAudioForHiddenTab() {
  wasGameplayMusicPlaying = Boolean(appState.world && !appState.world.gameplayMusic.paused);
  clearTimeout(startScreenMusicTimeout);
  startScreenMusic.pause();
  appState.world?.pauseGameplayMusic();
}

function resumeAudioForVisibleTab() {
  if (isStartScreenMusicWanted) startStartScreenMusic();
  if (wasGameplayMusicPlaying && !gameLoop.isPaused) appState.world?.resumeGameplayMusic();
  wasGameplayMusicPlaying = false;
}

export function setupAudioSettings() {
  loadAudioSettings();
  setVolumeSlider("music-volume", appState.musicVolume);
  setVolumeSlider("sound-effects-volume", appState.soundEffectsVolume);
  applyMusicVolume();
  document.getElementById("music-volume").addEventListener("input", handleMusicVolumeInput);
  document.getElementById("sound-effects-volume").addEventListener("input", handleSoundEffectsVolumeInput);
  document.addEventListener("visibilitychange", handleVisibilityChange);
}

function handleMusicVolumeInput(event) {
  appState.musicVolume = Number(event.target.value) / 100;
  showVolumeValue("music-volume-value", event.target.value);
  applyMusicVolume();
  saveAudioSettings();
}

function handleSoundEffectsVolumeInput(event) {
  appState.soundEffectsVolume = Number(event.target.value) / 100;
  showVolumeValue("sound-effects-volume-value", event.target.value);
  saveAudioSettings();
}

function applyMusicVolume() {
  startScreenMusic.volume = appState.musicVolume;
  if (appState.world) appState.world.gameplayMusic.volume = appState.musicVolume;
}

function setVolumeSlider(sliderId, volume) {
  const percent = Math.round(volume * 100);
  document.getElementById(sliderId).value = percent;
  showVolumeValue(`${sliderId}-value`, percent);
}

function showVolumeValue(outputId, value) {
  document.getElementById(outputId).value = `${value}%`;
}

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
  try {
    const settings = JSON.parse(localStorage.getItem(AUDIO_SETTINGS_STORAGE_KEY));
    if (isValidVolume(settings?.musicVolume)) appState.musicVolume = settings.musicVolume;
    if (isValidVolume(settings?.soundEffectsVolume)) appState.soundEffectsVolume = settings.soundEffectsVolume;
  } catch (error) {
    console.error("Saved audio settings could not be loaded.", error);
  }
}

function isValidVolume(volume) {
  return typeof volume === "number" && volume >= 0 && volume <= 1;
}
