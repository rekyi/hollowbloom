import { ChargeItem } from "../../models/charge-item.class.js";
import { DarkElf, Boar, Skeleton } from "../../models/enemies.class.js";
import { Level, COLLISION_TILE_SIZE, TILE_SIZE, getEntityBox, placeOnEntity } from "../../models/level.class.js";

const ENEMY_CLASSES = { Boar, DarkElf, Skeleton };
const ENEMY_ORDER = [DarkElf, Skeleton, Boar];
let levelAssetsPromise = null;

export function loadLevelAssets() {
  if (levelAssetsPromise) return levelAssetsPromise;
  levelAssetsPromise = fetchLevelAssets().catch((error) => {
    levelAssetsPromise = null;
    throw error;
  });
  return levelAssetsPromise;
}

async function fetchLevelAssets() {
  const dataUrl = new URL("./data.json", import.meta.url);
  const response = await fetch(dataUrl);
  if (!response.ok) throw new Error(`Failed to load level data (${response.status}): ${dataUrl}`);
  const data = await response.json();
  const [layers, collisionGrid] = await Promise.all([Promise.all(data.layers.map(loadLayerImage)), loadCollisionGrid(data)]);
  return { data, layers, collisionGrid };
}

async function loadCollisionGrid(data) {
  const collisionUrl = new URL("./Collisions.csv", import.meta.url);
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

function loadLayerImage(filename) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve({ name: filename, image });
    image.onerror = () => reject(new Error(`Failed to load level layer: ${image.src}`));
    image.src = new URL(`./${filename}`, import.meta.url).href;
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

function createChargeItem(entity) {
  const box = getEntityBox(entity);
  return new ChargeItem(box.x + box.width / 2, box.y + box.height / 2);
}

export function createLevel1(levelAssets) {
  const entities = levelAssets.data.entities;
  const enemies = (entities.Enemy_Patrol ?? []).map(createEnemy);
  const items = (entities.Coin ?? []).map(createChargeItem);
  return new Level(enemies, items, levelAssets);
}
