const pendingPlays = new WeakMap();

export class AudioError {
  static play(sound) {
    cancelPendingPlay(sound);
    if (sound.error) reportLoadError(sound);
    else if (sound.readyState === 4) startSound(sound);
    else waitUntilReady(sound);
  }

  static pause(sound) {
    cancelPendingPlay(sound);
    sound.pause();
  }

  static stop(sound) {
    AudioError.pause(sound);
    if (sound.currentTime > 0) sound.currentTime = 0;
  }
}

function startSound(sound) {
  sound.play().catch((error) => {
    if (error.name !== "NotAllowedError") console.error("Audio playback failed.", sound.src, error);
  });
}

function waitUntilReady(sound) {
  const controller = new AbortController();
  const options = { once: true, signal: controller.signal };
  sound.addEventListener("canplaythrough", () => startSound(sound), options);
  sound.addEventListener("error", () => reportLoadError(sound), options);
  pendingPlays.set(sound, controller);
}

function cancelPendingPlay(sound) {
  pendingPlays.get(sound)?.abort();
}

function reportLoadError(sound) {
  console.error("Audio resource could not be loaded.", sound.src);
}
