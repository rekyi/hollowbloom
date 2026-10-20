class Background extends MoveableObect {
  width = 720;
  height = 400;
  constructor(imgPath, x) {
    super();
    this.loadImage(imgPath);
    this.x = x;
    this.y = 480 - this.height;
  }
}
