import { appState, ATTACK_KEYS, EXTRA_ATTACK_KEYS, JUMP_KEYS, MOVE_LEFT_KEYS, MOVE_RIGHT_KEYS, PAUSE_KEYS, pressedKeys, RESTART_KEYS, RUN_KEYS, TIMER_START_KEYS } from "./data.js";
import { gameLoop } from "./models/game-loop.class.js";
import { restartLevel, syncPauseScreen } from "./screens.js";

export function setupInput() {
  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("keyup", handleKeyUp);
  window.addEventListener("blur", resetKeyboard);
  document.addEventListener("visibilitychange", handleVisibilityChange);
}

function handleKeyDown(event) {
  if (!appState.world || appState.world.isGameOver || appState.world.isVictory) return;
  if (PAUSE_KEYS.includes(event.code)) handlePauseKey(event);
  else if (RESTART_KEYS.includes(event.code)) handleRestartKey(event);
  else if (event.code === "F2") handleDebugKey(event);
  else if (!gameLoop.isPaused) handleGameKey(event);
}

function handleDebugKey(event) {
  event.preventDefault();
  if (!event.repeat) appState.world.toggleCollisionOverlay();
}

function handleKeyUp(event) {
  pressedKeys.delete(event.code);
  updateKeyboardState();
}

function handleVisibilityChange() {
  if (document.hidden) resetKeyboard();
}

function handlePauseKey(event) {
  if (event.repeat) return;
  if (event.code !== "Escape" && (event.ctrlKey || event.metaKey || document.querySelector("dialog[open]"))) return;
  togglePause();
}

function handleRestartKey(event) {
  if (event.repeat || event.ctrlKey || event.metaKey || document.querySelector("dialog[open]")) return;
  restartLevel();
}

export function togglePause() {
  gameLoop.togglePause();
  if (gameLoop.isPaused) appState.world.pauseGameplayMusic();
  else appState.world.resumeGameplayMusic();
  syncPauseScreen();
}

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

function handleIntroKey(event) {
  if (JUMP_KEYS.includes(event.code) && !event.repeat) appState.world.skipCameraIntro();
}

function handleJumpKey(event) {
  event.preventDefault();
  if (!event.repeat) appState.world.character.jump();
}

function isAnyKeyPressed(codes) {
  return codes.some((code) => pressedKeys.has(code));
}

function updateKeyboardState() {
  appState.keyboard.RIGHT = isAnyKeyPressed(MOVE_RIGHT_KEYS);
  appState.keyboard.LEFT = isAnyKeyPressed(MOVE_LEFT_KEYS);
  appState.keyboard.SPACE = isAnyKeyPressed(JUMP_KEYS);
  appState.keyboard.SHIFT = isAnyKeyPressed(RUN_KEYS);
}

export function resetKeyboard() {
  pressedKeys.clear();
  updateKeyboardState();
  appState.keyboard.UP = false;
  appState.keyboard.DOWN = false;
}
