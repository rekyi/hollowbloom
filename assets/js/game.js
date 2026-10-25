let canvas;
let world;
let keyboard = new Keyboard();
let selectedCharacterClass = FemaleCharacter;
const pressedKeys = new Set();

function init() {
  canvas = document.getElementById("canvas");
}
init();

window.addEventListener("keydown", (event) => {
  if (!world || world.isGameOver) return;
  if (event.code === "Escape") {
    if (!event.repeat) {
      gameLoop.togglePause();
      syncPauseScreen();
    }
    return;
  }
  if (gameLoop.isPaused) return;

  pressedKeys.add(event.code);
  updateKeyboardState();
  if (["ArrowLeft", "ArrowRight", "ArrowUp", "KeyA", "KeyD", "Space", "KeyF", "KeyJ"].includes(event.code)) {
    world.startTimer();
  }
  if (event.code === "KeyF" || event.code === "KeyJ") {
    if (!event.repeat) {
      world.character.attack();
    }
  }
  if (event.code === "ArrowUp" || event.code === "Space") {
    event.preventDefault();
    if (!event.repeat) {
      world.character.jump();
    }
  }
});

window.addEventListener("keyup", (event) => {
  pressedKeys.delete(event.code);
  updateKeyboardState();
});

function updateKeyboardState() {
  keyboard.RIGHT = pressedKeys.has("ArrowRight") || pressedKeys.has("KeyD");
  keyboard.LEFT = pressedKeys.has("ArrowLeft") || pressedKeys.has("KeyA");
  keyboard.SPACE = pressedKeys.has("ArrowUp") || pressedKeys.has("Space");
  keyboard.SHIFT = pressedKeys.has("ShiftLeft") || pressedKeys.has("ShiftRight");
}

function resetKeyboard() {
  pressedKeys.clear();
  updateKeyboardState();
  keyboard.UP = false;
  keyboard.DOWN = false;
}

function showGameOver() {
  const characterCanvas = document.getElementById("game-over-character");
  const characterContext = characterCanvas.getContext("2d");
  const character = world.character;
  characterContext.clearRect(0, 0, characterCanvas.width, characterCanvas.height);
  characterContext.drawImage(
    character.img,
    (characterCanvas.width - character.width) / 2,
    characterCanvas.height * 0.39,
    character.width,
    character.height,
  );
  document.getElementById("game-over").hidden = false;
}

function startGame() {
  resetKeyboard();
  gameLoop.stop();
  document.getElementById("start-screen").hidden = true;
  document.getElementById("pause-screen").hidden = true;
  document.getElementById("game-over").hidden = true;
  canvas.classList.add("ready");
  world = new World(canvas, keyboard, showGameOver, selectedCharacterClass);
}

function syncPauseScreen() {
  const pauseScreen = document.getElementById("pause-screen");
  pauseScreen.hidden = !gameLoop.isPaused;
  if (gameLoop.isPaused) {
    document.getElementById("pause-main-menu-button").focus();
  } else {
    document.getElementById("pause-main-menu-button").blur();
  }
}

function returnToMainMenu() {
  resetKeyboard();
  gameLoop.stop();
  world = null;
  document.getElementById("pause-screen").hidden = true;
  document.getElementById("game-over").hidden = true;
  canvas.classList.remove("ready");
  document.getElementById("start-screen").hidden = false;
  document.getElementById("start-button").focus();
}

function initCharacterSelection() {
  const choices = document.querySelectorAll(".character-choice");
  choices.forEach((choice) => {
    choice.addEventListener("click", () => {
      selectedCharacterClass = choice.dataset.character === "male" ? MaleCharacter : FemaleCharacter;
      choices.forEach((option) => {
        const isSelected = option === choice;
        option.classList.toggle("selected", isSelected);
        option.setAttribute("aria-pressed", String(isSelected));
      });
    });
  });
}
initCharacterSelection();

document.getElementById("start-button").addEventListener("click", () => {
  startGame();
});

function initDialog(buttonId, dialogId, titleId, backId) {
  const dialog = document.getElementById(dialogId);
  const button = document.getElementById(buttonId);

  button.addEventListener("click", () => {
    dialog.showModal();
    document.getElementById(titleId).focus();
  });

  document.getElementById(backId).addEventListener("click", () => dialog.close());

  dialog.addEventListener("click", onBackdropClick);
}

function onBackdropClick(event) {
  const dialogRef = event.currentTarget;

  if (event.target === dialogRef) {
    dialogRef.close();
  }
}

initDialog("credits-button", "credits-overlay", "credits-title", "credits-back-button");
initDialog("imprint-button", "imprint-overlay", "imprint-title", "imprint-back-button");
initDialog("settings-button", "settings-overlay", "settings-title", "settings-back-button");

document.getElementById("restart-button").addEventListener("click", () => {
  startGame();
});

document.getElementById("main-menu-button").addEventListener("click", returnToMainMenu);
document.getElementById("pause-main-menu-button").addEventListener("click", returnToMainMenu);

window.addEventListener("blur", resetKeyboard);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) resetKeyboard();
});
