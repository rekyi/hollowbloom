import { translate } from "./translation.js";

const screenShake = { storageKey: "screen-shake", switchId: "screen-shake-switch", isOn: true };
const damageFlash = { storageKey: "damage-flash", switchId: "damage-flash-switch", isOn: true };

export function setupEffectSettings() {
  screenShake.isOn = loadEffectSetting(screenShake.storageKey, getDefaultEffectSetting());
  damageFlash.isOn = loadEffectSetting(damageFlash.storageKey, screenShake.isOn);
  setupEffectSwitch(screenShake);
  setupEffectSwitch(damageFlash);
}

export function isScreenShakeEnabled() {
  return screenShake.isOn;
}

export function isDamageFlashEnabled() {
  return damageFlash.isOn;
}

function setupEffectSwitch(effect) {
  const switchRef = document.getElementById(effect.switchId);
  updateEffectSwitch(switchRef, effect.isOn);
  switchRef.addEventListener("click", () => {
    effect.isOn = !effect.isOn;
    updateEffectSwitch(switchRef, effect.isOn);
    saveEffectSetting(effect);
  });
}

function updateEffectSwitch(switchRef, isOn) {
  const stateRef = switchRef.querySelector(".effect-switch-state");
  switchRef.setAttribute("aria-checked", String(isOn));
  stateRef.dataset.i18n = isOn ? "settings.on" : "settings.off";
  stateRef.textContent = translate(stateRef.dataset.i18n);
}

function getDefaultEffectSetting() {
  return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function loadEffectSetting(storageKey, defaultSetting) {
  try {
    const savedSetting = localStorage.getItem(storageKey);
    return savedSetting === null ? defaultSetting : savedSetting === "on";
  } catch (error) {
    console.error(`Saved setting "${storageKey}" could not be loaded.`, error);
    return defaultSetting;
  }
}

function saveEffectSetting({ storageKey, isOn }) {
  try {
    localStorage.setItem(storageKey, isOn ? "on" : "off");
  } catch (error) {
    console.error(`Setting "${storageKey}" could not be saved.`, error);
  }
}
