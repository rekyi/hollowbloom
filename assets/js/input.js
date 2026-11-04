import { appState, ATTACK_KEYS, EXTRA_ATTACK_KEYS, JUMP_KEYS, MOVE_LEFT_KEYS, MOVE_RIGHT_KEYS, PAUSE_KEYS, pressedKeys, RESTART_KEYS, RUN_KEYS, TIMER_START_KEYS } from "./data.js";
import { gameLoop } from "./models/game-loop.class.js";
import { restartLevel, syncPauseScreen } from "./screens.js";

/** Registers the global keyboard, blur and visibility listeners. */
export function setupInput() {
  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("keyup", handleKeyUp);
  window.addEventListener("blur", resetKeyboard);
  document.addEventListener("visibilitychange", handleVisibilityChange);
}

/**
 * Routes a keydown to pause, restart or gameplay handling.
 * @param {KeyboardEvent} event - Keydown event.
 */
function handleKeyDown(event) {
  if (!appState.world || appState.world.isGameOver || appState.world.isVictory) return;
  if (PAUSE_KEYS.includes(event.code)) handlePauseKey(event);
  else if (RESTART_KEYS.includes(event.code)) handleRestartKey(event);
  else if (!gameLoop.isPaused) handleGameKey(event);
}

/**
 * Releases a key and updates the keyboard state.
 * @param {KeyboardEvent} event - Keyup event.
 */
function handleKeyUp(event) {
  pressedKeys.delete(event.code);
  updateKeyboardState();
}

/** Releases all keys when the tab becomes hidden. */
function handleVisibilityChange() {
  if (document.hidden) resetKeyboard();
}

/**
 * Toggles pause unless the key is repeated, combined with a modifier or a dialog is open.
 * @param {KeyboardEvent} event - Keydown event of a pause key.
 */
function handlePauseKey(event) {
  if (event.repeat) return;
  if (event.code !== "Escape" && (event.ctrlKey || event.metaKey || document.querySelector("dialog[open]"))) return;
  togglePause();
}

/**
 * Restarts the level unless the key is repeated, combined with a modifier or a dialog is open.
 * @param {KeyboardEvent} event - Keydown event of a restart key.
 */
function handleRestartKey(event) {
  if (event.repeat || event.ctrlKey || event.metaKey || document.querySelector("dialog[open]")) return;
  restartLevel();
}

/** Toggles the game pause, pauses or resumes the music and updates the pause screen. */
export function togglePause() {
  gameLoop.togglePause();
  if (gameLoop.isPaused) appState.world.pauseGameplayMusic();
  else appState.world.resumeGameplayMusic();
  syncPauseScreen();
}

/**
 * Handles a gameplay key: movement state, timer start, attacks and jumping.
 * @param {KeyboardEvent} event - Keydown event.
 */
function handleGameKey(event) {
  if (gameLoop.isStarting) return;
  if (gameLoop.isIntroPlaying) return handleIntroKey(event);
  pressedKeys.add(event.code);
  updateKeyboardState();
  if (TIMER_START_KEYS.includes(event.code)) appState.world.startTimer();
  if (ATTACK_KEYS.includes(event.code) && !event.repeat) appState.world.character.attack();
  if (EXTRA_ATTACK_KEYS.includes(event.code) && !event.repeat) appState.world.character.extraAttack();
  if (JUMP_KEYS.includes(event.code)) handleJumpKey(event);
}

/**
 * Skips the camera intro when a jump key is pressed.
 * @param {KeyboardEvent} event - Keydown event during the intro.
 */
function handleIntroKey(event) {
  if (JUMP_KEYS.includes(event.code) && !event.repeat) appState.world.skipCameraIntro();
}

/**
 * Makes the character jump on the first press of a jump key.
 * @param {KeyboardEvent} event - Keydown event of a jump key.
 */
function handleJumpKey(event) {
  event.preventDefault();
  if (!event.repeat) appState.world.character.jump();
}

/**
 * Checks whether any of the given keys is currently held.
 * @param {string[]} codes - Key codes to check.
 * @returns {boolean} True if at least one key is pressed.
 */
function isAnyKeyPressed(codes) {
  return codes.some((code) => pressedKeys.has(code));
}

/** Updates the keyboard direction and action flags from the pressed keys. */
function updateKeyboardState() {
  appState.keyboard.RIGHT = isAnyKeyPressed(MOVE_RIGHT_KEYS);
  appState.keyboard.LEFT = isAnyKeyPressed(MOVE_LEFT_KEYS);
  appState.keyboard.SPACE = isAnyKeyPressed(JUMP_KEYS);
  appState.keyboard.SHIFT = isAnyKeyPressed(RUN_KEYS);
}

/** Releases all keys and clears the keyboard state. */
export function resetKeyboard() {
  pressedKeys.clear();
  updateKeyboardState();
  appState.keyboard.UP = false;
  appState.keyboard.DOWN = false;
}
