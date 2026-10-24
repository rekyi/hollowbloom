const FEMALE_CHARACTER_CONFIG = {
  spritePath: "assets/images/character/female/",
  offset: { top: 48, right: 72, bottom: 8, left: 48 },
  attackDamageFrame: 3,
  sprites: {
    walking: { file: "Walk.png", count: 8 },
    running: { file: "Run.png", count: 8 },
    idle: { file: "Idle.png", count: 5 },
    idleLong: null,
    attack: { file: "Attack_1.png", count: 6 },
    jumping: { file: "Jump.png", count: 8 },
    hurt: { file: "Hurt.png", count: 2 },
    dead: { file: "Dead.png", count: 5 },
    bubble: null,
  },
};

class FemaleCharacter extends MaleCharacter {
  constructor() {
    super(FEMALE_CHARACTER_CONFIG);
  }
}
