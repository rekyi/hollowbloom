let canvas;
let world;
let keyboard = new Keyboard();

function init() {
  canvas = document.getElementById("canvas");
  world = new World(canvas, keyboard);
}
init();

window.addEventListener("keydown", (event) => {
  if (event.code === "ArrowRight" || event.code === "KeyD") {
    keyboard.RIGHT = true;
  }
  if (event.code === "ArrowLeft" || event.code === "KeyA") {
    keyboard.LEFT = true;
  }
  if (event.code === "ArrowUp") {
    keyboard.UP = true;
  }
  if (event.code === "ArrowDown") {
    keyboard.DOWN = true;
  }
  if (event.code === "KeyF") {
    keyboard.THROW = true;
    if (!event.repeat) {
      world.throwBottle();
    }
  }
  if (event.code === "ArrowUp" || event.code === "Space") {
    event.preventDefault();
    keyboard.SPACE = true;
    if (!event.repeat) {
      world.character.jump();
    }
  }
  if (event.code === "KeyF") {
    keyboard.THROW = true;
  }
});

window.addEventListener("keyup", (event) => {
  if (event.code === "ArrowRight" || event.code === "KeyD") {
    keyboard.RIGHT = false;
  }
  if (event.code === "ArrowLeft" || event.code === "KeyA") {
    keyboard.LEFT = false;
  }
  if (event.code === "ArrowUp") {
    keyboard.UP = false;
  }
  if (event.code === "ArrowDown") {
    keyboard.DOWN = false;
  }
  if (event.code === "KeyF") {
    keyboard.THROW = false;
  }
  if (event.code === "KeyW") {
    keyboard.UP = false;
  }
  if (event.code === "Space" || event.code === "ArrowUp") {
    keyboard.SPACE = false;
  }
  if (event.code === "KeyF") {
    keyboard.THROW = false;
  }
});
