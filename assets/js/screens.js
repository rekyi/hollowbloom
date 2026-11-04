import { appState, START_LEVEL } from "./data.js";
import { gameLoop } from "./models/game-loop.class.js";
import { FemaleCharacter } from "./models/female-character.class.js";
import { MaleCharacter } from "./models/male-character.class.js";
import { World } from "./models/world.class.js";
import { countLevelCoins, getStartLevelIndex, loadLevelWithFallback } from "./level/level-loader.js";
import { resetKeyboard, togglePause } from "./input.js";
import { startDeathScreenMusic, startStartScreenMusic, startVictoryScreenMusic, stopDeathScreenMusic, stopStartScreenMusic, stopVictoryScreenMusic } from "./audio.js";
import { translate } from "./translation.js";

const SCREEN_FADE_DURATION_MS = 350;
const GAME_OVER_GROUND_RATIO = 0.81;
const GAME_OVER_CHARACTER_SCALE = 2;
let isScreenTransitioning = false;
let isLevelLoading = false;

/** Registers the click listeners of all menu and screen buttons. */
export function setupScreens() {
  document.getElementById("pre-start-button").addEventListener("click", revealStartMenu, { once: true });
  document.getElementById("character-choices").addEventListener("click", handleCharacterChoice);
  document.getElementById("start-button").addEventListener("click", startGame);
  document.getElementById("restart-button").addEventListener("click", restartLevel);
  document.getElementById("victory-restart-button").addEventListener("click", startGame);
  document.getElementById("pause-resume-button").addEventListener("click", togglePause);
  document.getElementById("pause-restart-button").addEventListener("click", restartLevel);
  document.getElementById("main-menu-button").addEventListener("click", returnToMainMenu);
  document.getElementById("victory-main-menu-button").addEventListener("click", returnToMainMenu);
  document.getElementById("pause-main-menu-button").addEventListener("click", returnToMainMenu);
}

/** Reveals the start menu after the first click and starts the menu music. */
function revealStartMenu() {
  const startScreenRef = document.getElementById("start-screen");
  startScreenRef.classList.remove("is-pre-start");
  document.querySelector(".start-menu").inert = false;
  document.getElementById("character-choices").inert = false;
  document.getElementById("start-button").focus();
  startStartScreenMusic();
}

/**
 * Selects the character class of the clicked choice button.
 * @param {MouseEvent} event - Delegated click event on the character choices.
 */
function handleCharacterChoice(event) {
  const choiceRef = event.target.closest("button");
  if (!choiceRef) return;
  appState.selectedCharacterClass = choiceRef.dataset.character === "male" ? MaleCharacter : FemaleCharacter;
  updateCharacterChoices(event.currentTarget, choiceRef);
}

/**
 * Marks only the selected character choice button as selected.
 * @param {HTMLElement} containerRef - Container of the choice buttons.
 * @param {HTMLElement} selectedRef - Selected choice button.
 */
function updateCharacterChoices(containerRef, selectedRef) {
  containerRef.querySelectorAll("button").forEach((buttonRef) => {
    const isSelected = buttonRef === selectedRef;
    buttonRef.classList.toggle("selected", isSelected);
    buttonRef.setAttribute("aria-pressed", String(isSelected));
  });
}

/**
 * Starts a new run at the configured start level.
 * @returns {Promise<void>} Resolves when the level has started.
 */
function startGame() {
  return startLevel(getStartLevelIndex(START_LEVEL));
}

/**
 * Restarts the current level and carries over the run stats.
 * @returns {Promise<void>} Resolves when the level has restarted.
 */
export function restartLevel() {
  const world = appState.world;
  return startLevel(world?.levelIndex ?? 0, getRestartCarryOver(world));
}

/**
 * Collects the run stats to keep when restarting a level.
 * @param {World|null} world - Current world, if any.
 * @returns {Object} Coins, time, defeated enemies, deaths and restarts to carry over.
 */
