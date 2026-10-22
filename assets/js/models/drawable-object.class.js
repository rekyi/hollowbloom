class DrawableObject {
  img;
  x = 120;
  y = 280;
  width = 70;
  height = 60;
  imageCache = {};
  currentImage = 0;

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

  loadSpriteSheet(path, frameCount,   frameSize = 128, frameHeight = frameSize) {
    const sheet = new Image();
    const keys = [];
    for (let i = 0; i < frameCount; i++) {
      const canvas = document.createElement("canvas");
      canvas.width = frameSize;
        canvas.height = frameHeight;
      const key = `${path}#${i}`;
      this.imageCache[key] = canvas;
      keys.push(key);
    }
    sheet.onload = () => {
      keys.forEach((key, i) => {
        this.imageCache[key].getContext("2d").drawImage(sheet, i * frameSize, 0, frameSize, frameHeight, 0, 0, frameSize, frameHeight);
      });
    };
    sheet.src = path;
    return keys;
  }

  draw(ctx) {
    if (!this.img || (this.img instanceof HTMLImageElement && (!this.img.complete || this.img.naturalWidth === 0))) return;
    ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
  }

  offset = { top: 0, right: 0, bottom: 0, left: 0 };

  getHitbox() {
    return {
      x: this.x + this.offset.left,
      y: this.y + this.offset.top,
      width: this.width - this.offset.left - this.offset.right,
      height: this.height - this.offset.top - this.offset.bottom,
    };
  }

  drawFrame(ctx) {
    if (this instanceof Character || this instanceof Enemy) {
      const box = this.getHitbox();
      ctx.beginPath();
      ctx.lineWidth = "3";
      ctx.strokeStyle = "white";
      ctx.rect(box.x, box.y, box.width, box.height);
      ctx.stroke();
    }
  }
}
