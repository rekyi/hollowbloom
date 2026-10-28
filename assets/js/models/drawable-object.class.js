export class DrawableObject {
  img;
  x = 120;
  y = 280;
  width = 70;
  height = 60;
  imageCache = {};
  currentImage = 0;
  drawHitbox = false;
  isSpriteDirectionInverted = false;

  loadImage(path) {
    this.img = new Image();
    this.img.src = path;
  }

  loadImages(arr) {
    arr.forEach((path) => {
      const img = new Image();
      img.src = path;
      this.imageCache[path] = img;
    });
  }

  loadSpriteSheet(path, frameCount, frameSize = 128, frameHeight = frameSize, placement = null) {
    const sheet = new Image();
    const keys = this.createFrameCanvases(path, frameCount, placement?.width ?? frameSize, placement?.height ?? frameHeight);
    sheet.onload = () => this.copySheetFrames(sheet, keys, frameSize, frameHeight, placement);
    sheet.src = path;
    return keys;
  }

  createFrameCanvases(path, frameCount, canvasWidth, canvasHeight) {
    return Array.from({ length: frameCount }, (_, index) => {
      const canvasRef = document.createElement("canvas");
      canvasRef.width = canvasWidth;
      canvasRef.height = canvasHeight;
      const key = `${path}#${index}`;
      this.imageCache[key] = canvasRef;
      return key;
    });
  }

  copySheetFrames(sheet, keys, frameSize, frameHeight, placement = null) {
    keys.forEach((key, index) => {
      this.imageCache[key].getContext("2d").drawImage(sheet, index * frameSize, 0, frameSize, frameHeight, placement?.x ?? 0, placement?.y ?? 0, frameSize, frameHeight);
    });
  }

  draw(ctx) {
    if (!this.img || (this.img instanceof HTMLImageElement && (!this.img.complete || this.img.naturalWidth === 0))) return;
    ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
  }

  offset = { top: 0, right: 0, bottom: 0, left: 0 };

  getHitbox() {
    return this.getHitboxFor(this.offset);
  }

  getHitboxFor(offset) {
    const left = this.isOppositeDirection ? offset.right : offset.left;
    const right = this.isOppositeDirection ? offset.left : offset.right;
    return {
      x: this.x + left,
      y: this.y + offset.top,
      width: this.width - left - right,
      height: this.height - offset.top - offset.bottom,
    };
  }

  drawFrame(ctx) {
    if (!this.drawHitbox) return;
    const box = this.getHitbox();
    ctx.beginPath();
    ctx.lineWidth = "3";
    ctx.strokeStyle = "white";
    ctx.rect(box.x, box.y, box.width, box.height);
    ctx.stroke();
  }
}
