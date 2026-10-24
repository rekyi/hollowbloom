let canvas;
let world;
let keyboard = new Keyboard();
const pressedKeys = new Set();

function init() {
  canvas = document.getElementById("canvas");
  world = new World(canvas, keyboard);
}
init();

window.addEventListener("load", () => canvas.classList.add("ready"));

window.addEventListener("keydown", (event) => {
  if (event.code === "Escape") {
    if (!event.repeat) gameLoop.togglePause();
    return;
  }
  if (gameLoop.isPaused) return;

  pressedKeys.add(event.code);
  updateKeyboardState();
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

window.addEventListener("blur", resetKeyboard);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) resetKeyboard();
});
