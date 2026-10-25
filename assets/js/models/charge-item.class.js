class ChargeItem extends DrawableObject {
  static FRAME_COUNT = 5;
  collected = false;

  constructor(x) {
    super();
    this.loadImage("assets/images/8_coin/item_charge.png");
    this.x = x;
    this.y = 372;
    this.width = 36;
    this.height = 36;
  }

  draw(ctx) {
    if (!this.img || !this.img.complete || this.img.naturalWidth === 0) return;
    const frameWidth = this.img.naturalWidth / ChargeItem.FRAME_COUNT;
    const frame = Math.floor(gameLoop.now() / 100) % ChargeItem.FRAME_COUNT;
    ctx.drawImage(this.img, frame * frameWidth, 0, frameWidth, this.img.naturalHeight, this.x, this.y, this.width, this.height);
  }
}
