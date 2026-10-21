class MoveableObject {
  img;
  x = 120;
  y = 280;
  width = 70;
  height = 60;
  imageCache = {};
  currentImage = 0;
  speed = 0.15;

  loadImage(path) {
    this.img = new Image();
    this.img.src = path;
  }

  loadImages(arr) {
    arr.forEach((path) => {
      let img = new Image();
      img.src = path;
      this.imageCache[path] = img;
    });
  }

  moveRight() {
    console.log("moving right");
  }

  moveLeft() {
    setInterval(() => {
      this.x -= this.speed;
    }, 1000 / 60); // is it worth it to increase the fps in this case (120/144)?
  }
}
