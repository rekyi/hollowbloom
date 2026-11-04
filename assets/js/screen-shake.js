const SCREEN_SHAKE_STORAGE_KEY = "screen-shake";

let isScreenShakeOn = true;

/** Loads the screen shake setting and binds its select. */
export function setupScreenShakeSetting() {
  isScreenShakeOn = loadScreenShakeSetting();
  const screenShakeSelectRef = document.getElementById("screen-shake-select");
  screenShakeSelectRef.value = isScreenShakeOn ? "on" : "off";
  screenShakeSelectRef.addEventListener("change", handleScreenShakeChange);
}

/**
 * Tells whether screen shake is enabled.
 * @returns {boolean} True if screen shake is on.
 */
export function isScreenShakeEnabled() {
  return isScreenShakeOn;
}

/**
 * Applies and saves the selected screen shake setting.
 * @param {Event} event - Change event of the screen shake select.
 */
function handleScreenShakeChange(event) {
  isScreenShakeOn = event.target.value === "on";
  saveScreenShakeSetting();
}

/**
 * Gets the default screen shake setting based on the reduced motion preference.
 * @returns {boolean} False if the user prefers reduced motion.
 */
function getDefaultScreenShakeSetting() {
  return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Loads the screen shake setting from localStorage.
 * @returns {boolean} The saved setting or the default.
 */
function loadScreenShakeSetting() {
  try {
    const savedSetting = localStorage.getItem(SCREEN_SHAKE_STORAGE_KEY);
    return savedSetting === null ? getDefaultScreenShakeSetting() : savedSetting === "on";
  } catch (error) {
    console.error("Saved screen shake setting could not be loaded.", error);
    return getDefaultScreenShakeSetting();
  }
}

/** Saves the screen shake setting to localStorage. */
function saveScreenShakeSetting() {
  try {
    localStorage.setItem(SCREEN_SHAKE_STORAGE_KEY, isScreenShakeOn ? "on" : "off");
  } catch (error) {
    console.error("Screen shake setting could not be saved.", error);
  }
}
