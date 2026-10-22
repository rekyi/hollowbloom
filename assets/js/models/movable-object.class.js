class MoveableObject extends DrawableObject {
  speed = 0.15;
  oppositeDirection = false;
  speedY = 0;
  acceleration = 2;
  groundLevel = 440;
  hp = 100;
  lastHit = 0;

  isColliding(obj) {
    return this.x < obj.x + obj.width && this.x + this.width > obj.x && this.y < obj.y + obj.height && this.y + this.height > obj.y;
  }

  hit() {
    this.hp -= 10;
    if (this.hp < 0) this.hp = 0;
    else {
      this.lastHit = new Date().getTime();
    }
  }

  gettingHit() {
    let timeSinceLastHit = new Date().getTime() - this.lastHit;
    timeSinceLastHit = timeSinceLastHit / 1000;
    return timeSinceLastHit < 1;
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
