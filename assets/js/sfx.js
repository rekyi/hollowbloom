import { appState } from "./data.js";

const SFX_FILES = {
  // Character
  femaleAttack1: getSfxPaths("character", "female_attack_1", 3),
  femaleAttack4: getSfxPaths("character", "female_attack_4", 2),
  maleAttack1: getSfxPaths("character", "male_attack_1", 3),
  maleAttack3: getSfxPaths("character", "male_attack_3", 3),
  femaleHurt: getSfxPaths("character", "female_hurt", 3),
  maleHurt: getSfxPaths("character", "male_hurt", 2),
  femaleWalk: getSfxPaths("character", "female_walk", 4),
  femaleRun: getSfxPaths("character", "female_run", 4),
  maleWalk: getSfxPaths("character", "male_walk", 4),
  maleRun: getSfxPaths("character", "male_run", 4),
  jumpStart: getSfxPaths("character", "jump_start", 3),
  jumpLand: getSfxPaths("character", "jump_land", 3),
  impactHit: getSfxPaths("character", "impact_hit", 3),
  spikesHit: getSfxPaths("character", "spikes_hit", 2),
  specialAttackUnlocked: getSfxPaths("character", "special_attack_unlocked", 2),
  // Enemies
  boarAttack: getSfxPaths("enemy", "boar_attack", 2),
  boarHurt: getSfxPaths("enemy", "boar_hurt", 3),
  boarDeath: getSfxPaths("enemy", "boar_death", 3),
  darkElfAttack0: getSfxPaths("enemy", "dark_elf_attack_0", 2),
  darkElfAttack1: getSfxPaths("enemy", "dark_elf_attack_1", 2),
  darkElfHurt: getSfxPaths("enemy", "dark_elf_hurt", 2),
  darkElfDeath: getSfxPaths("enemy", "dark_elf_death", 2),
  skeletonAttack0: getSfxPaths("enemy", "skeleton_attack_0", 2),
  skeletonAttack1: getSfxPaths("enemy", "skeleton_attack_1", 2),
  skeletonHurt: getSfxPaths("enemy", "skeleton_hurt", 3),
  skeletonDeath: getSfxPaths("enemy", "skeleton_death", 3),
  // Boss (Verdan)
  verdanBowDraw: getSfxPaths("boss", "verdan_attack_bow_draw", 2),
  verdanBowShoot: getSfxPaths("boss", "verdan_attack_bow_shoot", 2),
  verdanPulseLoad: getSfxPaths("boss", "verdan_pulse_load", 2),
  verdanPulseBurst: getSfxPaths("boss", "verdan_pulse_burst", 2),
  verdanRootSpike: getSfxPaths("boss", "verdan_root_spike", 3),
  verdanSeedArrowGround: getSfxPaths("boss", "verdan_seed_arrow_ground", 3),
  verdanHurt: getSfxPaths("boss", "verdan_hurt", 2),
  verdanRootStrike: getSfxPaths("boss", "verdan_root_strike", 2),
  verdanPhaseTransition: getSfxPaths("boss", "verdan_phase_transition", 2),
  verdanPhaseTransitionRoar: getSfxPaths("boss", "verdan_phase_transition_roar", 2),
  verdanDeath: getSfxPaths("boss", "verdan_death", 2),
  verdanDeathSprout: getSfxPaths("boss", "verdan_death_sprout", 2),
  verdanWalk: getSfxPaths("boss", "verdan_walk", 2),
  // World and UI
  coinCollect: ["world/coin_collect.ogg"],
  keyPickup: ["world/key_pickup.ogg"],
  ancientKeyPickup: ["world/ancient_key_pickup.ogg"],
  checkpointReached: ["world/checkpoint_reached.ogg"],
  exitPortalNormalLevel: ["world/exit_portal_normal_level.ogg"],
  exitPortalBossLevel: ["world/exit_portal_boss_level.ogg"],
  buttonClick: ["ui/button_click.ogg"],
};

const sounds = new Map();

export function setupSfx() {
  Object.entries(SFX_FILES).forEach(([name, files]) => {
    sounds.set(name, files.map(createSfx));
  });
  applySfxSettings();
  document.addEventListener("click", playButtonClickSfx);
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

function playButtonClickSfx(event) {
  const buttonRef = event.target.closest("button");
  if (buttonRef && !buttonRef.classList.contains("touch-button")) playSfx("buttonClick", { pitchVariation: 0 });
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
