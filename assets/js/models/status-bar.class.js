class StatusBar extends DrawableObject {
  IMAGES = {
    BACKGROUND: "assets/images/7_statusbars/health_bar/background.png",
    HEART: "assets/images/7_statusbars/health_bar/heart.png",
    BORDER: "assets/images/7_statusbars/health_bar/border.png",
  };
  maxHearts = 3;
  hearts = 3;
  heartSize = 40;
  heartGap = 5;

  constructor() {
    super();
    this.x = 15;
    this.y = 15;
    this.loadImages(Object.values(this.IMAGES));
  }

  setHearts(hearts) {
    this.hearts = Math.max(0, Math.min(this.maxHearts, hearts));
  }

  draw(ctx) {
    for (let i = 0; i < this.maxHearts; i++) {
      const x = this.x + i * (this.heartSize + this.heartGap);
      this.drawLayer(ctx, this.IMAGES.BACKGROUND, x);
      if (i < this.hearts) this.drawLayer(ctx, this.IMAGES.HEART, x);
      this.drawLayer(ctx, this.IMAGES.BORDER, x);
    }
  }

  drawLayer(ctx, path, x) {
    const img = this.imageCache[path];
    if (img && img.complete && img.naturalWidth > 0) {
      ctx.drawImage(img, x, this.y, this.heartSize, this.heartSize);
    }
  }
}
