import { playSfx } from "../sfx.js";
import { CharacterVisuals } from "./character-visuals.class.js";

const ATTACK_SFX_VOLUME = 0.4;
const EXTRA_ATTACK_SFX_VOLUME = 0.45;

/** Playable male character; also the base for the female character. */
export class MaleCharacter extends CharacterVisuals {
  characterType = "male";
  extraAttackType = "attack_3";
  attackSfxLeadTicks = 2;
  extraAttackSfxLeadTicks = 5;

  /**
   * Creates the character, loads its sprites and starts animation and gravity.
   * @param {Object} [config={}] - Settings that override the male defaults.
   */
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

  /** Plays the normal attack sound. */
  playAttackSfx() {
    playSfx("maleAttack1", { volume: ATTACK_SFX_VOLUME });
  }

  /** Plays the special attack sound. */
  playExtraAttackSfx() {
    playSfx("maleAttack3", { volume: EXTRA_ATTACK_SFX_VOLUME });
  }

  /** Plays the hurt sound. */
  playHurtSfx() {
    playSfx("maleHurt");
  }
}
