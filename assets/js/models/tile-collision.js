import { TILE_SIZE } from "./level.class.js";

export const TILE_SOLID = 1;
export const TILE_HAZARD = 2;
export const TILE_ONEWAY = 3;
const FLOOR_TILES = [TILE_SOLID, TILE_ONEWAY];
const EDGE_EPSILON = 0.01;
const GROUND_PROBE_DISTANCE = 1;
const STEP_HEIGHT = 32;

/**
 * Gets the first tile index covered by a start coordinate.
 * @param {number} start - Start coordinate in pixels.
 * @returns {number} Tile index.
 */
function getFirstTile(start) {
  return Math.floor((start + EDGE_EPSILON) / TILE_SIZE);
}

/**
 * Gets the last tile index covered by an end coordinate.
 * @param {number} end - End coordinate in pixels.
 * @returns {number} Tile index.
 */
function getLastTile(end) {
  return Math.ceil((end - EDGE_EPSILON) / TILE_SIZE) - 1;
}

/**
 * Creates an inclusive range of integers.
 * @param {number} first - First value.
 * @param {number} last - Last value.
 * @returns {number[]} Values from first to last, or an empty array.
 */
function rangeOf(first, last) {
  return Array.from({ length: Math.max(0, last - first + 1) }, (_, index) => first + index);
}

/**
 * Gets the tile columns a box covers.
 * @param {{x: number, width: number}} box - Box in pixels.
 * @returns {number[]} Column indexes.
 */
function getColumns(box) {
  return rangeOf(getFirstTile(box.x), getLastTile(box.x + box.width));
}

/**
 * Gets the tile rows a box covers.
 * @param {{y: number, height: number}} box - Box in pixels.
 * @returns {number[]} Row indexes.
 */
function getRows(box) {
  return rangeOf(getFirstTile(box.y), getLastTile(box.y + box.height));
}

/**
 * Checks whether any tile of the given types lies in an area.
 * @param {Level} level - Level with the collision grid.
 * @param {number[]} columns - Column indexes.
 * @param {number[]} rows - Row indexes.
 * @param {number[]} tileTypes - Tile types to look for.
 * @returns {boolean} True if a matching tile is found.
 */
function isTileInArea(level, columns, rows, tileTypes) {
  return columns.some((column) => rows.some((row) => tileTypes.includes(level.tileAt(column, row))));
}

/**
 * Moves an object horizontally, stepping up small ledges and staying on slopes when grounded.
 * @param {MoveableObject} obj - Object to move.
 * @param {Level} level - Current level.
 * @param {number} dx - Horizontal distance in pixels.
 */
export function moveX(obj, level, dx) {
  if (dx === 0) return;
  const wasGrounded = isGrounded(obj, level);
  slideX(obj, level, dx, wasGrounded);
  if (wasGrounded) snapToGround(obj, level);
}

/**
 * Moves a grounded object horizontally only if it can step up or down onto floor.
 * @param {MoveableObject} obj - Object to move.
 * @param {Level} level - Current level.
 * @param {number} dx - Horizontal distance in pixels.
 * @returns {boolean} True if the object moved.
 */
export function moveXOnGround(obj, level, dx) {
  const box = obj.getHitbox();
  const column = dx > 0 ? getLastTile(box.x + box.width + dx) : getFirstTile(box.x + dx);
  if (isTileInArea(level, [column], getRows(box), [TILE_SOLID])) return stepUp(obj, level, box, column, dx);
  return stepDown(obj, level, box, column, dx);
}

/**
 * Moves the object onto floor at or slightly below its feet in the target column.
 * @param {MoveableObject} obj - Object to move.
 * @param {Level} level - Current level.
 * @param {Object} box - Current hitbox.
 * @param {number} column - Target column.
 * @param {number} dx - Horizontal distance in pixels.
 * @returns {boolean} False if there is no floor within step height.
 */
function stepDown(obj, level, box, column, dx) {
  const row = findGroundRow(level, column, box);
  if (row === undefined) return false;
  obj.x += dx;
  obj.y += row * TILE_SIZE - (box.y + box.height);
  return true;
}

/**
 * Finds the floor row below a box within step height in one column.
 * @param {Level} level - Current level.
 * @param {number} column - Column to search.
 * @param {Object} box - Hitbox.
 * @returns {number|undefined} Floor row, or undefined if none or a hazard is found.
 */
function findGroundRow(level, column, box) {
  const bottom = box.y + box.height;
  const rows = rangeOf(getLastTile(bottom) + 1, Math.floor((bottom + STEP_HEIGHT) / TILE_SIZE));
  const row = rows.find((candidate) => level.tileAt(column, candidate) !== 0);
  return FLOOR_TILES.includes(level.tileAt(column, row)) ? row : undefined;
}

/**
 * Checks whether an object stands on the ground and is not rising.
 * @param {MoveableObject} obj - Object to check.
 * @param {Level} level - Current level.
 * @returns {boolean} True if grounded.
 */
function isGrounded(obj, level) {
  return obj.speedY <= 0 && hasGroundBelow(obj, level);
}

/**
 * Moves an object horizontally until it hits a wall, stepping up if allowed.
 * @param {MoveableObject} obj - Object to move.
 * @param {Level} level - Current level.
 * @param {number} dx - Horizontal distance in pixels.
 * @param {boolean} canStep - Whether stepping up ledges is allowed.
 */
