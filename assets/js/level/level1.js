const level1 = new Level(
  [new Rat(), new Bat(), new Slime(), new Mimic(), new FinalBoss()],
  [new Clouds()],
  [],
);

const backgroundTileIndices = new Set();

const backgroundLayers = [
  "Layer_0011_0",
  "Layer_0010_1",
  "Layer_0009_2",
  "Layer_0008_3",
  "Layer_0007_Lights",
  "Layer_0006_4",
  "Layer_0005_5",
  "Layer_0004_Lights",
  "Layer_0003_6",
  "Layer_0002_7",
  "Layer_0001_8",
  "Layer_0000_9",
];

level1.updateBackground = function (cameraX, viewportWidth) {
  const tileWidth = 720;
  const firstTile = Math.floor(-cameraX / tileWidth);
  const lastTile = Math.floor((-cameraX + viewportWidth) / tileWidth);

  for (let tileIndex = firstTile; tileIndex <= lastTile; tileIndex++) {
    if (backgroundTileIndices.has(tileIndex)) continue;

    const x = tileIndex * tileWidth;
    this.background.push(...backgroundLayers.map((layer) => new Background(`assets/images/background/level1/${layer}.png`, x)));
    backgroundTileIndices.add(tileIndex);
  }
};
