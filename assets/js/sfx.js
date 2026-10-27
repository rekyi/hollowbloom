import { appState } from "./data.js";

const SFX_FILES = {
  femaleAttack1: getSfxPaths("character", "female_attack_1", 3),
  femaleAttack4: getSfxPaths("character", "female_attack_4", 2, "wav"),
  maleAttack1: getSfxPaths("character", "male_attack_1", 3),
  maleAttack3: getSfxPaths("character", "male_attack_3", 3),
  jumpingBefore: getSfxPaths("character", "jumping_before", 2, "wav"),
  jumpingAfter: getSfxPaths("character", "jumping_after", 2, "wav"),
  walking: getSfxPaths("character", "walking", 4),
  running: getSfxPaths("character", "running", 4, "wav"),
  enemyHit: getSfxPaths("enemy", "enemy_hit", 3),
  enemyDeath: ["enemy/enemy_death.mp3"],
  bossExplosion: ["boss/explosion_medium.wav"],
  finalBossDeath: ["boss/final_boss_death.wav"],
  coinCollect: ["items/coin_collect.wav"],
};

const sounds = new Map();

export function setupSfx() {
  Object.entries(SFX_FILES).forEach(([name, files]) => {
    sounds.set(name, files.map(createSfx));
  });
  applySfxSettings();
}

export function playSfx(name, { volume = 0.5, pitchVariation = 0.05 } = {}) {
  const soundVariants = sounds.get(name);
  if (!soundVariants) {
    console.error(`Unknown sound effect: ${name}`);
    return;
  }
  const sound = soundVariants[Math.floor(Math.random() * soundVariants.length)];
  playHowl(sound, volume, getRandomRate(pitchVariation));
}

export function applySfxSettings() {
  Howler.volume(appState.masterVolume * appState.soundEffectsVolume);
  Howler.mute(appState.isAudioMuted);
}

function createSfx(file) {
  return new Howl({
    src: [`assets/audio/sfx/${file}`],
    onloaderror: (soundId, error) => console.error(`Sound effect could not be loaded: ${file}`, error),
  });
}

function playHowl(sound, volume, rate) {
  const soundId = sound.play();
  sound.volume(volume, soundId);
  sound.rate(rate, soundId);
}

function getSfxPaths(directory, prefix, count, extension = "ogg") {
  return Array.from({ length: count }, (_, index) => `${directory}/${prefix}_${index}.${extension}`);
}

function getRandomRate(pitchVariation) {
  return 1 + (Math.random() * 2 - 1) * pitchVariation;
}
