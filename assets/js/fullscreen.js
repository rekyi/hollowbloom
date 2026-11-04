import { translate } from "./translation.js";

/** Sets up the screen mode select, or hides it if fullscreen is unsupported. */
export function setupFullscreen() {
  if (!document.fullscreenEnabled) {
    document.getElementById("display-settings").hidden = true;
    return;
  }
  document.getElementById("screen-mode").addEventListener("change", handleScreenModeChange);
  document.addEventListener("fullscreenchange", syncScreenMode);
}

/**
 * Switches the screen mode and reports failures to the user.
 * @param {Event} event - Change event of the screen mode select.
 * @returns {Promise<void>}
 */
async function handleScreenModeChange(event) {
  try {
    await changeScreenMode(event.target.value);
  } catch (error) {
    console.error(error);
    alert(translate("message.screenModeFailed"));
    syncScreenMode();
  }
}

/**
 * Enters or exits fullscreen.
 * @param {string} mode - "fullscreen" or "window".
 * @returns {Promise<void>} Resolves when the mode change is done.
 */
function changeScreenMode(mode) {
  if (mode === "fullscreen") return document.documentElement.requestFullscreen();
  return document.exitFullscreen();
}

/** Syncs the screen mode select with the actual fullscreen state. */
function syncScreenMode() {
  document.getElementById("screen-mode").value = document.fullscreenElement ? "fullscreen" : "window";
}
