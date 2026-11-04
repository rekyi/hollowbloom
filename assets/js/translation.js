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
  "credits.sprites": { en: "Sprites", de: "Sprites" },
  "credits.levelGraphics": { en: "Level graphics", de: "Level-Grafiken" },
  "credits.statusBar": { en: "Status bar", de: "Statusleiste" },
  "credits.icons": { en: "Icons", de: "Icons" },
  "credits.sounds": { en: "Music & sounds", de: "Musik & Sounds" },
  "credits.libraries": { en: "Libraries", de: "Bibliotheken" },
  "credits.mitLicense": { en: "MIT License", de: "MIT-Lizenz" },
  "credits.aiNote": { en: "Some graphics and sounds were created with AI.", de: "Einige Grafiken und Sounds wurden mit KI erstellt." },
  "imprint.provider": { en: "Information pursuant to § 5 DDG", de: "Angaben gemäß § 5 DDG" },
  "imprint.country": { en: "Germany", de: "Deutschland" },
  "imprint.contact": { en: "Contact", de: "Kontakt" },
  "imprint.phone": { en: "Phone", de: "Telefon" },
  "imprint.email": { en: "Email", de: "E-Mail" },
  "imprint.liabilityContentTitle": { en: "Liability for content", de: "Haftung für Inhalte" },
  "imprint.liabilityContent": {
    en: "The content of this site was created with care. However, I cannot guarantee that it is correct, complete or up to date.",
    de: "Die Inhalte dieser Seite wurden mit Sorgfalt erstellt. Für ihre Richtigkeit, Vollständigkeit und Aktualität kann ich jedoch keine Gewähr übernehmen.",
  },
  "imprint.liabilityLinksTitle": { en: "Liability for links", de: "Haftung für Links" },
  "imprint.liabilityLinks": {
    en: "This site contains links to external websites, for example in the credits. I have no influence on their content; the respective provider is responsible for it. No legal violations were apparent at the time of linking.",
    de: "Diese Seite enthält Links zu externen Websites, zum Beispiel in den Credits. Auf deren Inhalte habe ich keinen Einfluss, verantwortlich ist der jeweilige Anbieter. Zum Zeitpunkt der Verlinkung waren keine Rechtsverstöße erkennbar.",
  },
  "imprint.copyrightTitle": { en: "Copyright", de: "Urheberrecht" },
  "imprint.copyright": {
    en: "Third-party graphics, music and sounds belong to the authors named in the credits and are subject to their licenses. They may only be reused under the terms of those licenses.",
    de: "Grafiken, Musik und Sounds von Dritten gehören den in den Credits genannten Urhebern und unterliegen deren Lizenzen. Eine Weiterverwendung ist nur im Rahmen dieser Lizenzen erlaubt.",
  },
  "imprint.usageTitle": { en: "Terms of use", de: "Nutzung" },
  "imprint.usage": {
    en: "Hollowbloom is a non-commercial hobby and learning project and can be played for free in the browser. There is no claim to availability.",
    de: "Hollowbloom ist ein nicht-kommerzielles Hobby- und Lernprojekt und kann kostenlos im Browser gespielt werden. Ein Anspruch auf Verfügbarkeit besteht nicht.",
  },
  "imprint.noteTitle": { en: "Note", de: "Hinweis" },
  "imprint.note": {
    en: "This is a private, non-commercial hobby project. All details above are placeholder data.",
    de: "Dies ist ein privates, nicht kommerzielles Hobbyprojekt. Alle Angaben oben sind Platzhalterdaten.",
  },
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
  "settings.screenShakeHint": { en: "The camera shakes on hits", de: "Kamera wackelt bei Treffern" },
  "settings.damageFlash": { en: "Red damage flash", de: "Roter Treffer-Blitz" },
  "settings.damageFlashHint": { en: "Red screen edge when you take damage", de: "Roter Bildschirmrand, wenn du Schaden nimmst" },
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

  "victory.title": { en: "VICTORY!", de: "GEWONNEN!" },
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

/** Loads the saved language, binds the language select and translates the page. */
export function setupTranslation() {
  currentLanguage = loadLanguage();
  const languageSelectRef = document.getElementById("language-select");
  languageSelectRef.value = currentLanguage;
  languageSelectRef.addEventListener("change", handleLanguageChange);
  applyTranslation();
}

/**
 * Translates a text key into the current language.
 * @param {string} key - Translation key.
 * @returns {string} The translated text, the English fallback, or the key itself if unknown.
 */
export function translate(key) {
  const entry = TEXTS[key];
  if (!entry) return key;
  return entry[currentLanguage] ?? entry[DEFAULT_LANGUAGE];
}

/**
 * Registers a callback that runs after the language changes.
 * @param {Function} listener - Callback without arguments.
 */
export function onLanguageChange(listener) {
  languageChangeListeners.push(listener);
}

/**
 * Switches to the selected language, saves it and notifies listeners.
 * @param {Event} event - Change event of the language select.
 */
function handleLanguageChange(event) {
  currentLanguage = event.target.value;
  saveLanguage();
  applyTranslation();
  languageChangeListeners.forEach((listener) => listener());
}

/** Translates all elements with data-i18n or data-i18n-aria-label attributes. */
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

/**
 * Loads the saved language from localStorage.
 * @returns {string} A supported language code, defaulting to English.
 */
function loadLanguage() {
  try {
    const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return LANGUAGES.includes(savedLanguage) ? savedLanguage : DEFAULT_LANGUAGE;
  } catch (error) {
    console.error("Saved language could not be loaded.", error);
    return DEFAULT_LANGUAGE;
  }
}

/** Saves the current language to localStorage. */
function saveLanguage() {
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, currentLanguage);
  } catch (error) {
    console.error("Language could not be saved.", error);
  }
}
