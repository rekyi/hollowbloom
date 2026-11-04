import { appState, bossIntroMusic, bossMusic, bossRageMusic, deathScreenMusic, gameplayMusic, startScreenMusic, victoryScreenMusic } from "./data.js";
import { AudioError } from "./classes/audio-error.class.js";
import { gameLoop } from "./classes/game-loop.class.js";
import { cancelMusicFade, fadeMusic, setMusicFadeLevel, updateMusicVolume } from "./music-fade.js";
import { applySfxSettings } from "./sfx.js";
import { onLanguageChange, translate } from "./translation.js";

const AUDIO_SETTINGS_STORAGE_KEY = "audio-settings";
const START_SCREEN_MUSIC_PAUSE_MS = 3000;
const START_SCREEN_MUSIC_FADE_IN_MS = 2000;
const MUSIC_TRACKS = [startScreenMusic, deathScreenMusic, victoryScreenMusic, gameplayMusic, bossIntroMusic, bossMusic, bossRageMusic];
let isStartScreenMusicWanted = false;
let startScreenMusicTimeout = null;
let wasGameplayMusicPlaying = false;

/** Configures the start screen music to replay after a pause when it ends. */
export function setupStartScreenMusic() {
  startScreenMusic.loop = false;
  startScreenMusic.addEventListener("ended", handleStartScreenMusicEnded);
}

/**
 * Unlocks every music track except the start screen music during the first click.
 * iOS Safari only lets an audio element start later (e.g. from a timer) once it was played inside a click.
 */
export function unlockMusicTracks() {
  MUSIC_TRACKS.filter((track) => track !== startScreenMusic && track.paused).forEach(unlockTrack);
}

/**
 * Starts and immediately pauses a track, which unlocks it without making a sound.
 * @param {HTMLAudioElement} track - Music track to unlock.
 */
function unlockTrack(track) {
  track.play().catch(() => {});
  track.pause();
}

/** Starts the start screen music from silence with a fade-in. */
export function startStartScreenMusic() {
  isStartScreenMusicWanted = true;
  clearTimeout(startScreenMusicTimeout);
  setMusicFadeLevel(startScreenMusic, 0);
  AudioError.play(startScreenMusic);
  fadeMusic(startScreenMusic, 1, START_SCREEN_MUSIC_FADE_IN_MS);
}

/** Stops the start screen music and cancels any pending replay or fade. */
export function stopStartScreenMusic() {
  isStartScreenMusicWanted = false;
  clearTimeout(startScreenMusicTimeout);
  cancelMusicFade(startScreenMusic);
  AudioError.stop(startScreenMusic);
}

/** Plays the death screen music once from the beginning. */
export function startDeathScreenMusic() {
  deathScreenMusic.loop = false;
  AudioError.stop(deathScreenMusic);
  AudioError.play(deathScreenMusic);
}

/** Stops the death screen music. */
export function stopDeathScreenMusic() {
  AudioError.stop(deathScreenMusic);
}

/** Plays the victory screen music once from the beginning. */
export function startVictoryScreenMusic() {
  victoryScreenMusic.loop = false;
  AudioError.stop(victoryScreenMusic);
  AudioError.play(victoryScreenMusic);
}

/** Stops the victory screen music. */
export function stopVictoryScreenMusic() {
  AudioError.stop(victoryScreenMusic);
}

/** Schedules the start screen music to restart after a short pause. */
function handleStartScreenMusicEnded() {
  startScreenMusicTimeout = setTimeout(startStartScreenMusic, START_SCREEN_MUSIC_PAUSE_MS);
}

/** Pauses or resumes audio when the tab visibility changes. */
function handleVisibilityChange() {
  if (document.hidden) pauseAudioForHiddenTab();
  else resumeAudioForVisibleTab();
}

/** Pauses all music while the tab is hidden and remembers whether gameplay music was playing. */
function pauseAudioForHiddenTab() {
  wasGameplayMusicPlaying = Boolean(appState.world?.isGameplayMusicPlaying());
  clearTimeout(startScreenMusicTimeout);
  AudioError.pause(startScreenMusic);
  appState.world?.pauseGameplayMusic();
}

/** Resumes the music that was playing before the tab was hidden. */
function resumeAudioForVisibleTab() {
  if (isStartScreenMusicWanted) startStartScreenMusic();
  if (wasGameplayMusicPlaying && !gameLoop.isPaused) appState.world?.resumeGameplayMusic();
  wasGameplayMusicPlaying = false;
}

/** Loads saved audio settings, syncs the settings UI and registers its listeners. */
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

/**
 * Applies and saves a new master volume from the slider.
 * @param {Event} event - Input event of the master volume slider.
 */
function handleMasterVolumeInput(event) {
  appState.masterVolume = Number(event.target.value) / 100;
  showVolumeValue("master-volume-value", event.target.value);
  applyMusicVolume();
  applySfxSettings();
  saveAudioSettings();
}

/**
 * Applies and saves a new music volume from the slider.
 * @param {Event} event - Input event of the music volume slider.
 */
function handleMusicVolumeInput(event) {
  appState.musicVolume = Number(event.target.value) / 100;
  showVolumeValue("music-volume-value", event.target.value);
  applyMusicVolume();
  saveAudioSettings();
}

/**
 * Applies and saves a new sound effects volume from the slider.
 * @param {Event} event - Input event of the sound effects volume slider.
 */
function handleSoundEffectsVolumeInput(event) {
  appState.soundEffectsVolume = Number(event.target.value) / 100;
  showVolumeValue("sound-effects-volume-value", event.target.value);
  applySfxSettings();
  saveAudioSettings();
}

/** Toggles global audio mute and saves the setting. */
function toggleAudioMute() {
  appState.isAudioMuted = !appState.isAudioMuted;
  updateAudioMuteButton();
  applyMusicVolume();
  applySfxSettings();
  saveAudioSettings();
}

/** Syncs the mute button state, its label and the volume sliders with the mute setting. */
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

/** Applies the current volume settings to all music tracks. */
export function applyMusicVolume() {
  MUSIC_TRACKS.forEach(updateMusicVolume);
}

/**
 * Sets a volume slider and its value output to the given volume.
 * @param {string} sliderId - Id of the range input.
 * @param {number} volume - Volume between 0 and 1.
 */
function setVolumeSlider(sliderId, volume) {
  const percent = Math.round(volume * 100);
  document.getElementById(sliderId).value = percent;
  showVolumeValue(`${sliderId}-value`, percent);
}

/**
 * Displays a volume percentage in an output element.
 * @param {string} outputId - Id of the output element.
 * @param {number|string} value - Volume in percent.
 */
function showVolumeValue(outputId, value) {
  document.getElementById(outputId).value = `${value}%`;
}

/** Saves the current audio settings to localStorage. */
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

/** Loads valid audio settings from localStorage into the app state. */
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

/**
 * Checks whether a value is a valid volume.
 * @param {*} volume - Value to check.
 * @returns {boolean} True if the value is a number between 0 and 1.
 */
function isValidVolume(volume) {
  return typeof volume === "number" && volume >= 0 && volume <= 1;
}
