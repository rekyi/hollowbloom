import { translate } from "./translation.js";

export function setupFullscreen() {
  if (!document.fullscreenEnabled) {
    document.getElementById("display-settings").hidden = true;
    return;
  }
  document.getElementById("screen-mode").addEventListener("change", handleScreenModeChange);
  document.addEventListener("fullscreenchange", syncScreenMode);
}

async function handleScreenModeChange(event) {
  try {
    await changeScreenMode(event.target.value);
  } catch (error) {
    console.error(error);
    alert(translate("message.screenModeFailed"));
    syncScreenMode();
  }
}

function changeScreenMode(mode) {
  if (mode === "fullscreen") return document.documentElement.requestFullscreen();
  return document.exitFullscreen();
}

function syncScreenMode() {
  document.getElementById("screen-mode").value = document.fullscreenElement ? "fullscreen" : "window";
}
