import { FEMALE_CHARACTER_CONFIG } from "../data.js";
import { playSfx } from "../sfx.js";
import { MaleCharacter } from "./male-character.class.js";

export class FemaleCharacter extends MaleCharacter {
  characterType = "female";
  extraAttackType = "attack_4";
  attackSfxLeadTicks = 6;
  extraAttackSfxLeadTicks = 11;

  constructor() {
    super(FEMALE_CHARACTER_CONFIG);
    this.footstepStartDelaySeconds = 0.065;
  }

  playAttackSfx() {
    playSfx("femaleAttack1");
  }

  playExtraAttackSfx() {
    playSfx("femaleAttack4");
  }

  playHurtSfx() {
    playSfx("femaleHurt");
  }
}
