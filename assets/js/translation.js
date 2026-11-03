const LANGUAGE_STORAGE_KEY = "language";
const DEFAULT_LANGUAGE = "en";
const LANGUAGES = ["en", "de"];

const TEXTS = {
  "common.back": { en: "Back", de: "Zurück" },
  "common.mainMenu": { en: "Main menu", de: "Hauptmenü" },
  coins: { en: "Coins", de: "Münzen" },

  "start.prompt": { en: "Click to start", de: "Klicken, um zu starten" },
  "menu.start": { en: "Start game", de: "Spiel starten" },
  "menu.settings": { en: "Settings", de: "Einstellungen" },
  "menu.credits": { en: "Credits", de: "Credits" },
  "menu.imprint": { en: "Legal notice", de: "Impressum" },
  "character.group": { en: "Choose character", de: "Character auswählen" },
  "character.female": { en: "Female character", de: "Weiblicher Character" },
  "character.male": { en: "Male character", de: "Männlicher Character" },

  "game.ready": { en: "READY!", de: "BEREIT!" },
  "boss.verdanTitle": { en: "Warden of the Grove", de: "Wächter des Hains" },

  "pause.label": { en: "Game paused", de: "Spiel pausiert" },
  "pause.title": { en: "Paused", de: "Pause" },
  "pause.hint": { en: "Press Esc or P to resume", de: "Esc oder P zum Fortsetzen" },
  "pause.resume": { en: "Resume", de: "Fortsetzen" },
  "pause.restart": { en: "Restart level", de: "Level neu starten" },

  "settings.audio": { en: "Audio", de: "Audio" },
  "settings.controls": { en: "Controls", de: "Steuerung" },
  "settings.general": { en: "General", de: "Allgemein" },
  "settings.display": { en: "Display", de: "Anzeige" },
  "settings.screen": { en: "Screen", de: "Bildschirm" },
  "settings.windowed": { en: "Windowed", de: "Fenster" },
  "settings.fullscreen": { en: "Fullscreen", de: "Vollbild" },
  "settings.effects": { en: "Effects", de: "Effekte" },
  "settings.screenShake": { en: "Screen shake", de: "Bildschirmwackeln" },
  "settings.on": { en: "On", de: "An" },
  "settings.off": { en: "Off", de: "Aus" },
  "settings.language": { en: "Language", de: "Sprache" },
  "settings.languageLabel": { en: "Game language", de: "Spielsprache" },

  "audio.master": { en: "Master volume", de: "Gesamtlautstärke" },
  "audio.music": { en: "Music", de: "Musik" },
  "audio.sfx": { en: "Sound effects", de: "Soundeffekte" },
  "audio.mute": { en: "Mute audio", de: "Ton ausschalten" },
  "audio.unmute": { en: "Unmute audio", de: "Ton einschalten" },

  "controls.keyboard": { en: "Keyboard", de: "Tastatur" },
  "controls.move": { en: "Move", de: "Laufen" },
  "controls.run": { en: "Run", de: "Rennen" },
  "controls.jump": { en: "Jump", de: "Springen" },
  "controls.attack": { en: "Attack", de: "Angriff" },
  "controls.special": { en: "Special attack", de: "Spezialangriff" },
  "controls.pause": { en: "Pause", de: "Pause" },
  "controls.restart": { en: "Restart level", de: "Level neu starten" },
  "controls.or": { en: "or", de: "oder" },
  "controls.holdMove": { en: "hold while moving", de: "halten + Laufen" },
  "controls.space": { en: "Space", de: "Leertaste" },
  "controls.specialHint": { en: "costs 2 coins", de: "kostet 2 Münzen" },
  "controls.arrowLeft": { en: "Left arrow", de: "Pfeil links" },
  "controls.arrowRight": { en: "Right arrow", de: "Pfeil rechts" },
  "controls.arrowUp": { en: "Up arrow", de: "Pfeil hoch" },

  "gameOver.label": { en: "Game Over", de: "Spiel vorbei" },
  "gameOver.restart": { en: "Play again", de: "Erneut spielen" },

  "victory.title": { en: "VICTORY!", de: "SIEG!" },
  "victory.time": { en: "Play time", de: "Spielzeit" },
  "victory.defeated": { en: "Enemies defeated", de: "Besiegte Gegner" },
  "victory.deaths": { en: "Deaths", de: "Tode" },
  "victory.restarts": { en: "Restarts", de: "Neustarts" },
  "victory.again": { en: "Play again", de: "Nochmal spielen" },

  "orientation.title": { en: "Please rotate your device", de: "Bitte Gerät drehen" },
  "orientation.text": { en: "The game can only be played in landscape mode.", de: "Das Spiel ist nur im Querformat spielbar." },

  "message.levelLoading": { en: "Loading level ...", de: "Level wird geladen ..." },
  "message.levelLoadFailed": { en: "The level could not be loaded. Please try again.", de: "Level konnte nicht geladen werden. Bitte erneut versuchen." },
  "message.nextLevelLoadFailed": { en: "The next level could not be loaded. Please reload the page.", de: "Das nächste Level konnte nicht geladen werden. Bitte die Seite neu laden." },
  "message.screenModeFailed": { en: "The screen mode could not be changed.", de: "Der Bildschirmmodus konnte nicht gewechselt werden." },
};

let currentLanguage = DEFAULT_LANGUAGE;
const languageChangeListeners = [];

export function setupTranslation() {
  currentLanguage = loadLanguage();
  const languageSelectRef = document.getElementById("language-select");
  languageSelectRef.value = currentLanguage;
  languageSelectRef.addEventListener("change", handleLanguageChange);
  applyTranslation();
}

export function translate(key) {
  const entry = TEXTS[key];
  if (!entry) return key;
  return entry[currentLanguage] ?? entry[DEFAULT_LANGUAGE];
}

export function onLanguageChange(listener) {
  languageChangeListeners.push(listener);
}

function handleLanguageChange(event) {
  currentLanguage = event.target.value;
  saveLanguage();
  applyTranslation();
  languageChangeListeners.forEach((listener) => listener());
}

function applyTranslation() {
  document.documentElement.lang = currentLanguage;
  document.documentElement.classList.remove("is-translating");
  document.querySelectorAll("[data-i18n]").forEach((ref) => {
    ref.textContent = translate(ref.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-aria-label]").forEach((ref) => {
    ref.setAttribute("aria-label", translate(ref.dataset.i18nAriaLabel));
  });
}

function loadLanguage() {
  try {
    const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return LANGUAGES.includes(savedLanguage) ? savedLanguage : DEFAULT_LANGUAGE;
  } catch (error) {
    console.error("Saved language could not be loaded.", error);
    return DEFAULT_LANGUAGE;
  }
}

function saveLanguage() {
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, currentLanguage);
  } catch (error) {
    console.error("Language could not be saved.", error);
  }
}
