import { appState } from "./assets/js/data.js";
import { setupStartScreenMusic, setupAudioSettings } from "./assets/js/audio.js";
import { setupSfx } from "./assets/js/sfx.js";
import { setupInput } from "./assets/js/input.js";
import { setupScreens } from "./assets/js/screens.js";
import { setupDialogs } from "./assets/js/dialogs.js";
import { Keyboard } from "./assets/js/models/keyboard.class.js";
import { FemaleCharacter } from "./assets/js/models/female-character.class.js";

function init() {
  appState.canvasRef = document.getElementById("canvas");
  appState.keyboard = new Keyboard();
  appState.selectedCharacterClass = FemaleCharacter;
  setupSfx();
  setupStartScreenMusic();
  setupInput();
  setupScreens();
  setupDialogs();
  setupAudioSettings();
}
init();
