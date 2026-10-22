class MoveableObject extends DrawableObject {
  speed = 0.15;
  oppositeDirection = false;
  speedY = 0;
  acceleration = 2;
  groundLevel = 440;
  hp = 3;
  lastHit = 0;

  isColliding(obj) {
    const a = this.getHitbox();
    const b = obj.getHitbox();
    return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
  }

  hit() {
    if (this.isDead()) return;
    this.hp--;
    this.lastHit = new Date().getTime();
  }

  gettingHit() {
    let timeSinceLastHit = new Date().getTime() - this.lastHit;
    timeSinceLastHit = timeSinceLastHit / 1000;
    return timeSinceLastHit < 1;
  }

  isDead() {
    return this.hp <= 0;
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
      this.speedY = 20;
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
