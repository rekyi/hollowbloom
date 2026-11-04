const APPLE_WEBKIT_VENDOR = "Apple Computer, Inc.";

/**
 * File extension of the audio files this browser loads.
 * Safari only plays Ogg since version 18.4 and not reliably, so Safari and every browser on iPhone and iPad
 * (they all use Safari's engine) get the AAC copies (.m4a). All other browsers keep the original Ogg files.
 */
export const AUDIO_EXTENSION = shouldUseAac() ? "m4a" : "ogg";

/**
 * Builds the path of an audio file in the format of this browser.
 * @param {string} pathWithoutExtension - Path like "assets/audio/music/gameplay".
 * @returns {string} Path with the matching file extension.
 */
export function getAudioPath(pathWithoutExtension) {
  return `${pathWithoutExtension}.${AUDIO_EXTENSION}`;
}

/**
 * Checks whether the AAC copies should be used instead of the Ogg files.
 * @returns {boolean} True for Safari's engine or a browser that cannot play Ogg Vorbis.
 */
function shouldUseAac() {
  const canPlayOgg = new Audio().canPlayType('audio/ogg; codecs="vorbis"') !== "";
  return navigator.vendor === APPLE_WEBKIT_VENDOR || !canPlayOgg;
}
