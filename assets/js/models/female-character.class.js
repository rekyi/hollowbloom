import { FEMALE_CHARACTER_CONFIG } from "../data.js";
import { playSfx } from "../sfx.js";
import { MaleCharacter } from "./male-character.class.js";

export class FemaleCharacter extends MaleCharacter {
  constructor() {
    super(FEMALE_CHARACTER_CONFIG);
  }

  playAttackStartSfx() {
    playSfx("femaleAttack1");
  }

  playExtraAttackSfx() {
    playSfx("femaleAttack4");
  }
}
