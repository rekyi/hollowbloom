class MoveableObject {
  img;
  x = 120;
  y = 280;
  width = 70;
  height = 60;
  imageCache = {};
  currentImage = 0;
  speed = 0.15;
  oppositeDirection = false;
  speedY = 0;
  acceleration = 2;
  groundLevel = 440;

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

  playAnimation(images) {
    const i = this.currentImage % images.length;
    const path = images[i];
    this.img = this.imageCache[path];
    this.currentImage++;
  }

  moveRight() {
    console.log("moving right");
  }

  moveLeft() {
    setInterval(() => {
      this.x -= this.speed;
    }, 1000 / 60); // is it worth it to increase the fps in this case (120/144)?
  }

  gravity() {
    setInterval(() => {
      const groundY = this.groundLevel - this.height;
      const nextYPosition = this.y - this.speedY;

      if (nextYPosition >= groundY) {
        this.y = groundY;
        this.speedY = 0;
        return;
      }

      this.y = nextYPosition;
      this.speedY -= this.acceleration;
    }, 1000 / 25);
  }

  isAboveGround() {
    return this.y + this.height < this.groundLevel;
  }
}
