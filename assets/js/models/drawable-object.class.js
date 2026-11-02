const SHEET_CACHE = new Map();

export class DrawableObject {
  img;
  x = 120;
  y = 280;
  width = 70;
  height = 60;
  imageCache = {};
  currentImage = 0;
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

  loadSpriteSheet(path, frameCount, frameSize = 128, frameHeight = frameSize, placement = null, columns = frameCount) {
    const layout = { frameSize, frameHeight, placement, columns, canvasWidth: placement?.width ?? frameSize, canvasHeight: placement?.height ?? frameHeight };
    const cacheId = [path, frameCount, frameSize, frameHeight, layout.canvasWidth, layout.canvasHeight, placement?.x ?? 0, placement?.y ?? 0, columns].join("|");
    if (!SHEET_CACHE.has(cacheId)) SHEET_CACHE.set(cacheId, this.createSharedSheet(path, frameCount, layout));
    const shared = SHEET_CACHE.get(cacheId);
    shared.keys.forEach((key, index) => (this.imageCache[key] = shared.canvases[index]));
    return [...shared.keys];
  }

  createSharedSheet(path, frameCount, layout) {
    const canvases = Array.from({ length: frameCount }, () => this.createFrameCanvas(layout.canvasWidth, layout.canvasHeight));
    const keys = canvases.map((_, index) => `${path}#${index}`);
    const sheet = new Image();
    sheet.onload = () => this.copySheetFrames(sheet, canvases, layout);
    sheet.src = path;
    return { keys, canvases };
  }

  createFrameCanvas(canvasWidth, canvasHeight) {
    const canvasRef = document.createElement("canvas");
    canvasRef.width = canvasWidth;
    canvasRef.height = canvasHeight;
    return canvasRef;
  }

  copySheetFrames(sheet, canvases, { frameSize, frameHeight, placement, columns }) {
    canvases.forEach((canvasRef, index) => {
      const sourceX = (index % columns) * frameSize;
      const sourceY = Math.floor(index / columns) * frameHeight;
      canvasRef.getContext("2d").drawImage(sheet, sourceX, sourceY, frameSize, frameHeight, placement?.x ?? 0, placement?.y ?? 0, frameSize, frameHeight);
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
}
