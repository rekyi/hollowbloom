class MoveableObect {
  img;
  x = 120;
  y = 300;
  width = 100;
  height = 150;

  loadImage(path) {
    this.img = new Image();
    this.img.src = path;
  }

  moveRight() {
    console.log("moving right");
  }

  moveLeft() {
    console.log("moving left");
  }
}
