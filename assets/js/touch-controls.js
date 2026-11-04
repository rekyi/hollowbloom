import { pressedKeys } from "./data.js";

const RUN_KEY = "ShiftLeft";
let isRunModeOn = false;

/** Sets up the touch hold buttons, the run mode toggle and blocks their context menu. */
export function setupTouchControls() {
  document.querySelectorAll("[data-touch-key]").forEach(setupHoldButton);
  document.getElementById("touch-run-button").addEventListener("click", toggleRunMode);
  document.getElementById("touch-controls").addEventListener("contextmenu", preventContextMenu);
}

/**
 * Blocks the context menu (right click, touch and hold) on the touch buttons.
 * @param {MouseEvent} event - Contextmenu event inside the touch controls.
 */
function preventContextMenu(event) {
  event.preventDefault();
}

/**
 * Makes a touch button emit keydown on press and keyup on release.
 * @param {HTMLElement} buttonRef - Button with a data-touch-key attribute.
 */
function setupHoldButton(buttonRef) {
  buttonRef.addEventListener("pointerdown", (event) => pressButton(event, buttonRef));
  ["pointerup", "pointercancel", "lostpointercapture"].forEach((eventName) => {
    buttonRef.addEventListener(eventName, () => releaseButton(buttonRef));
  });
}

/**
 * Marks a touch button as pressed and dispatches its keydown.
 * @param {PointerEvent} event - Pointerdown event.
 * @param {HTMLElement} buttonRef - Pressed touch button.
 */
function pressButton(event, buttonRef) {
  event.preventDefault();
  if (buttonRef.classList.contains("is-pressed")) return;
  buttonRef.setPointerCapture(event.pointerId);
  buttonRef.classList.add("is-pressed");
  syncRunKey();
  dispatchKey("keydown", buttonRef.dataset.touchKey);
}

/**
 * Marks a touch button as released and dispatches its keyup.
 * @param {HTMLElement} buttonRef - Released touch button.
 */
function releaseButton(buttonRef) {
  if (!buttonRef.classList.contains("is-pressed")) return;
  buttonRef.classList.remove("is-pressed");
  dispatchKey("keyup", buttonRef.dataset.touchKey);
}

/**
 * Toggles the permanent run mode for touch controls.
 * @param {MouseEvent} event - Click event of the run button.
 */
function toggleRunMode(event) {
  isRunModeOn = !isRunModeOn;
  event.currentTarget.setAttribute("aria-pressed", String(isRunModeOn));
  syncRunKey();
}

/** Presses or releases the virtual run key to match the run mode. */
function syncRunKey() {
  const isRunKeyHeld = pressedKeys.has(RUN_KEY);
  if (isRunModeOn && !isRunKeyHeld) dispatchKey("keydown", RUN_KEY);
  if (!isRunModeOn && isRunKeyHeld) dispatchKey("keyup", RUN_KEY);
}

/**
 * Dispatches a synthetic keyboard event on the window.
 * @param {string} type - "keydown" or "keyup".
 * @param {string} code - Key code, e.g. "ArrowLeft".
 */
function dispatchKey(type, code) {
  window.dispatchEvent(new KeyboardEvent(type, { code, cancelable: true }));
}
