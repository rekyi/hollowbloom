import { BOSS_INTRO_MUSIC_MS, bossIntroMusic, bossMusic, bossRageMusic, gameplayMusic } from "../data.js";
import { cancelMusicFade, fadeMusic, setMusicFadeLevel } from "../music-fade.js";
import { AudioError } from "./audio-error.class.js";

const TRACK_CHANGE_FADE_MS = 1000;
const RAGE_TRANSITION_FADE_MS = 1200;

class GameMusic {
  tracks = [gameplayMusic, bossIntroMusic, bossMusic, bossRageMusic];
  currentTrack = null;

  constructor() {
    gameplayMusic.loop = true;
    bossMusic.loop = true;
    bossRageMusic.loop = true;
    bossIntroMusic.addEventListener("ended", () => this.startBossLoop());
  }

  get isPlaying() {
    return Boolean(this.currentTrack) && !this.currentTrack.paused;
  }

  playGameplayMusic() {
    this.switchTo(gameplayMusic);
  }

  playBossMusic(introElapsedMs) {
    this.switchTo(introElapsedMs < BOSS_INTRO_MUSIC_MS ? bossIntroMusic : bossMusic);
  }

  startBossLoop() {
    if (this.currentTrack !== bossIntroMusic) return;
    AudioError.stop(bossIntroMusic);
    this.currentTrack = bossMusic;
    this.startTrack(bossMusic);
  }

  startRageTransition() {
    this.fadeOutCurrentTrack(RAGE_TRANSITION_FADE_MS);
  }

  playRageMusic() {
    this.switchTo(bossRageMusic);
  }

  switchTo(track) {
    if (this.currentTrack === track) return;
    this.fadeOutCurrentTrack(TRACK_CHANGE_FADE_MS);
    this.currentTrack = track;
    this.startTrack(track);
  }

  startTrack(track) {
    setMusicFadeLevel(track, 1);
    AudioError.play(track);
  }

  fadeOutCurrentTrack(durationMs) {
    const track = this.currentTrack;
    this.currentTrack = null;
    if (track) fadeMusic(track, 0, durationMs, () => AudioError.stop(track));
  }

  pause() {
    this.tracks.forEach((track) => AudioError.pause(track));
  }

  resume() {
    if (this.currentTrack) AudioError.play(this.currentTrack);
  }

  stop() {
    this.currentTrack = null;
    this.tracks.forEach((track) => {
      cancelMusicFade(track);
      AudioError.stop(track);
    });
  }
}

export const gameMusic = new GameMusic();
