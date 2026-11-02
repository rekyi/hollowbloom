import { ChargeItem } from "../models/charge-item.class.js";
import { DarkElf, Boar, Skeleton } from "../models/enemies.class.js";
import { ExitPortal } from "../models/exit-portal.class.js";
import { KeyItem } from "../models/key-item.class.js";
import { Level, COLLISION_TILE_SIZE, TILE_SIZE, getEntityBox, placeOnEntity } from "../models/level.class.js";
import { VerdanBoss } from "../models/verdan-boss.class.js";
import { LEVEL_COUNT } from "../data.js";

const ENEMY_CLASSES = { Boar, DarkElf, Skeleton };
const ENEMY_ORDER = [DarkElf, Skeleton, Boar];
const ANCIENT_KEY_TYPE = "Ancient";
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

export async function countLevelCoins() {
  const allLevelAssets = await Promise.all(Array.from({ length: LEVEL_COUNT }, (_, levelIndex) => loadLevelAssets(levelIndex)));
  return allLevelAssets.reduce((total, levelAssets) => total + (levelAssets.data.entities.Coin ?? []).length, 0);
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

async function fetchLevelAssets(folderUrl) {
  const dataUrl = new URL("data.json", folderUrl);
  const response = await fetch(dataUrl);
  if (!response.ok) throw new Error(`Failed to load level data (${response.status}): ${dataUrl}`);
  const data = await response.json();
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

function loadLayerImage(filename, folderUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve({ name: getLayerName(filename), image });
    image.onerror = () => reject(new Error(`Failed to load level layer: ${image.src}`));
    image.src = new URL(filename, folderUrl).href;
  });
}

function createEnemy(entity, index) {
  const EnemyClass = ENEMY_CLASSES[entity.customFields?.type] ?? ENEMY_ORDER[index % ENEMY_ORDER.length];
  const enemy = new EnemyClass();
  placeOnEntity(enemy, entity);
  const halfRange = ((entity.customFields?.range ?? 0) * TILE_SIZE) / 2;
  enemy.placeAt(enemy.x, enemy.y, enemy.x - halfRange, enemy.x + halfRange);
  return enemy;
}

function createBoss(entity) {
  const boss = new VerdanBoss();
  placeOnEntity(boss, entity);
  boss.setArena((entity.customFields?.range ?? 0) * TILE_SIZE);
  return boss;
}

function createChargeItem(entity) {
  const box = getEntityBox(entity);
  return new ChargeItem(box.x + box.width / 2, box.y + box.height / 2);
}

function createKey(entity) {
  return new KeyItem(getEntityBox(entity), entity.customFields?.type === ANCIENT_KEY_TYPE);
}

function createExit(entity) {
  return new ExitPortal(getEntityBox(entity));
}

export function createLevel(levelAssets) {
  const entities = levelAssets.data.entities;
  const enemies = [...(entities.Enemy_Patrol ?? []).map(createEnemy), ...(entities.Boss ?? []).map(createBoss)];
  const items = (entities.Coin ?? []).map(createChargeItem);
  const keys = (entities.Key ?? []).map(createKey);
  const exits = (entities.Exit ?? []).map(createExit);
  return new Level(enemies, items, levelAssets, keys, exits);
}
