import { translate } from "./translation.js";

const screenShake = { storageKey: "screen-shake", switchId: "screen-shake-switch", isOn: true };
const damageFlash = { storageKey: "damage-flash", switchId: "damage-flash-switch", isOn: true };

/** Loads the screen effect settings and wires up their switches. */
export function setupEffectSettings() {
  screenShake.isOn = loadEffectSetting(screenShake.storageKey, getDefaultEffectSetting());
  damageFlash.isOn = loadEffectSetting(damageFlash.storageKey, screenShake.isOn);
  setupEffectSwitch(screenShake);
  setupEffectSwitch(damageFlash);
}

/**
 * Tells whether screen shake is enabled.
 * @returns {boolean} True if screen shake is on.
 */
export function isScreenShakeEnabled() {
  return screenShake.isOn;
}

/**
 * Tells whether the damage flash is enabled.
 * @returns {boolean} True if the damage flash is on.
 */
export function isDamageFlashEnabled() {
  return damageFlash.isOn;
}

/**
 * Syncs an effect switch with its setting and toggles the setting on click.
 * @param {{storageKey: string, switchId: string, isOn: boolean}} effect - Effect setting to bind.
 */
function setupEffectSwitch(effect) {
  const switchRef = document.getElementById(effect.switchId);
  updateEffectSwitch(switchRef, effect.isOn);
  switchRef.addEventListener("click", () => {
    effect.isOn = !effect.isOn;
    updateEffectSwitch(switchRef, effect.isOn);
    saveEffectSetting(effect);
  });
}

/**
 * Updates the checked state and translated label of an effect switch.
 * @param {HTMLElement} switchRef - Switch button element.
 * @param {boolean} isOn - Whether the effect is enabled.
 */
function updateEffectSwitch(switchRef, isOn) {
  const stateRef = switchRef.querySelector(".effect-switch-state");
  switchRef.setAttribute("aria-checked", String(isOn));
  stateRef.dataset.i18n = isOn ? "settings.on" : "settings.off";
  stateRef.textContent = translate(stateRef.dataset.i18n);
}

/**
 * Gets the default effect setting based on the reduced motion preference.
 * @returns {boolean} False if the user prefers reduced motion.
 */
function getDefaultEffectSetting() {
  return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Loads an effect setting from localStorage.
 * @param {string} storageKey - localStorage key of the setting.
 * @param {boolean} defaultSetting - Value used if nothing is saved or loading fails.
 * @returns {boolean} The loaded setting.
 */
function loadEffectSetting(storageKey, defaultSetting) {
  try {
    const savedSetting = localStorage.getItem(storageKey);
    return savedSetting === null ? defaultSetting : savedSetting === "on";
  } catch (error) {
    console.error(`Saved setting "${storageKey}" could not be loaded.`, error);
    return defaultSetting;
  }
}

/**
 * Saves an effect setting to localStorage.
 * @param {{storageKey: string, isOn: boolean}} effect - Effect setting to save.
 */
function saveEffectSetting({ storageKey, isOn }) {
  try {
    localStorage.setItem(storageKey, isOn ? "on" : "off");
  } catch (error) {
    console.error(`Setting "${storageKey}" could not be saved.`, error);
  }
}
