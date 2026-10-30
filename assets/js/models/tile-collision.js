import { TILE_SIZE } from "./level.class.js";

export const TILE_SOLID = 1;
export const TILE_HAZARD = 2;
export const TILE_ONEWAY = 3;
const FLOOR_TILES = [TILE_SOLID, TILE_ONEWAY];
const EDGE_EPSILON = 0.01;
const GROUND_PROBE_DISTANCE = 1;
const STEP_HEIGHT = 32;

function getFirstTile(start) {
  return Math.floor((start + EDGE_EPSILON) / TILE_SIZE);
}

function getLastTile(end) {
  return Math.ceil((end - EDGE_EPSILON) / TILE_SIZE) - 1;
}

function rangeOf(first, last) {
  return Array.from({ length: Math.max(0, last - first + 1) }, (_, index) => first + index);
}

function getColumns(box) {
  return rangeOf(getFirstTile(box.x), getLastTile(box.x + box.width));
}

function getRows(box) {
  return rangeOf(getFirstTile(box.y), getLastTile(box.y + box.height));
}

function isTileInArea(level, columns, rows, tileTypes) {
  return columns.some((column) => rows.some((row) => tileTypes.includes(level.tileAt(column, row))));
}

export function moveX(obj, level, dx) {
  if (dx === 0) return;
  const wasGrounded = isGrounded(obj, level);
  slideX(obj, level, dx, wasGrounded);
  if (wasGrounded) snapToGround(obj, level);
}

export function moveXOnGround(obj, level, dx) {
  const box = obj.getHitbox();
  const column = dx > 0 ? getLastTile(box.x + box.width + dx) : getFirstTile(box.x + dx);
  if (isTileInArea(level, [column], getRows(box), [TILE_SOLID])) return stepUp(obj, level, box, column, dx);
  return stepDown(obj, level, box, column, dx);
}

function stepDown(obj, level, box, column, dx) {
  const row = findGroundRow(level, column, box);
  if (row === undefined) return false;
  obj.x += dx;
  obj.y += row * TILE_SIZE - (box.y + box.height);
  return true;
}

function findGroundRow(level, column, box) {
  const bottom = box.y + box.height;
  const rows = rangeOf(getLastTile(bottom) + 1, Math.floor((bottom + STEP_HEIGHT) / TILE_SIZE));
  const row = rows.find((candidate) => level.tileAt(column, candidate) !== 0);
  return FLOOR_TILES.includes(level.tileAt(column, row)) ? row : undefined;
}

function isGrounded(obj, level) {
  return obj.speedY <= 0 && hasGroundBelow(obj, level);
}

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

function getWallDistance(box, column, dx) {
  return dx > 0 ? column * TILE_SIZE - (box.x + box.width) : (column + 1) * TILE_SIZE - box.x;
}

function stepUp(obj, level, box, column, dx) {
  const rise = getStepRise(level, box, column);
  if (rise > STEP_HEIGHT) return false;
  const target = { ...box, x: box.x + dx, y: box.y - rise };
  if (isTileInArea(level, getColumns(target), getRows(target), [TILE_SOLID])) return false;
  obj.x += dx;
  obj.y -= rise;
  return true;
}

function getStepRise(level, box, column) {
  const topRow = getRows(box).find((row) => level.tileAt(column, row) === TILE_SOLID);
  return box.y + box.height - topRow * TILE_SIZE;
}

function snapToGround(obj, level) {
  if (hasGroundBelow(obj, level)) return;
  const box = obj.getHitbox();
  const row = findFloorRow(level, box, STEP_HEIGHT);
  if (row !== undefined) obj.y += row * TILE_SIZE - (box.y + box.height);
}

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

function findFloorRow(level, box, dy) {
  const bottom = box.y + box.height;
  const columns = getColumns(box);
  const rows = rangeOf(getLastTile(bottom) + 1, getLastTile(bottom + dy));
  return rows.find((row) => isTileInArea(level, columns, [row], FLOOR_TILES));
}

function findCeilingRow(level, box, dy) {
  const columns = getColumns(box);
  const rows = rangeOf(getFirstTile(box.y + dy), getFirstTile(box.y) - 1).reverse();
  return rows.find((row) => isTileInArea(level, columns, [row], [TILE_SOLID]));
}

export function hasGroundBelow(obj, level) {
  return findFloorRow(level, obj.getHitbox(), GROUND_PROBE_DISTANCE) !== undefined;
}

export function isTouchingTile(obj, level, tileType) {
  const box = obj.getHitbox();
  return isTileInArea(level, getColumns(box), getRows(box), [tileType]);
}
