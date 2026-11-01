import { pressedKeys } from "./data.js";

const RUN_KEY = "ShiftLeft";
let isRunModeOn = false;

export function setupTouchControls() {
  document.querySelectorAll("[data-touch-key]").forEach(setupHoldButton);
  document.getElementById("touch-run-button").addEventListener("click", toggleRunMode);
}

function setupHoldButton(buttonRef) {
  buttonRef.addEventListener("pointerdown", (event) => pressButton(event, buttonRef));
  ["pointerup", "pointercancel", "lostpointercapture"].forEach((eventName) => {
    buttonRef.addEventListener(eventName, () => releaseButton(buttonRef));
  });
}

function pressButton(event, buttonRef) {
  event.preventDefault();
  if (buttonRef.classList.contains("is-pressed")) return;
  buttonRef.setPointerCapture(event.pointerId);
  buttonRef.classList.add("is-pressed");
  syncRunKey();
  dispatchKey("keydown", buttonRef.dataset.touchKey);
}

function releaseButton(buttonRef) {
  if (!buttonRef.classList.contains("is-pressed")) return;
  buttonRef.classList.remove("is-pressed");
  dispatchKey("keyup", buttonRef.dataset.touchKey);
}

function toggleRunMode(event) {
  isRunModeOn = !isRunModeOn;
  event.currentTarget.setAttribute("aria-pressed", String(isRunModeOn));
  syncRunKey();
}

function syncRunKey() {
  const isRunKeyHeld = pressedKeys.has(RUN_KEY);
  if (isRunModeOn && !isRunKeyHeld) dispatchKey("keydown", RUN_KEY);
  if (!isRunModeOn && isRunKeyHeld) dispatchKey("keyup", RUN_KEY);
}

function dispatchKey(type, code) {
  window.dispatchEvent(new KeyboardEvent(type, { code, cancelable: true }));
}
