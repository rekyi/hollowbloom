import { FEMALE_CHARACTER_CONFIG } from "../data.js";
import { MaleCharacter } from "./male-character.class.js";

export class FemaleCharacter extends MaleCharacter {
  constructor() {
    super(FEMALE_CHARACTER_CONFIG);
  }
}
