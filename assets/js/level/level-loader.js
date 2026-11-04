import { ChargeItem } from "../models/charge-item.class.js";
import { DarkElf, Boar, Skeleton } from "../models/enemies.class.js";
import { ExitPortal } from "../models/exit-portal.class.js";
import { Checkpoint } from "../models/checkpoint.class.js";
import { HealingPlant } from "../models/healing-plant.class.js";
import { KeyItem } from "../models/key-item.class.js";
import { Level, COLLISION_TILE_SIZE, TILE_SIZE, getEntityBox, placeOnEntity } from "../models/level.class.js";
import { VerdanBoss } from "../models/verdan-boss.class.js";
import { preloadVerdanSheets } from "../models/verdan-base.class.js";
import { LEVEL_COUNT, LEVEL_FOLDERS } from "../data.js";

const ENEMY_CLASSES = { Boar, DarkElf, Skeleton };
const ENEMY_ORDER = [DarkElf, Skeleton, Boar];
const levelAssetsPromises = new Map();

/**
 * Loads the assets of a level once and caches the promise.
 * @param {number} levelIndex - Zero-based level index.
 * @returns {Promise<{data: Object, layers: Array<{name: string, image: ImageBitmap}>, collisionGrid: number[][]}>} The level assets.
 */
export function loadLevelAssets(levelIndex) {
  if (levelAssetsPromises.has(levelIndex)) return levelAssetsPromises.get(levelIndex);
  const levelAssetsPromise = fetchLevelAssets(getLevelFolderUrl(levelIndex)).catch((error) => {
    levelAssetsPromises.delete(levelIndex);
    throw error;
  });
  levelAssetsPromises.set(levelIndex, levelAssetsPromise);
  return levelAssetsPromise;
}

/**
 * Removes cached level assets and frees their layer bitmaps.
 * @param {number[]} keptLevelIndexes - Level indexes whose assets stay cached.
 */
export function releaseLevelAssets(keptLevelIndexes) {
  levelAssetsPromises.forEach((levelAssetsPromise, levelIndex) => {
    if (keptLevelIndexes.includes(levelIndex)) return;
    levelAssetsPromises.delete(levelIndex);
    levelAssetsPromise.then(({ layers }) => layers.forEach(({ image }) => image.close())).catch(() => {});
  });
}

/**
 * Starts loading the boss sprites if the level contains a boss, so entering the level does not wait for them.
 * @param {{data: Object}} levelAssets - Loaded level assets.
 */
export function preloadLevelSprites({ data }) {
  if (data.entities.Boss?.length) preloadVerdanSheets();
}

/**
 * Counts the coins of all levels.
 * @returns {Promise<number>} Total number of coins.
 */
export async function countLevelCoins() {
  const allLevelData = await Promise.all(Array.from({ length: LEVEL_COUNT }, (_, levelIndex) => fetchLevelData(getLevelFolderUrl(levelIndex))));
  return allLevelData.reduce((total, data) => total + (data.entities.Coin ?? []).length, 0);
}

/**
 * Converts the one-based start level into a level index.
 * @param {number} startLevel - One-based level number.
 * @returns {number} Zero-based index, or 0 if the input is invalid.
 */
export function getStartLevelIndex(startLevel) {
  if (Number.isInteger(startLevel) && startLevel >= 1) return startLevel - 1;
  console.error(`Invalid START_LEVEL "${startLevel}": expected an integer >= 1. Falling back to level 1.`);
  return 0;
}

/**
 * Loads a level and falls back to the first level if it fails.
 * @param {number} levelIndex - Zero-based level index.
 * @returns {Promise<{levelAssets: Object, levelIndex: number}>} The loaded assets and the index actually loaded.
 */
export async function loadLevelWithFallback(levelIndex) {
  try {
    return { levelAssets: await loadLevelAssets(levelIndex), levelIndex };
  } catch (error) {
    if (levelIndex === 0) throw error;
    console.error(`Level ${levelIndex + 1} could not be loaded. Falling back to level 1.`, error);
    return { levelAssets: await loadLevelAssets(0), levelIndex: 0 };
  }
}

/**
 * Builds the folder URL of a level.
 * @param {number} levelIndex - Zero-based level index.
 * @returns {URL} URL of the level folder.
 */
function getLevelFolderUrl(levelIndex) {
  return new URL(`./${LEVEL_FOLDERS[levelIndex]}/`, import.meta.url);
}

/**
 * Fetches the data.json of a level.
 * @param {URL} folderUrl - URL of the level folder.
 * @returns {Promise<Object>} The parsed level data.
 * @throws {Error} If the response is not ok.
 */
