import { EXTRA_ATTACK_COIN_THRESHOLD } from "../data.js";
import { DrawableObject } from "./drawable-object.class.js";

export class StatusBar extends DrawableObject {
  IMAGES = {
    BACKGROUND: "assets/images/7_statusbars/health_bar/background.png",
    HEART: "assets/images/7_statusbars/health_bar/heart.png",
    BORDER: "assets/images/7_statusbars/health_bar/border.png",
  };
  maxHearts = 3;
  hearts = 3;
  coins = 0;
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

  setCoins(coins) {
    this.coins = coins;
  }

  draw(ctx) {
    this.drawHearts(ctx);
    this.drawCoinText(ctx);
  }

  drawHearts(ctx) {
    for (let i = 0; i < this.maxHearts; i++) {
      const x = this.x + i * (this.heartSize + this.heartGap);
      this.drawLayer(ctx, this.IMAGES.BACKGROUND, x);
      if (i < this.hearts) this.drawLayer(ctx, this.IMAGES.HEART, x);
      this.drawLayer(ctx, this.IMAGES.BORDER, x);
    }
  }

  drawCoinText(ctx) {
    const text = `Münzen ${this.coins}/${EXTRA_ATTACK_COIN_THRESHOLD}`;
    ctx.save();
    ctx.fillStyle = "white";
    ctx.strokeStyle = "black";
    ctx.lineWidth = 3;
    ctx.font = "bold 18px monospace";
    ctx.textBaseline = "middle";
    ctx.strokeText(text, 190, 35);
    ctx.fillText(text, 190, 35);
    ctx.restore();
  }

  drawLayer(ctx, path, x) {
    const img = this.imageCache[path];
    if (img && img.complete && img.naturalWidth > 0) {
      ctx.drawImage(img, x, this.y, this.heartSize, this.heartSize);
    }
  }
}
