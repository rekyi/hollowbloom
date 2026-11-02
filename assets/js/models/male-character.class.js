import { playSfx } from "../sfx.js";
import { CharacterVisuals } from "./character-visuals.class.js";

export class MaleCharacter extends CharacterVisuals {
  characterType = "male";
  extraAttackType = "attack_3";
  attackSfxLeadTicks = 2;
  extraAttackSfxLeadTicks = 5;

  constructor(config = {}) {
    super();
    const settings = this.mergeSettings(config);
    this.applySettings(settings);
    this.loadMovementSprites(settings);
    this.loadCombatSprites(settings);
    this.img = this.imageCache[this.IMAGES_JUMPING[0]];
    this.animation();
    this.gravity();
  }

  playAttackSfx() {
    playSfx("maleAttack1");
  }

  playExtraAttackSfx() {
    playSfx("maleAttack3");
  }

  playHurtSfx() {
    playSfx("maleHurt");
  }
}
