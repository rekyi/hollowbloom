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
  hp = 100;

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

  draw(ctx) {
    ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
  }

  drawFrame(ctx) {
    if (this instanceof Character || this instanceof Chicken) {
      ctx.beginPath();
      ctx.lineWidth = "3";
      ctx.strokeStyle = "white";
      ctx.rect(this.x, this.y, this.width, this.height);
      ctx.stroke();
    }
  }

  isColliding(obj) {
    return this.x < obj.x + obj.width && this.x + this.width > obj.x && this.y < obj.y + obj.height && this.y + this.height > obj.y;
  }

  hit() {
    this.hp -= 50;
    if (this.hp < 0) this.hp = 0;
  }

  isDead() {
    return this.hp == 0;
  }

  playAnimation(images) {
    const i = this.currentImage % images.length;
    const path = images[i];
    this.img = this.imageCache[path];
    this.currentImage++;
  }

  moveRight() {
    this.x += this.speed;
    this.oppositeDirection = false;
  }

  moveLeft() {
    this.x -= this.speed;
    this.oppositeDirection = true;
  }

  jump() {
    if (!this.isAboveGround()) {
      this.speedY = 25;
    }
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
