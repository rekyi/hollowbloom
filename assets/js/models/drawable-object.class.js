const SHEET_CACHE = new Map();

/** Base class for objects with a position, size and image that can be drawn on the canvas. */
export class DrawableObject {
  img;
  x = 120;
  y = 280;
  width = 70;
  height = 60;
  imageCache = {};
  currentImage = 0;
  isSpriteDirectionInverted = false;

  /**
   * Loads a single image as the current image.
   * @param {string} path - Image path.
   */
  loadImage(path) {
    this.img = new Image();
    this.img.src = path;
  }

  /**
   * Loads several images into the image cache, keyed by path.
   * @param {string[]} arr - Image paths.
   */
  loadImages(arr) {
    arr.forEach((path) => {
      const img = new Image();
      img.src = path;
      this.imageCache[path] = img;
    });
  }

  /**
   * Splits a sprite sheet into frame canvases, shared across instances, and adds them to the image cache.
   * @param {string} path - Sprite sheet path.
   * @param {number} frameCount - Number of frames.
   * @param {number} [frameSize=128] - Frame width in the sheet.
   * @param {number} [frameHeight=frameSize] - Frame height in the sheet.
   * @param {?{x: number, y: number, width: number, height: number}} [placement=null] - Optional target canvas size and frame offset.
   * @param {number} [columns=frameCount] - Frames per row in the sheet.
   * @returns {string[]} Image cache keys of the frames.
   */
  loadSpriteSheet(path, frameCount, frameSize = 128, frameHeight = frameSize, placement = null, columns = frameCount) {
    const layout = { frameSize, frameHeight, placement, columns, canvasWidth: placement?.width ?? frameSize, canvasHeight: placement?.height ?? frameHeight };
    const cacheId = [path, frameCount, frameSize, frameHeight, layout.canvasWidth, layout.canvasHeight, placement?.x ?? 0, placement?.y ?? 0, columns].join("|");
    if (!SHEET_CACHE.has(cacheId)) SHEET_CACHE.set(cacheId, this.createSharedSheet(path, frameCount, layout));
    const shared = SHEET_CACHE.get(cacheId);
    shared.keys.forEach((key, index) => (this.imageCache[key] = shared.canvases[index]));
    return [...shared.keys];
  }

  /**
   * Creates empty frame canvases and fills them once the sheet has loaded.
   * @param {string} path - Sprite sheet path.
   * @param {number} frameCount - Number of frames.
   * @param {Object} layout - Frame size, placement, columns and canvas size.
   * @returns {{keys: string[], canvases: HTMLCanvasElement[]}} Frame keys and canvases.
   */
  createSharedSheet(path, frameCount, layout) {
    const canvases = Array.from({ length: frameCount }, () => this.createFrameCanvas(layout.canvasWidth, layout.canvasHeight));
    const keys = canvases.map((_, index) => `${path}#${index}`);
    const sheet = new Image();
    sheet.onload = () => this.copySheetFrames(sheet, canvases, layout);
    sheet.src = path;
    return { keys, canvases };
  }

  /**
   * Creates an empty canvas for one frame.
   * @param {number} canvasWidth - Canvas width.
   * @param {number} canvasHeight - Canvas height.
   * @returns {HTMLCanvasElement} The canvas.
   */
  createFrameCanvas(canvasWidth, canvasHeight) {
    const canvasRef = document.createElement("canvas");
    canvasRef.width = canvasWidth;
    canvasRef.height = canvasHeight;
    return canvasRef;
  }

  /**
   * Copies each frame of a loaded sheet onto its canvas.
   * @param {HTMLImageElement} sheet - Loaded sprite sheet.
   * @param {HTMLCanvasElement[]} canvases - Target frame canvases.
   * @param {Object} layout - Frame size, frame height, placement and columns.
   */
  copySheetFrames(sheet, canvases, { frameSize, frameHeight, placement, columns }) {
    canvases.forEach((canvasRef, index) => {
      const sourceX = (index % columns) * frameSize;
      const sourceY = Math.floor(index / columns) * frameHeight;
      canvasRef.getContext("2d").drawImage(sheet, sourceX, sourceY, frameSize, frameHeight, placement?.x ?? 0, placement?.y ?? 0, frameSize, frameHeight);
    });
  }

  /**
   * Draws the current image if it is ready.
   * @param {CanvasRenderingContext2D} ctx - Target canvas context.
   */
  draw(ctx) {
    if (!this.img || (this.img instanceof HTMLImageElement && (!this.img.complete || this.img.naturalWidth === 0))) return;
    ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
  }

  offset = { top: 0, right: 0, bottom: 0, left: 0 };

  /**
   * Gets the hitbox based on the object's offset.
   * @returns {{x: number, y: number, width: number, height: number}} The hitbox.
   */
  getHitbox() {
    return this.getHitboxFor(this.offset);
  }

  /**
   * Gets a hitbox for an offset, mirrored horizontally when facing the opposite direction.
   * @param {{top: number, right: number, bottom: number, left: number}} offset - Insets from the object bounds.
   * @returns {{x: number, y: number, width: number, height: number}} The hitbox.
   */
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
