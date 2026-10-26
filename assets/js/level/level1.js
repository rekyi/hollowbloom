import { ChargeItem } from "../models/charge-item.class.js";
import { Background } from "../models/background.class.js";
import { Rat, Bat, Slime, Mimic } from "../models/enemies.class.js";
import { FinalBoss } from "../models/final-boss.class.js";
import { Level } from "../models/level.class.js";

const BACKGROUND_LAYERS = [
  "layer_0011_0",
  "layer_0010_1",
  "layer_0009_2",
  "layer_0008_3",
  "layer_0007_lights",
  "layer_0006_4",
  "layer_0005_5",
  "layer_0004_lights",
  "layer_0003_6",
  "layer_0002_7",
  "layer_0001_8",
  "layer_0000_9",
];
const BACKGROUND_TILE_WIDTH = 720;
const CHARGE_ITEM_POSITIONS = [400, 850, 1300, 1750, 2200, 2700];

export function createLevel1() {
  const level = new Level(
    [new Rat(), new Bat(), new Slime(), new Mimic(), new FinalBoss()],
    [],
    [],
    CHARGE_ITEM_POSITIONS.map((x) => new ChargeItem(x)),
  );
  level.backgroundTileIndices = new Set();
  level.updateBackground = updateLevel1Background;
  return level;
}

function updateLevel1Background(cameraX, viewportWidth) {
  const firstTile = Math.floor(-cameraX / BACKGROUND_TILE_WIDTH);
  const lastTile = Math.floor((-cameraX + viewportWidth) / BACKGROUND_TILE_WIDTH);
  for (let tileIndex = firstTile; tileIndex <= lastTile; tileIndex++) {
    addBackgroundTile(this, tileIndex);
  }
}

function addBackgroundTile(level, tileIndex) {
  if (level.backgroundTileIndices.has(tileIndex)) return;
  const x = tileIndex * BACKGROUND_TILE_WIDTH;
  level.background.push(...BACKGROUND_LAYERS.map((layer) => new Background(`assets/images/background/level1/${layer}.png`, x)));
  level.backgroundTileIndices.add(tileIndex);
}
