import { setAudioModeAsync } from 'expo-audio';

/**
 * Tasuku's own sounds must never interrupt anything else.
 *
 * expo-audio defaults to `doNotMix`, which takes exclusive audio focus the
 * moment we play anything — so opening the app paused whatever podcast or
 * audiobook was already going, and the reward chime would have done the same
 * mid-quest. `mixWithOthers` keeps our ambient bed and chime out of the focus
 * system entirely; they sit under whatever is playing instead of stopping it.
 *
 * Idempotent, so every entry point can call it without coordinating.
 */
let configured = false;

export function configureAudioMode() {
  if (configured) return;
  configured = true;
  setAudioModeAsync({
    interruptionMode: 'mixWithOthers',
    shouldPlayInBackground: false,
  }).catch(() => {
    // Older devices may refuse; the sounds still work, they just take focus.
    configured = false;
  });
}