function getRestartCarryOver(world) {
  if (!world) return {};
  const isDeath = world.character.isDead();
  return {
    coins: world.levelStartCoins,
    coinsCollected: world.levelStartCoinsCollected,
    timeMs: world.getElapsedMs(),
    defeatedEnemies: world.levelStartDefeatedEnemies,
    deaths: world.deaths + (isDeath ? 1 : 0),
    restarts: world.restarts + (isDeath ? 0 : 1),
  };
}

/**
 * Loads a level and switches to it behind a screen transition.
 * @param {number} requestedLevelIndex - Zero-based index of the level to start.
 * @param {Object} [carryOver={}] - Run stats to keep; dropped if a fallback level is loaded.
 * @returns {Promise<void>}
 */
async function startLevel(requestedLevelIndex, carryOver = {}) {
  if (isScreenTransitioning || isLevelLoading) return;
  isLevelLoading = true;
  prepareLevelLoad();
  try {
    const { levelAssets, levelIndex } = await loadLevelWithFallback(requestedLevelIndex);
    const appliedCarryOver = levelIndex === requestedLevelIndex ? carryOver : {};
    await runScreenTransition(() => startGameAtBlackout(levelAssets, levelIndex, appliedCarryOver));
  } catch (error) {
    handleLevelLoadError(error);
  } finally {
    isLevelLoading = false;
  }
}

/** Stops input, music and the game loop and shows the loading message. */
function prepareLevelLoad() {
  resetKeyboard();
  stopDeathScreenMusic();
  stopVictoryScreenMusic();
  appState.world?.stopGameplayMusic();
  gameLoop.stop();
  setLevelLoadStatus(translate("message.levelLoading"));
}

/**
 * Logs a level load error and returns to the start screen with an error message.
 * @param {Error} error - The load error.
 */
function handleLevelLoadError(error) {
  console.error("Level could not be loaded.", error);
  appState.canvasRef.classList.remove("ready");
  document.getElementById("start-screen").hidden = false;
  setLevelLoadStatus(translate("message.levelLoadFailed"));
}

/**
 * Shows a level load status message.
 * @param {string} text - Message to display.
 */
function setLevelLoadStatus(text) {
  const loadStatusRef = document.getElementById("level-load-status");
  loadStatusRef.textContent = text;
  loadStatusRef.hidden = false;
}

/**
 * Hides all overlays and creates the world while the screen is black.
 * @param {Object} levelAssets - Loaded level data, layers and collision grid.
 * @param {number} levelIndex - Zero-based index of the loaded level.
 * @param {Object} carryOver - Run stats to keep.
 */
function startGameAtBlackout(levelAssets, levelIndex, carryOver) {
  document.getElementById("start-screen").hidden = true;
  document.getElementById("pause-screen").hidden = true;
  document.getElementById("game-over").hidden = true;
  document.getElementById("victory-screen").hidden = true;
  appState.canvasRef.classList.add("ready");
  document.getElementById("level-load-status").hidden = true;
  appState.world = new World(appState.canvasRef, appState.keyboard, showGameOver, appState.selectedCharacterClass, showVictory, levelAssets, levelIndex, carryOver);
  stopStartScreenMusic();
}

/** Transitions to the game over screen. */
function showGameOver() {
  runScreenTransition(showGameOverAtBlackout);
}

/** Shows the game over screen with the dead character and plays the death music. */
function showGameOverAtBlackout() {
  drawGameOverCharacter();
  document.getElementById("game-over").hidden = false;
  startDeathScreenMusic();
}

/** Transitions to the victory screen. */
function showVictory() {
  runScreenTransition(showVictoryAtBlackout);
}

/**
 * Shows the victory screen with the run stats and plays the victory music.
 * @returns {Promise<void>}
 */
async function showVictoryAtBlackout() {
  await renderVictoryStats();
  document.getElementById("victory-screen").hidden = false;
  document.getElementById("victory-restart-button").focus();
  startVictoryScreenMusic();
}

