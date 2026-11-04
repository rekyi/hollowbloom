const IGNORED_PLAY_ERRORS = ["NotAllowedError", "AbortError"];

/** Safe playback helpers for HTML audio that log errors. */
export class AudioError {
  /**
   * Plays a sound. play() is called right away, even before the file has loaded, because iOS Safari
   * only loads and starts audio that is played directly inside a click and never fires "canplaythrough" before.
   * @param {HTMLAudioElement} sound - Sound to play.
   */
  static play(sound) {
    if (sound.error) reportLoadError(sound);
    else startSound(sound);
  }

  /**
   * Pauses a sound. A play that is still loading is cancelled as well.
   * @param {HTMLAudioElement} sound - Sound to pause.
   */
  static pause(sound) {
    sound.pause();
  }

  /**
   * Pauses a sound and rewinds it to the start.
   * @param {HTMLAudioElement} sound - Sound to stop.
   */
  static stop(sound) {
    AudioError.pause(sound);
    if (sound.currentTime > 0) sound.currentTime = 0;
  }
}

/**
 * Starts playback and logs failures other than blocked autoplay or a play cancelled by pause().
 * @param {HTMLAudioElement} sound - Sound to play.
 */
function startSound(sound) {
  sound.play().catch((error) => {
    if (!IGNORED_PLAY_ERRORS.includes(error.name)) console.error("Audio playback failed.", sound.src, error);
  });
}

/**
 * Logs that a sound could not be loaded.
 * @param {HTMLAudioElement} sound - Failed sound.
 */
function reportLoadError(sound) {
  console.error("Audio resource could not be loaded.", sound.src);
}
