import { appState, deathScreenMusic, startScreenMusic } from "./data.js";
import { AudioError } from "./models/audio-error.class.js";
import { gameLoop } from "./models/game-loop.class.js";
import { applySfxSettings } from "./sfx.js";
import { onLanguageChange, translate } from "./translation.js";

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
  AudioError.play(startScreenMusic);
}

export function stopStartScreenMusic() {
  isStartScreenMusicWanted = false;
  clearTimeout(startScreenMusicTimeout);
  AudioError.stop(startScreenMusic);
}

export function startDeathScreenMusic() {
  deathScreenMusic.loop = false;
  AudioError.stop(deathScreenMusic);
  AudioError.play(deathScreenMusic);
}

export function stopDeathScreenMusic() {
  AudioError.stop(deathScreenMusic);
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
  AudioError.pause(startScreenMusic);
  appState.world?.pauseGameplayMusic();
}

function resumeAudioForVisibleTab() {
  if (isStartScreenMusicWanted) startStartScreenMusic();
  if (wasGameplayMusicPlaying && !gameLoop.isPaused) appState.world?.resumeGameplayMusic();
  wasGameplayMusicPlaying = false;
}

export function setupAudioSettings() {
  loadAudioSettings();
  setVolumeSlider("master-volume", appState.masterVolume);
  setVolumeSlider("music-volume", appState.musicVolume);
  setVolumeSlider("sound-effects-volume", appState.soundEffectsVolume);
  updateAudioMuteButton();
  applyMusicVolume();
  applySfxSettings();
  document.getElementById("master-volume").addEventListener("input", handleMasterVolumeInput);
  document.getElementById("music-volume").addEventListener("input", handleMusicVolumeInput);
  document.getElementById("sound-effects-volume").addEventListener("input", handleSoundEffectsVolumeInput);
  document.getElementById("audio-mute-button").addEventListener("click", toggleAudioMute);
  document.addEventListener("visibilitychange", handleVisibilityChange);
  onLanguageChange(updateAudioMuteButton);
}

function handleMasterVolumeInput(event) {
  appState.masterVolume = Number(event.target.value) / 100;
  showVolumeValue("master-volume-value", event.target.value);
  applyMusicVolume();
  applySfxSettings();
  saveAudioSettings();
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
  applySfxSettings();
  saveAudioSettings();
}

function toggleAudioMute() {
  appState.isAudioMuted = !appState.isAudioMuted;
  updateAudioMuteButton();
  applyMusicVolume();
  applySfxSettings();
  saveAudioSettings();
}

function updateAudioMuteButton() {
  const muteButtonRef = document.getElementById("audio-mute-button");
  const settingsAudioRef = document.querySelector(".settings-audio");
  muteButtonRef.setAttribute("aria-pressed", String(appState.isAudioMuted));
  muteButtonRef.setAttribute("aria-label", translate(appState.isAudioMuted ? "audio.unmute" : "audio.mute"));
  settingsAudioRef.classList.toggle("is-muted", appState.isAudioMuted);
  settingsAudioRef.querySelectorAll('input[type="range"]').forEach((sliderRef) => {
    sliderRef.disabled = appState.isAudioMuted;
  });
}

export function applyMusicVolume(gameplayMusic = appState.world?.gameplayMusic) {
  const volume = appState.masterVolume * appState.musicVolume;
  startScreenMusic.volume = volume;
  startScreenMusic.muted = appState.isAudioMuted;
  deathScreenMusic.volume = volume;
  deathScreenMusic.muted = appState.isAudioMuted;
  if (!gameplayMusic) return;
  gameplayMusic.volume = volume;
  gameplayMusic.muted = appState.isAudioMuted;
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
      masterVolume: appState.masterVolume,
      musicVolume: appState.musicVolume,
      soundEffectsVolume: appState.soundEffectsVolume,
      isAudioMuted: appState.isAudioMuted,
    }),
  );
}

function loadAudioSettings() {
  try {
    const settings = JSON.parse(localStorage.getItem(AUDIO_SETTINGS_STORAGE_KEY));
    if (isValidVolume(settings?.masterVolume)) appState.masterVolume = settings.masterVolume;
    if (isValidVolume(settings?.musicVolume)) appState.musicVolume = settings.musicVolume;
    if (isValidVolume(settings?.soundEffectsVolume)) appState.soundEffectsVolume = settings.soundEffectsVolume;
    if (typeof settings?.isAudioMuted === "boolean") appState.isAudioMuted = settings.isAudioMuted;
  } catch (error) {
    console.error("Saved audio settings could not be loaded.", error);
  }
}

function isValidVolume(volume) {
  return typeof volume === "number" && volume >= 0 && volume <= 1;
}