async function fetchLevelData(folderUrl) {
  const dataUrl = new URL("data.json", folderUrl);
  const response = await fetch(dataUrl);
  if (!response.ok) throw new Error(`Failed to load level data (${response.status}): ${dataUrl}`);
  return response.json();
}

/**
 * Fetches level data, layer images and collision grid of a level.
 * @param {URL} folderUrl - URL of the level folder.
 * @returns {Promise<{data: Object, layers: Array, collisionGrid: number[][]}>} The level assets.
 */
async function fetchLevelAssets(folderUrl) {
  const data = await fetchLevelData(folderUrl);
  const [layers, collisionGrid] = await Promise.all([loadLayerImages(data, folderUrl), loadCollisionGrid(data, folderUrl)]);
  return { data, layers, collisionGrid };
}

/**
 * Loads all layer images listed in the level data.
 * @param {Object} data - Parsed level data.
 * @param {URL} folderUrl - URL of the level folder.
 * @returns {Promise<Array<{name: string, image: ImageBitmap}>>} The decoded layers.
 */
function loadLayerImages(data, folderUrl) {
  return Promise.all(data.layers.map((filename) => loadLayerImage(filename, folderUrl)));
}

/**
 * Fetches and parses the collision CSV of a level.
 * @param {Object} data - Parsed level data with width and height.
 * @param {URL} folderUrl - URL of the level folder.
 * @returns {Promise<number[][]>} The collision grid.
 * @throws {Error} If the response is not ok or the grid is invalid.
 */
async function loadCollisionGrid(data, folderUrl) {
  const collisionUrl = new URL("Collisions.csv", folderUrl);
  const response = await fetch(collisionUrl);
  if (!response.ok) throw new Error(`Failed to load collision data (${response.status}): ${collisionUrl}`);
  const csvText = await response.text();
  return parseCollisionCsv(csvText, data.width, data.height);
}

/**
 * Parses collision CSV text and validates its size.
 * @param {string} csvText - Raw CSV text.
 * @param {number} levelWidth - Level width in pixels.
 * @param {number} levelHeight - Level height in pixels.
 * @returns {number[][]} The collision grid.
 * @throws {Error} If the grid does not match the level size.
 */
function parseCollisionCsv(csvText, levelWidth, levelHeight) {
  const columns = levelWidth / COLLISION_TILE_SIZE;
  const rows = levelHeight / COLLISION_TILE_SIZE;
  const collisionGrid = parseCsvRows(csvText);
  if (!isValidGrid(collisionGrid, columns, rows)) {
    throw new Error(`Invalid collision grid: expected ${columns} columns and ${rows} rows of non-negative integers.`);
  }
  return collisionGrid;
}

/**
 * Splits CSV text into rows of numbers.
 * @param {string} csvText - Raw CSV text.
 * @returns {number[][]} Parsed rows.
 */
function parseCsvRows(csvText) {
  return csvText
    .trim()
    .split(/\r?\n/)
    .map((line) =>
      line
        .replace(/,\s*$/, "")
        .split(",")
        .map((value) => Number(value.trim())),
    );
}

/**
 * Checks whether a grid has the expected size and only valid cells.
 * @param {number[][]} grid - Grid to check.
 * @param {number} columns - Expected column count.
 * @param {number} rows - Expected row count.
 * @returns {boolean} True if the grid is valid.
 */
function isValidGrid(grid, columns, rows) {
  if (!Number.isInteger(columns) || !Number.isInteger(rows)) return false;
  if (grid.length !== rows) return false;
  return grid.every((row) => row.length === columns && row.every(isValidCell));
}

/**
 * Checks whether a grid cell is a non-negative integer.
 * @param {number} value - Cell value.
 * @returns {boolean} True if the cell is valid.
 */
function isValidCell(value) {
  return Number.isInteger(value) && value >= 0;
}

/**
 * Gets the layer name from a file name.
 * @param {string} filename - Layer image file name.
 * @returns {string} File name without extension.
 */
function getLayerName(filename) {
  return filename.replace(/\.[^.]+$/, "");
}

/**
 * Loads and decodes a layer image into a bitmap.
 * @param {string} filename - Layer image file name.
 * @param {URL} folderUrl - URL of the level folder.
 * @returns {Promise<{name: string, image: ImageBitmap}>} The decoded layer.
 * @throws {Error} If the image cannot be decoded.
 */
async function loadLayerImage(filename, folderUrl) {
  const image = new Image();
  image.src = new URL(filename, folderUrl).href;
  try {
    await image.decode();
  } catch {
    throw new Error(`Failed to load level layer: ${image.src}`);
  }
  return { name: getLayerName(filename), image: await createImageBitmap(image) };
}

/**
 * Creates a patrolling enemy from a level entity.
 * @param {Object} entity - Enemy_Patrol entity with optional type and range fields.
 * @param {number} index - Entity index, used to pick a type if none is set.
 * @returns {Enemy} The placed enemy.
 */
