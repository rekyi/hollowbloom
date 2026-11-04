import { BOSS_INTRO_MUSIC_MS, bossIntroMusic, bossMusic, bossRageMusic, gameplayMusic } from "../data.js";
import { cancelMusicFade, fadeMusic, setMusicFadeLevel } from "../music-fade.js";
import { AudioError } from "./audio-error.class.js";

const TRACK_CHANGE_FADE_MS = 1000;
const RAGE_TRANSITION_FADE_MS = 1200;

/** Controls in-game music: gameplay, boss intro, boss loop and rage music with crossfades. */
class GameMusic {
  tracks = [gameplayMusic, bossIntroMusic, bossMusic, bossRageMusic];
  currentTrack = null;

  /** Sets looping tracks and chains the boss intro into the boss loop. */
  constructor() {
    gameplayMusic.loop = true;
    bossMusic.loop = true;
    bossRageMusic.loop = true;
    bossIntroMusic.addEventListener("ended", () => this.startBossLoop());
  }

  /**
   * Whether a track is currently playing.
   * @returns {boolean} True if the current track is not paused.
   */
  get isPlaying() {
    return Boolean(this.currentTrack) && !this.currentTrack.paused;
  }

  /** Switches to the gameplay music. */
  playGameplayMusic() {
    this.switchTo(gameplayMusic);
  }

  /**
   * Switches to the boss intro, or straight to the boss loop if the intro is over.
   * @param {number} introElapsedMs - Time since the boss intro started.
   */
  playBossMusic(introElapsedMs) {
    this.switchTo(introElapsedMs < BOSS_INTRO_MUSIC_MS ? bossIntroMusic : bossMusic);
  }

  /** Starts the boss loop after the intro track has ended. */
  startBossLoop() {
    if (this.currentTrack !== bossIntroMusic) return;
    AudioError.stop(bossIntroMusic);
    this.currentTrack = bossMusic;
    this.startTrack(bossMusic);
  }

  /** Fades out the current track for the rage transition. */
  startRageTransition() {
    this.fadeOutCurrentTrack(RAGE_TRANSITION_FADE_MS);
  }

  /** Switches to the rage music. */
  playRageMusic() {
    this.switchTo(bossRageMusic);
  }

  /**
   * Fades out the current track and starts another.
   * @param {HTMLAudioElement} track - Track to play.
   */
  switchTo(track) {
    if (this.currentTrack === track) return;
    this.fadeOutCurrentTrack(TRACK_CHANGE_FADE_MS);
    this.currentTrack = track;
    this.startTrack(track);
  }

  /**
   * Plays a track at full fade level.
   * @param {HTMLAudioElement} track - Track to play.
   */
  startTrack(track) {
    setMusicFadeLevel(track, 1);
    AudioError.play(track);
  }

  /**
   * Fades out and then stops the current track.
   * @param {number} durationMs - Fade duration in milliseconds.
   */
  fadeOutCurrentTrack(durationMs) {
    const track = this.currentTrack;
    this.currentTrack = null;
    if (track) fadeMusic(track, 0, durationMs, () => AudioError.stop(track));
  }

  /** Pauses all game tracks. */
  pause() {
    this.tracks.forEach((track) => AudioError.pause(track));
  }

  /** Resumes the current track. */
  resume() {
    if (this.currentTrack) AudioError.play(this.currentTrack);
  }

  /** Stops all game tracks and cancels their fades. */
  stop() {
    this.currentTrack = null;
    this.tracks.forEach((track) => {
      cancelMusicFade(track);
      AudioError.stop(track);
    });
  }
}

export const gameMusic = new GameMusic();
