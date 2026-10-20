let canvas;
let ctx;
let character = new Character();

function init() {
  canvas = document.getElementById("canvas");
  ctx = canvas.getContext("2d");

  console.log("my character is", character);
}
init();
