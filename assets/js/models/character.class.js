class Character extends MoveableObect {
  width = 160;
  height = 320;
  y = 115;

  constructor() {
    super();
    this.loadImage("assets/images/2_character_pepe/2_walk/W-21.png");
  }

  jump() {}
}
