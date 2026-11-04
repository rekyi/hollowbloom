import { FEMALE_CHARACTER_CONFIG } from "../data.js";
import { playSfx } from "../sfx.js";
import { MaleCharacter } from "./male-character.class.js";

/** Playable female character with her own sprites, timings and sounds. */
export class FemaleCharacter extends MaleCharacter {
  characterType = "female";
  extraAttackType = "attack_4";
  attackSfxLeadTicks = 6;
  extraAttackSfxLeadTicks = 11;

  /** Creates the character from the female config. */
  constructor() {
    super(FEMALE_CHARACTER_CONFIG);
    this.footstepStartDelaySeconds = 0.065;
  }

  /** Plays the normal attack sound. */
  playAttackSfx() {
    playSfx("femaleAttack1");
  }

  /** Plays the special attack sound. */
  playExtraAttackSfx() {
    playSfx("femaleAttack4");
  }

  /** Plays the hurt sound. */
  playHurtSfx() {
    playSfx("femaleHurt");
  }
}