function createEnemy(entity, index) {
  const EnemyClass = ENEMY_CLASSES[entity.customFields?.type] ?? ENEMY_ORDER[index % ENEMY_ORDER.length];
  const enemy = new EnemyClass();
  placeOnEntity(enemy, entity);
  const halfRange = ((entity.customFields?.range ?? 0) * TILE_SIZE) / 2;
  enemy.placeAt(enemy.x, enemy.y, enemy.x - halfRange, enemy.x + halfRange);
  return enemy;
}

/**
 * Creates the boss and limits it to the floor it stands on.
 * @param {Object} entity - Boss entity.
 * @param {number[][]} collisionGrid - Level collision grid.
 * @returns {VerdanBoss} The placed boss.
 */
function createBoss(entity, collisionGrid) {
  const boss = new VerdanBoss();
  placeOnEntity(boss, entity);
  boss.setArena(findWalkableFloor(getEntityBox(entity), collisionGrid));
  return boss;
}

/**
 * Finds the connected walkable floor below a box.
 * @param {{x: number, y: number, width: number, height: number}} box - Entity box.
 * @param {number[][]} collisionGrid - Level collision grid.
 * @returns {{left: number, right: number}} Floor bounds in pixels.
 */
function findWalkableFloor(box, collisionGrid) {
  const floorRow = Math.round((box.y + box.height) / TILE_SIZE);
  const isWalkable = (column) => collisionGrid[floorRow - 1]?.[column] === 0 && collisionGrid[floorRow]?.[column] > 0;
  let leftColumn = Math.floor((box.x + box.width / 2) / TILE_SIZE);
  let rightColumn = leftColumn;
  while (isWalkable(leftColumn - 1)) leftColumn--;
  while (isWalkable(rightColumn + 1)) rightColumn++;
  return { left: leftColumn * TILE_SIZE, right: (rightColumn + 1) * TILE_SIZE };
}

/**
 * Creates a coin centered on a level entity.
 * @param {Object} entity - Coin entity.
 * @returns {ChargeItem} The coin.
 */
function createChargeItem(entity) {
  const box = getEntityBox(entity);
  return new ChargeItem(box.x + box.width / 2, box.y + box.height / 2);
}

/**
 * Creates a normal key from a level entity.
 * @param {Object} entity - Key entity.
 * @returns {KeyItem} The key.
 */
function createKey(entity) {
  return new KeyItem(getEntityBox(entity));
}

/**
 * Creates the ancient boss key from a level entity.
 * @param {Object} entity - Boss_Key entity.
 * @returns {KeyItem} The boss key.
 */
function createBossKey(entity) {
  return new KeyItem(getEntityBox(entity), true);
}

/**
 * Creates a normal exit portal from a level entity.
 * @param {Object} entity - Exit entity.
 * @returns {ExitPortal} The exit portal.
 */
function createExit(entity) {
  return new ExitPortal(getEntityBox(entity));
}

/**
 * Creates the boss level exit portal from a level entity.
 * @param {Object} entity - Exit_Boss entity.
 * @returns {ExitPortal} The boss exit portal.
 */
function createBossExit(entity) {
  return new ExitPortal(getEntityBox(entity), true);
}

/**
 * Creates a checkpoint from a level entity.
 * @param {Object} entity - Checkpoint entity.
 * @returns {Checkpoint} The checkpoint.
 */
function createCheckpoint(entity) {
  return new Checkpoint(entity, getEntityBox(entity));
}

/**
 * Builds a level with all enemies, items, keys, exits, checkpoints and healing plants.
 * @param {{data: Object, layers: Array, collisionGrid: number[][]}} levelAssets - Loaded level assets.
 * @returns {Level} The created level.
 */
export function createLevel(levelAssets) {
  const entities = levelAssets.data.entities;
  const bosses = (entities.Boss ?? []).map((entity) => createBoss(entity, levelAssets.collisionGrid));
  const enemies = [...(entities.Enemy_Patrol ?? []).map(createEnemy), ...bosses];
  const items = (entities.Coin ?? []).map(createChargeItem);
  const keys = [...(entities.Key ?? []).map(createKey), ...(entities.Boss_Key ?? []).map(createBossKey)];
  const exits = [...(entities.Exit ?? []).map(createExit), ...(entities.Exit_Boss ?? []).map(createBossExit)];
  const checkpoints = (entities.Checkpoint ?? []).map(createCheckpoint);
  const healingPlants = (entities.Healing_Plant ?? []).map((entity) => new HealingPlant(getEntityBox(entity)));
  return new Level(enemies, items, levelAssets, keys, exits, checkpoints, healingPlants);
}
