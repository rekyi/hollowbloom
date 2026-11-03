import { ChargeItem } from "../models/charge-item.class.js";
import { DarkElf, Boar, Skeleton } from "../models/enemies.class.js";
import { ExitPortal } from "../models/exit-portal.class.js";
import { KeyItem } from "../models/key-item.class.js";
import { Level, COLLISION_TILE_SIZE, TILE_SIZE, getEntityBox, placeOnEntity } from "../models/level.class.js";
import { VerdanBoss } from "../models/verdan-boss.class.js";
import { LEVEL_COUNT } from "../data.js";

const ENEMY_CLASSES = { Boar, DarkElf, Skeleton };
const ENEMY_ORDER = [DarkElf, Skeleton, Boar];
const levelAssetsPromises = new Map();

export function loadLevelAssets(levelIndex) {
  if (levelAssetsPromises.has(levelIndex)) return levelAssetsPromises.get(levelIndex);
  const levelAssetsPromise = fetchLevelAssets(getLevelFolderUrl(levelIndex)).catch((error) => {
    levelAssetsPromises.delete(levelIndex);
    throw error;
  });
  levelAssetsPromises.set(levelIndex, levelAssetsPromise);
  return levelAssetsPromise;
}

export function releaseLevelAssets(keptLevelIndexes) {
  levelAssetsPromises.forEach((levelAssetsPromise, levelIndex) => {
    if (keptLevelIndexes.includes(levelIndex)) return;
    levelAssetsPromises.delete(levelIndex);
    levelAssetsPromise.then(({ layers }) => layers.forEach(({ image }) => image.close())).catch(() => {});
  });
}

export async function countLevelCoins() {
  const allLevelData = await Promise.all(Array.from({ length: LEVEL_COUNT }, (_, levelIndex) => fetchLevelData(getLevelFolderUrl(levelIndex))));
  return allLevelData.reduce((total, data) => total + (data.entities.Coin ?? []).length, 0);
}

export function getStartLevelIndex(startLevel) {
  if (Number.isInteger(startLevel) && startLevel >= 1) return startLevel - 1;
  console.error(`Invalid START_LEVEL "${startLevel}": expected an integer >= 1. Falling back to level 1.`);
  return 0;
}

export async function loadLevelWithFallback(levelIndex) {
  try {
    return { levelAssets: await loadLevelAssets(levelIndex), levelIndex };
  } catch (error) {
    if (levelIndex === 0) throw error;
    console.error(`Level ${levelIndex + 1} could not be loaded. Falling back to level 1.`, error);
    return { levelAssets: await loadLevelAssets(0), levelIndex: 0 };
  }
}

function getLevelFolderUrl(levelIndex) {
  const folderName = `level_${String(levelIndex + 1).padStart(2, "0")}`;
  return new URL(`./${folderName}/`, import.meta.url);
}

async function fetchLevelData(folderUrl) {
  const dataUrl = new URL("data.json", folderUrl);
  const response = await fetch(dataUrl);
  if (!response.ok) throw new Error(`Failed to load level data (${response.status}): ${dataUrl}`);
  return response.json();
}

async function fetchLevelAssets(folderUrl) {
  const data = await fetchLevelData(folderUrl);
  const [layers, collisionGrid] = await Promise.all([loadLayerImages(data, folderUrl), loadCollisionGrid(data, folderUrl)]);
  return { data, layers, collisionGrid };
}

function loadLayerImages(data, folderUrl) {
  return Promise.all(data.layers.map((filename) => loadLayerImage(filename, folderUrl)));
}

async function loadCollisionGrid(data, folderUrl) {
  const collisionUrl = new URL("Collisions.csv", folderUrl);
  const response = await fetch(collisionUrl);
  if (!response.ok) throw new Error(`Failed to load collision data (${response.status}): ${collisionUrl}`);
  const csvText = await response.text();
  return parseCollisionCsv(csvText, data.width, data.height);
}

function parseCollisionCsv(csvText, levelWidth, levelHeight) {
  const columns = levelWidth / COLLISION_TILE_SIZE;
  const rows = levelHeight / COLLISION_TILE_SIZE;
  const collisionGrid = parseCsvRows(csvText);
  if (!isValidGrid(collisionGrid, columns, rows)) {
    throw new Error(`Invalid collision grid: expected ${columns} columns and ${rows} rows of non-negative integers.`);
  }
  return collisionGrid;
}

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

function isValidGrid(grid, columns, rows) {
  if (!Number.isInteger(columns) || !Number.isInteger(rows)) return false;
  if (grid.length !== rows) return false;
  return grid.every((row) => row.length === columns && row.every(isValidCell));
}

function isValidCell(value) {
  return Number.isInteger(value) && value >= 0;
}

function getLayerName(filename) {
  return filename.replace(/\.[^.]+$/, "");
}

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

function createEnemy(entity, index) {
  const EnemyClass = ENEMY_CLASSES[entity.customFields?.type] ?? ENEMY_ORDER[index % ENEMY_ORDER.length];
  const enemy = new EnemyClass();
  placeOnEntity(enemy, entity);
  const halfRange = ((entity.customFields?.range ?? 0) * TILE_SIZE) / 2;
  enemy.placeAt(enemy.x, enemy.y, enemy.x - halfRange, enemy.x + halfRange);
  return enemy;
}

function createBoss(entity, collisionGrid) {
  const boss = new VerdanBoss();
  placeOnEntity(boss, entity);
  boss.setArena(findWalkableFloor(getEntityBox(entity), collisionGrid));
  return boss;
}

function findWalkableFloor(box, collisionGrid) {
  const floorRow = Math.round((box.y + box.height) / TILE_SIZE);
  const isWalkable = (column) => collisionGrid[floorRow - 1]?.[column] === 0 && collisionGrid[floorRow]?.[column] > 0;
  let leftColumn = Math.floor((box.x + box.width / 2) / TILE_SIZE);
  let rightColumn = leftColumn;
  while (isWalkable(leftColumn - 1)) leftColumn--;
  while (isWalkable(rightColumn + 1)) rightColumn++;
  return { left: leftColumn * TILE_SIZE, right: (rightColumn + 1) * TILE_SIZE };
}

function createChargeItem(entity) {
  const box = getEntityBox(entity);
  return new ChargeItem(box.x + box.width / 2, box.y + box.height / 2);
}

function createKey(entity) {
  return new KeyItem(getEntityBox(entity));
}

function createBossKey(entity) {
  return new KeyItem(getEntityBox(entity), true);
}

function createExit(entity) {
  return new ExitPortal(getEntityBox(entity));
}

function createBossExit(entity) {
  return new ExitPortal(getEntityBox(entity), true);
}

export function createLevel(levelAssets) {
  const entities = levelAssets.data.entities;
  const bosses = (entities.Boss ?? []).map((entity) => createBoss(entity, levelAssets.collisionGrid));
  const enemies = [...(entities.Enemy_Patrol ?? []).map(createEnemy), ...bosses];
  const items = (entities.Coin ?? []).map(createChargeItem);
  const keys = [...(entities.Key ?? []).map(createKey), ...(entities.Boss_Key ?? []).map(createBossKey)];
  const exits = [...(entities.Exit ?? []).map(createExit), ...(entities.Exit_Boss ?? []).map(createBossExit)];
  return new Level(enemies, items, levelAssets, keys, exits);
}
