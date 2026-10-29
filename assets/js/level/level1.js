import { ChargeItem } from "../models/charge-item.class.js";
import { DarkElf, Boar, Skeleton } from "../models/enemies.class.js";
import { FinalBoss } from "../models/final-boss.class.js";
import { Level } from "../models/level.class.js";

const CHARGE_ITEM_POSITIONS = [400, 850, 1300, 1750, 2200, 2700];

export function createLevel1() {
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
  );
  return level;
}
