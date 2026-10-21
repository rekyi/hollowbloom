const level1 = new Level([new Chicken(), new Chicken(), new Chicken()], [new Clouds()], []);

const backgroundTileIndices = new Set();

level1.updateBackground = function (cameraX, viewportWidth) {
  const tileWidth = 720;
  const firstTile = Math.floor(-cameraX / tileWidth);
  const lastTile = Math.floor((-cameraX + viewportWidth) / tileWidth);

  for (let tileIndex = firstTile; tileIndex <= lastTile; tileIndex++) {
    if (backgroundTileIndices.has(tileIndex)) continue;

    const imageSet = Math.abs(tileIndex % 2) + 1;
    const x = tileIndex * tileWidth;
    this.background.push(
      new Background("assets/images/5_background/layers/air.png", x),
      new Background(`assets/images/5_background/layers/3_third_layer/${imageSet}.png`, x),
      new Background(`assets/images/5_background/layers/2_second_layer/${imageSet}.png`, x),
      new Background(`assets/images/5_background/layers/1_first_layer/${imageSet}.png`, x),
    );
    backgroundTileIndices.add(tileIndex);
  }
};