function slideX(obj, level, dx, canStep) {
  const box = obj.getHitbox();
  const column = dx > 0 ? getLastTile(box.x + box.width + dx) : getFirstTile(box.x + dx);
  if (!isTileInArea(level, [column], getRows(box), [TILE_SOLID])) {
    obj.x += dx;
    return;
  }
  if (canStep && stepUp(obj, level, box, column, dx)) return;
  obj.x += getWallDistance(box, column, dx);
}

/**
 * Gets the distance from a box to a wall column.
 * @param {Object} box - Hitbox.
 * @param {number} column - Wall column.
 * @param {number} dx - Movement direction.
 * @returns {number} Distance in pixels, signed by direction.
 */
function getWallDistance(box, column, dx) {
  return dx > 0 ? column * TILE_SIZE - (box.x + box.width) : (column + 1) * TILE_SIZE - box.x;
}

/**
 * Moves the object up onto a ledge if it is low enough and the space is free.
 * @param {MoveableObject} obj - Object to move.
 * @param {Level} level - Current level.
 * @param {Object} box - Current hitbox.
 * @param {number} column - Ledge column.
 * @param {number} dx - Horizontal distance in pixels.
 * @returns {boolean} True if the step succeeded.
 */
function stepUp(obj, level, box, column, dx) {
  const rise = getStepRise(level, box, column);
  if (rise > STEP_HEIGHT) return false;
  const target = { ...box, x: box.x + dx, y: box.y - rise };
  if (isTileInArea(level, getColumns(target), getRows(target), [TILE_SOLID])) return false;
  obj.x += dx;
  obj.y -= rise;
  return true;
}

/**
 * Gets how far a box must rise to stand on top of a ledge column.
 * @param {Level} level - Current level.
 * @param {Object} box - Hitbox.
 * @param {number} column - Ledge column.
 * @returns {number} Rise in pixels.
 */
function getStepRise(level, box, column) {
  const topRow = getRows(box).find((row) => level.tileAt(column, row) === TILE_SOLID);
  return box.y + box.height - topRow * TILE_SIZE;
}

/**
 * Moves an object down onto floor within step height if it lost the ground.
 * @param {MoveableObject} obj - Object to snap.
 * @param {Level} level - Current level.
 */
function snapToGround(obj, level) {
  if (hasGroundBelow(obj, level)) return;
  const box = obj.getHitbox();
  const row = findFloorRow(level, box, STEP_HEIGHT);
  if (row !== undefined) obj.y += row * TILE_SIZE - (box.y + box.height);
}

/**
 * Moves an object vertically and stops it at floors or ceilings.
 * @param {MoveableObject} obj - Object to move.
 * @param {Level} level - Current level.
 * @param {number} dy - Vertical distance in pixels, positive is down.
 * @returns {boolean} True if the movement was blocked.
 */
export function moveY(obj, level, dy) {
  const box = obj.getHitbox();
  const row = dy > 0 ? findFloorRow(level, box, dy) : findCeilingRow(level, box, dy);
  if (row === undefined) {
    obj.y += dy;
    return false;
  }
  obj.y += dy > 0 ? row * TILE_SIZE - (box.y + box.height) : (row + 1) * TILE_SIZE - box.y;
  return true;
}

/**
 * Finds the first floor row a box would land on when moving down.
 * @param {Level} level - Current level.
 * @param {Object} box - Hitbox.
 * @param {number} dy - Downward distance in pixels.
 * @returns {number|undefined} Floor row, or undefined if none.
 */
function findFloorRow(level, box, dy) {
  const bottom = box.y + box.height;
  const columns = getColumns(box);
  const rows = rangeOf(getLastTile(bottom) + 1, getLastTile(bottom + dy));
  return rows.find((row) => isTileInArea(level, columns, [row], FLOOR_TILES));
}

/**
 * Finds the first solid row a box would hit when moving up.
 * @param {Level} level - Current level.
 * @param {Object} box - Hitbox.
 * @param {number} dy - Upward distance in pixels (negative).
 * @returns {number|undefined} Ceiling row, or undefined if none.
 */
function findCeilingRow(level, box, dy) {
  const columns = getColumns(box);
  const rows = rangeOf(getFirstTile(box.y + dy), getFirstTile(box.y) - 1).reverse();
  return rows.find((row) => isTileInArea(level, columns, [row], [TILE_SOLID]));
}

/**
 * Checks whether there is floor directly below an object.
 * @param {MoveableObject} obj - Object to check.
 * @param {Level} level - Current level.
 * @returns {boolean} True if the object stands on floor.
 */
export function hasGroundBelow(obj, level) {
  return findFloorRow(level, obj.getHitbox(), GROUND_PROBE_DISTANCE) !== undefined;
}

/**
 * Checks whether an object's hitbox overlaps a tile type.
 * @param {MoveableObject} obj - Object to check.
 * @param {Level} level - Current level.
 * @param {number} tileType - Tile type, e.g. TILE_HAZARD.
 * @returns {boolean} True if overlapping.
 */
export function isTouchingTile(obj, level, tileType) {
  const box = obj.getHitbox();
  return isTileInArea(level, getColumns(box), getRows(box), [tileType]);
}

/**
 * Gets the top edge of the highest overlapped tile row of a type.
 * @param {MoveableObject} obj - Object to check.
 * @param {Level} level - Current level.
 * @param {number} tileType - Tile type.
 * @returns {number} Y coordinate of the tile row top.
 */
export function getTouchedTileTop(obj, level, tileType) {
  const box = obj.getHitbox();
  const columns = getColumns(box);
  const row = getRows(box).find((candidate) => isTileInArea(level, columns, [candidate], [tileType]));
  return row * TILE_SIZE;
}
