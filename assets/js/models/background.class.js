class Background extends MoveableObect {
  width = 720;
  height = 400;
  constructor(imgPath, x, y) {
    super();
    this.loadImage(imgPath);
    this.x = x;
    this.y = y;
  }
}
