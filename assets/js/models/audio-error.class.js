const pendingPlays = new WeakMap();

/** Safe playback helpers for HTML audio that wait for loading and log errors. */
export class AudioError {
  /**
   * Plays a sound now or as soon as it can play through.
   * @param {HTMLAudioElement} sound - Sound to play.
   */
  static play(sound) {
    cancelPendingPlay(sound);
    if (sound.error) reportLoadError(sound);
    else if (sound.readyState === 4) startSound(sound);
    else waitUntilReady(sound);
  }

  /**
   * Pauses a sound and cancels a pending play.
   * @param {HTMLAudioElement} sound - Sound to pause.
   */
  static pause(sound) {
    cancelPendingPlay(sound);
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
 * Starts playback and logs failures other than blocked autoplay.
 * @param {HTMLAudioElement} sound - Sound to play.
 */
function startSound(sound) {
  sound.play().catch((error) => {
    if (error.name !== "NotAllowedError") console.error("Audio playback failed.", sound.src, error);
  });
}

/**
 * Starts the sound once it can play through, or reports a load error.
 * @param {HTMLAudioElement} sound - Sound to play.
 */
function waitUntilReady(sound) {
  const controller = new AbortController();
  const options = { once: true, signal: controller.signal };
  sound.addEventListener("canplaythrough", () => startSound(sound), options);
  sound.addEventListener("error", () => reportLoadError(sound), options);
  pendingPlays.set(sound, controller);
}

/**
 * Cancels a play that is waiting for the sound to load.
 * @param {HTMLAudioElement} sound - Sound with a pending play.
 */
function cancelPendingPlay(sound) {
  pendingPlays.get(sound)?.abort();
}

/**
 * Logs that a sound could not be loaded.
 * @param {HTMLAudioElement} sound - Failed sound.
 */
function reportLoadError(sound) {
  console.error("Audio resource could not be loaded.", sound.src);
}
