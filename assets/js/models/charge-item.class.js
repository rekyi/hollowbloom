class ChargeItem extends DrawableObject {
  frameCount = 5;
  width = 36;
  height = 36;

  constructor(x, y) {
    super();
    this.x = x;
    this.y = y;
    this.loadImage("assets/images/8_coin/item_charge.png");
  }

  draw(ctx) {
    if (!this.img || !this.img.complete || this.img.naturalWidth === 0) return;
    const frameWidth = this.img.naturalWidth / this.frameCount;
    const frame = Math.floor(gameLoop.now() / 120) % this.frameCount;
    ctx.drawImage(this.img, frame * frameWidth, 0, frameWidth, this.img.naturalHeight, this.x, this.y, this.width, this.height);
  }
}
