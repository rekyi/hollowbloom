import { ChargeItem } from "../models/charge-item.class.js";
import { DarkElf, Boar, Skeleton } from "../models/enemies.class.js";
import { FinalBoss } from "../models/final-boss.class.js";
import { Level } from "../models/level.class.js";

const CHARGE_ITEM_POSITIONS = [400, 850, 1300, 1750, 2200, 2700];
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
  const layers = await Promise.all(data.layers.map(loadLayerImage));
  return { data, layers };
}

function loadLayerImage(filename) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve({ name: filename, image });
    image.onerror = () => reject(new Error(`Failed to load level layer: ${image.src}`));
    image.src = new URL(`./${filename}`, import.meta.url).href;
  });
}

export function createLevel1(levelAssets) {
  const level = new Level(
    [
      new DarkElf({ x: 650, minX: 550, maxX: 800 }),
      new Skeleton({ x: 1050, minX: 950, maxX: 1200 }),
      new Boar({ x: 1350, minX: 1250, maxX: 1550 }),
      new DarkElf({ x: 1850, minX: 1750, maxX: 2000 }),
      new Boar({ x: 2200, minX: 2100, maxX: 2350 }),
      new DarkElf({ x: 2500, minX: 2400, maxX: 2650 }),
      new Skeleton({ x: 3000, minX: 2900, maxX: 3150 }),
      new FinalBoss(),
    ],
    CHARGE_ITEM_POSITIONS.map((x) => new ChargeItem(x)),
    levelAssets,
  );
  return level;
}
