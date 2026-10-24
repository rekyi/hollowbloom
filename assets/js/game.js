let canvas;
let world;
let keyboard = new Keyboard();
const pressedKeys = new Set();

function init() {
  canvas = document.getElementById("canvas");
}
init();

window.addEventListener("keydown", (event) => {
  if (!world || world.isGameOver) return;
  if (event.code === "Escape") {
    if (!event.repeat) gameLoop.togglePause();
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
  document.getElementById("game-over").hidden = false;
}

document.getElementById("start-button").addEventListener("click", () => {
  document.getElementById("start-screen").hidden = true;
  canvas.classList.add("ready");
  world = new World(canvas, keyboard, showGameOver);
});

document.getElementById("restart-button").addEventListener("click", () => {
  resetKeyboard();
  gameLoop.stop();
  world = new World(canvas, keyboard, showGameOver);
  document.getElementById("game-over").hidden = true;
});

window.addEventListener("blur", resetKeyboard);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) resetKeyboard();
});
