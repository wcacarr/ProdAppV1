import { createAudioPlayer } from 'expo-audio';
import { safePlay } from './safePlay';
import { configureAudioMode } from './audioMode';

// Finishing a quest rings the same zen bell as the splash — warmer than the
// synthesized three-note chime that was here before, and it ties the two
// moments together.
export function playDing() {
  try {
    configureAudioMode();
    const player = createAudioPlayer(require('../../assets/sounds/bell.wav'));
    safePlay(player);
    setTimeout(() => {
      try {
        player.release();
      } catch {
        // already released
      }
    }, 2600);
  } catch {
    // no audio available on this device/platform — non-fatal
  }
}
