const SCREEN_SHAKE_STORAGE_KEY = "screen-shake";

let isScreenShakeOn = true;

export function setupScreenShakeSetting() {
  isScreenShakeOn = loadScreenShakeSetting();
  const screenShakeSelectRef = document.getElementById("screen-shake-select");
  screenShakeSelectRef.value = isScreenShakeOn ? "on" : "off";
  screenShakeSelectRef.addEventListener("change", handleScreenShakeChange);
}

export function isScreenShakeEnabled() {
  return isScreenShakeOn;
}

function handleScreenShakeChange(event) {
  isScreenShakeOn = event.target.value === "on";
  saveScreenShakeSetting();
}

function getDefaultScreenShakeSetting() {
  return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function loadScreenShakeSetting() {
  try {
    const savedSetting = localStorage.getItem(SCREEN_SHAKE_STORAGE_KEY);
    return savedSetting === null ? getDefaultScreenShakeSetting() : savedSetting === "on";
  } catch (error) {
    console.error("Saved screen shake setting could not be loaded.", error);
    return getDefaultScreenShakeSetting();
  }
}

function saveScreenShakeSetting() {
  try {
    localStorage.setItem(SCREEN_SHAKE_STORAGE_KEY, isScreenShakeOn ? "on" : "off");
  } catch (error) {
    console.error("Screen shake setting could not be saved.", error);
  }
}
