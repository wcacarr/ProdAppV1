import { createAudioPlayer } from 'expo-audio';
import { safePlay } from './safePlay';

// Reward chime: a 3-note triangle-wave ding synthesized offline into
// assets/sounds/ding.wav (see the original Web Audio version in
// project/Questlock v2.dc.html's Component.ding()).
export function playDing() {
  try {
    const player = createAudioPlayer(require('../../assets/sounds/ding.wav'));
    safePlay(player);
    setTimeout(() => {
      try {
        player.release();
      } catch {
        // already released
      }
    }, 1200);
  } catch {
    // no audio available on this device/platform — non-fatal
  }
}
