const pendingPlays = new WeakMap();
const monitoredSounds = new WeakSet();

export class AudioError {
  static play(sound) {
    monitorAudioErrors(sound);
    if (sound.readyState === 4) {
      playSound(sound);
      return;
    }
    if (!pendingPlays.has(sound)) waitForSound(sound);
  }

  static pause(sound) {
    cancelPendingPlay(sound);
    sound.pause();
  }

  static stop(sound) {
    AudioError.pause(sound);
    sound.currentTime = 0;
  }
}

function monitorAudioErrors(sound) {
  if (monitoredSounds.has(sound)) return;
  sound.addEventListener("error", handleAudioError);
  monitoredSounds.add(sound);
}

function handleAudioError(event) {
  console.error("Audio resource could not be loaded.", event.currentTarget.error || event);
}

function waitForSound(sound) {
  const onCanPlaythrough = () => {
    cancelPendingPlay(sound);
    if (sound.readyState === 4) playSound(sound);
  };
  const onError = () => cancelPendingPlay(sound);
  pendingPlays.set(sound, { onCanPlaythrough, onError });
  sound.addEventListener("canplaythrough", onCanPlaythrough, { once: true });
  sound.addEventListener("error", onError, { once: true });
}

function cancelPendingPlay(sound) {
  const pendingPlay = pendingPlays.get(sound);
  if (!pendingPlay) return;
  sound.removeEventListener("canplaythrough", pendingPlay.onCanPlaythrough);
  sound.removeEventListener("error", pendingPlay.onError);
  pendingPlays.delete(sound);
}

function playSound(sound) {
  sound.play().catch(handlePlayRejection);
}

function handlePlayRejection(error) {
  if (error?.name === "NotAllowedError") return;
  console.error("Audio playback failed.", error);
}
