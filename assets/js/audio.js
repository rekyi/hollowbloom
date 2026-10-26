import { appState, startScreenMusic } from "./data.js";

export function setupStartScreenMusic() {
  startScreenMusic.loop = true;
  startScreenMusic.volume = appState.musicVolume;
}

export function startStartScreenMusic() {
  startScreenMusic.play().catch((error) => {
    if (error.name === "NotAllowedError") return;
    console.error("Start-screen music could not be played.", error);
  });
}

export function stopStartScreenMusic() {
  startScreenMusic.pause();
  startScreenMusic.currentTime = 0;
}

export function setupAudioSettings() {
  document.getElementById("music-volume").addEventListener("input", handleMusicVolumeInput);
  document.getElementById("sound-effects-volume").addEventListener("input", handleSoundEffectsVolumeInput);
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
