const SHEET_CACHE = new Map();
const IMAGE_CACHE = new Map();
const pendingImageLoads = new Set();

/**
 * Waits until all images requested so far have loaded or failed.
 * @returns {Promise<void>} Resolves when no requested image is pending anymore.
 */
export async function waitForPendingImages() {
  await Promise.all([...pendingImageLoads]);
}

/**
 * Gets an image shared across all objects and starts loading it on first request.
 * @param {string} path - Image path.
 * @returns {HTMLImageElement} The shared image.
 */
export function getSharedImage(path) {
  if (!IMAGE_CACHE.has(path)) IMAGE_CACHE.set(path, createTrackedImage(path));
  return IMAGE_CACHE.get(path);
}

/**
 * Creates an image whose loading is tracked until it is decoded and handled.
 * @param {string} path - Image path.
 * @param {Function} [onLoad] - Called with the decoded image.
 * @returns {HTMLImageElement} The image.
 */
function createTrackedImage(path, onLoad = () => {}) {
  const image = new Image();
  image.src = path;
  const loadPromise = decodeImage(image).then(() => onLoad(image)).catch((error) => console.error(`Image could not be loaded: ${path}`, error));
  pendingImageLoads.add(loadPromise);
  loadPromise.finally(() => pendingImageLoads.delete(loadPromise));
  return image;
}

/**
 * Decodes an image ahead of drawing and accepts it if it loaded although decoding was rejected.
 * @param {HTMLImageElement} image - Image with a source.
 * @returns {Promise<void>} Resolves when the image can be drawn.
 * @throws {Error} If the image cannot be loaded.
 */
async function decodeImage(image) {
  try {
    await image.decode();
  } catch (error) {
    if (!isImageReady(image)) throw error;
  }
}

/**
 * Checks whether an image has loaded and can be drawn.
 * @param {HTMLImageElement} image - Image to check.
 * @returns {boolean} True if the image is ready.
 */
function isImageReady(image) {
  return image.complete && image.naturalWidth > 0;
}

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
   * Loads a single shared image as the current image.
   * @param {string} path - Image path.
   */
  loadImage(path) {
    this.img = getSharedImage(path);
  }

  /**
   * Loads several shared images into the image cache, keyed by path.
   * @param {string[]} arr - Image paths.
   */
  loadImages(arr) {
    arr.forEach((path) => {
      this.imageCache[path] = getSharedImage(path);
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
   * Adds the frames of a sprite sheet to the image cache as regions of the shared sheet.
   * They are drawn straight from the sheet instead of being copied onto frame canvases, which saves memory for large sheets.
   * @param {string} path - Sprite sheet path.
   * @param {number} frameCount - Number of frames.
   * @param {number} frameWidth - Frame width in the sheet.
   * @param {number} frameHeight - Frame height in the sheet.
   * @param {number} [columns=frameCount] - Frames per row in the sheet.
   * @returns {string[]} Image cache keys of the frames.
   */
  loadSpriteSheetRegions(path, frameCount, frameWidth, frameHeight, columns = frameCount) {
    const sheet = getSharedImage(path);
    return Array.from({ length: frameCount }, (_, index) => {
      const key = `${path}#${index}`;
      this.imageCache[key] = { sheet, sourceX: (index % columns) * frameWidth, sourceY: Math.floor(index / columns) * frameHeight, width: frameWidth, height: frameHeight };
      return key;
    });
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
    createTrackedImage(path, (sheet) => this.copySheetFrames(sheet, canvases, layout));
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
   * Draws the current image or sheet region if it is ready.
   * @param {CanvasRenderingContext2D} ctx - Target canvas context.
   */
  draw(ctx) {
    if (this.img?.sheet) return this.drawSheetRegion(ctx, this.img);
    if (!this.img || (this.img instanceof HTMLImageElement && !isImageReady(this.img))) return;
    ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
  }

  /**
   * Draws a frame straight from its sprite sheet if the sheet is ready.
   * @param {CanvasRenderingContext2D} ctx - Target canvas context.
   * @param {{sheet: HTMLImageElement, sourceX: number, sourceY: number, width: number, height: number}} region - Frame region in the sheet.
   */
  drawSheetRegion(ctx, { sheet, sourceX, sourceY, width, height }) {
    if (!isImageReady(sheet)) return;
    ctx.drawImage(sheet, sourceX, sourceY, width, height, this.x, this.y, this.width, this.height);
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