/**
 * Fills the victory screen with play time, coins, kills, deaths and restarts.
 * @returns {Promise<void>}
 */
async function renderVictoryStats() {
  document.getElementById("victory-play-time").textContent = appState.world.getTimerText();
  document.getElementById("victory-coins").textContent = await getVictoryCoinsText();
  document.getElementById("victory-defeated-enemies").textContent = String(appState.world.defeatedEnemies);
  document.getElementById("victory-deaths").textContent = String(appState.world.deaths);
  document.getElementById("victory-restarts").textContent = String(appState.world.restarts);
}

/**
 * Formats the collected coins against the total coins of all levels.
 * @returns {Promise<string>} "collected / total", or only the collected count if counting fails.
 */
async function getVictoryCoinsText() {
  const collectedCoins = appState.world.coinsCollected;
  try {
    return `${collectedCoins} / ${await countLevelCoins()}`;
  } catch (error) {
    console.error(error);
    return String(collectedCoins);
  }
}

/** Draws the dead character enlarged onto the game over canvas. */
function drawGameOverCharacter() {
  const characterCanvasRef = document.getElementById("game-over-character");
  const characterContext = characterCanvasRef.getContext("2d");
  const { img } = appState.world.character;
  const width = appState.world.character.width * GAME_OVER_CHARACTER_SCALE;
  const height = appState.world.character.height * GAME_OVER_CHARACTER_SCALE;
  const x = (characterCanvasRef.width - width) / 2;
  const y = characterCanvasRef.height * GAME_OVER_GROUND_RATIO - height;
  characterContext.clearRect(0, 0, characterCanvasRef.width, characterCanvasRef.height);
  characterContext.drawImage(img, x, y, width, height);
}

/** Shows or hides the pause screen to match the pause state and moves focus. */
export function syncPauseScreen() {
  document.getElementById("pause-screen").hidden = !gameLoop.isPaused;
  const buttonRef = document.getElementById("pause-resume-button");
  if (gameLoop.isPaused) buttonRef.focus();
  else buttonRef.blur();
}

/** Stops the game and transitions back to the start screen. */
function returnToMainMenu() {
  if (isScreenTransitioning) return;
  resetKeyboard();
  stopDeathScreenMusic();
  stopVictoryScreenMusic();
  gameLoop.stop();
  runScreenTransition(showStartScreen);
}

/**
 * Fades to black, runs a screen change and fades back in.
 * @param {Function} changeScreen - Callback (sync or async) executed while the screen is black.
 * @returns {Promise<void>}
 */
async function runScreenTransition(changeScreen) {
  if (isScreenTransitioning) return;
  isScreenTransitioning = true;
  const transitionRef = document.getElementById("screen-transition");
  try {
    transitionRef.classList.add("is-visible");
    await waitForScreenFade();
    await changeScreen();
    transitionRef.classList.remove("is-visible");
    await waitForScreenFade();
  } finally {
    transitionRef.classList.remove("is-visible");
    isScreenTransitioning = false;
  }
}

/**
 * Waits for one screen fade, or not at all with reduced motion.
 * @returns {Promise<void>} Resolves when the fade is done.
 */
function waitForScreenFade() {
  const duration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : SCREEN_FADE_DURATION_MS;
  return new Promise((resolve) => window.setTimeout(resolve, duration));
}

/** Discards the world and shows the start screen with its music. */
function showStartScreen() {
  appState.world?.stopGameplayMusic();
  appState.world = null;
  document.getElementById("pause-screen").hidden = true;
  document.getElementById("game-over").hidden = true;
  document.getElementById("victory-screen").hidden = true;
  appState.canvasRef.classList.remove("ready");
  document.getElementById("start-screen").hidden = false;
  document.getElementById("start-button").focus();
  startStartScreenMusic();
}
