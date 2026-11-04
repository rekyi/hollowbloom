import { appState } from "./assets/js/data.js";
import { setupStartScreenMusic, setupAudioSettings } from "./assets/js/audio.js";
import { setupSfx } from "./assets/js/sfx.js";
import { setupInput } from "./assets/js/input.js";
import { setupScreens } from "./assets/js/screens.js";
import { setupDialogs } from "./assets/js/dialogs.js";
import { setupFullscreen } from "./assets/js/fullscreen.js";
import { setupTouchControls } from "./assets/js/touch-controls.js";
import { setupEffectSettings } from "./assets/js/effect-settings.js";
import { Keyboard } from "./assets/js/classes/keyboard.class.js";
import { FemaleCharacter } from "./assets/js/classes/female-character.class.js";

/** Initializes app state and sets up all game systems and UI listeners. */
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
  setupFullscreen();
  setupEffectSettings();
  setupTouchControls();
}
init();
