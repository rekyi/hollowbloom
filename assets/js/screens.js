import { appState, START_LEVEL } from "./data.js";
import { gameLoop } from "./models/game-loop.class.js";
import { FemaleCharacter } from "./models/female-character.class.js";
import { MaleCharacter } from "./models/male-character.class.js";
import { World } from "./models/world.class.js";
import { countLevelCoins, getStartLevelIndex, loadLevelWithFallback } from "./level/level-loader.js";
import { resetKeyboard, togglePause } from "./input.js";
import { startDeathScreenMusic, startStartScreenMusic, stopDeathScreenMusic, stopStartScreenMusic } from "./audio.js";
import { translate } from "./translation.js";

const SCREEN_FADE_DURATION_MS = 350;
const GAME_OVER_GROUND_RATIO = 0.81;
const GAME_OVER_CHARACTER_SCALE = 2;
let isScreenTransitioning = false;
let isLevelLoading = false;

export function setupScreens() {
  document.getElementById("pre-start-button").addEventListener("click", revealStartMenu, { once: true });
  document.getElementById("character-choices").addEventListener("click", handleCharacterChoice);
  document.getElementById("start-button").addEventListener("click", startGame);
  document.getElementById("restart-button").addEventListener("click", restartLevel);
  document.getElementById("victory-restart-button").addEventListener("click", startGame);
  document.getElementById("pause-resume-button").addEventListener("click", togglePause);
  document.getElementById("pause-restart-button").addEventListener("click", startGame);
  document.getElementById("main-menu-button").addEventListener("click", returnToMainMenu);
  document.getElementById("victory-main-menu-button").addEventListener("click", returnToMainMenu);
  document.getElementById("pause-main-menu-button").addEventListener("click", returnToMainMenu);
}

function revealStartMenu() {
  const startScreenRef = document.getElementById("start-screen");
  startScreenRef.classList.remove("is-pre-start");
  document.querySelector(".start-menu").inert = false;
  document.getElementById("character-choices").inert = false;
  document.getElementById("start-button").focus();
  startStartScreenMusic();
}

function handleCharacterChoice(event) {
  const choiceRef = event.target.closest("button");
  if (!choiceRef) return;
  appState.selectedCharacterClass = choiceRef.dataset.character === "male" ? MaleCharacter : FemaleCharacter;
  updateCharacterChoices(event.currentTarget, choiceRef);
}

function updateCharacterChoices(containerRef, selectedRef) {
  containerRef.querySelectorAll("button").forEach((buttonRef) => {
    const isSelected = buttonRef === selectedRef;
    buttonRef.classList.toggle("selected", isSelected);
    buttonRef.setAttribute("aria-pressed", String(isSelected));
  });
}

function startGame() {
  return startLevel(getStartLevelIndex(START_LEVEL));
}

function restartLevel() {
  return startLevel(appState.world?.levelIndex ?? 0);
}

async function startLevel(requestedLevelIndex) {
  if (isScreenTransitioning || isLevelLoading) return;
  isLevelLoading = true;
  prepareLevelLoad();
  try {
    const { levelAssets, levelIndex } = await loadLevelWithFallback(requestedLevelIndex);
    await runScreenTransition(() => startGameAtBlackout(levelAssets, levelIndex));
  } catch (error) {
    handleLevelLoadError(error);
  } finally {
    isLevelLoading = false;
  }
}

function prepareLevelLoad() {
  resetKeyboard();
  stopDeathScreenMusic();
  appState.world?.stopGameplayMusic();
  gameLoop.stop();
  setLevelLoadStatus(translate("message.levelLoading"));
}

function handleLevelLoadError(error) {
  console.error("Level could not be loaded.", error);
  appState.canvasRef.classList.remove("ready");
  document.getElementById("start-screen").hidden = false;
  setLevelLoadStatus(translate("message.levelLoadFailed"));
}

function setLevelLoadStatus(text) {
  const loadStatusRef = document.getElementById("level-load-status");
  loadStatusRef.textContent = text;
  loadStatusRef.hidden = false;
}

function startGameAtBlackout(levelAssets, levelIndex) {
  document.getElementById("start-screen").hidden = true;
  document.getElementById("pause-screen").hidden = true;
  document.getElementById("game-over").hidden = true;
  document.getElementById("victory-screen").hidden = true;
  appState.canvasRef.classList.add("ready");
  document.getElementById("level-load-status").hidden = true;
  appState.world = new World(appState.canvasRef, appState.keyboard, showGameOver, appState.selectedCharacterClass, showVictory, levelAssets, levelIndex);
  stopStartScreenMusic();
}

function showGameOver() {
  runScreenTransition(showGameOverAtBlackout);
}

function showGameOverAtBlackout() {
  drawGameOverCharacter();
  document.getElementById("game-over").hidden = false;
  startDeathScreenMusic();
}

function showVictory() {
  runScreenTransition(showVictoryAtBlackout);
}

async function showVictoryAtBlackout() {
  await renderVictoryStats();
  document.getElementById("victory-screen").hidden = false;
  document.getElementById("victory-restart-button").focus();
}

async function renderVictoryStats() {
  document.getElementById("victory-play-time").textContent = appState.world.getTimerText();
  document.getElementById("victory-coins").textContent = await getVictoryCoinsText();
  document.getElementById("victory-defeated-enemies").textContent = String(appState.world.defeatedEnemies);
}

async function getVictoryCoinsText() {
  const collectedCoins = appState.world.character.coins;
  try {
    return `${collectedCoins} / ${await countLevelCoins()}`;
  } catch (error) {
    console.error(error);
    return String(collectedCoins);
  }
}

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

export function syncPauseScreen() {
  document.getElementById("pause-screen").hidden = !gameLoop.isPaused;
  const buttonRef = document.getElementById("pause-resume-button");
  if (gameLoop.isPaused) buttonRef.focus();
  else buttonRef.blur();
}

function returnToMainMenu() {
  if (isScreenTransitioning) return;
  resetKeyboard();
  stopDeathScreenMusic();
  gameLoop.stop();
  runScreenTransition(showStartScreen);
}

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

function waitForScreenFade() {
  const duration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : SCREEN_FADE_DURATION_MS;
  return new Promise((resolve) => window.setTimeout(resolve, duration));
}

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
