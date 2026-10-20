class Character extends MoveableObect {
  width = 160;
  height = 320;
  y = 115;

  constructor() {
    super();
    this.loadImage("assets/images/2_character_pepe/2_walk/W-21.png");
    this.loadImages([
      "assets/images/2_character_pepe/2_walk/W-21.png",
      "assets/images/2_character_pepe/2_walk/W-22.png",
      "assets/images/2_character_pepe/2_walk/W-23.png",
      "assets/images/2_character_pepe/2_walk/W-24.png",
      "assets/images/2_character_pepe/2_walk/W-25.png",
      "assets/images/2_character_pepe/2_walk/W-26.png",
    ]);
  }

  jump() {}
}
