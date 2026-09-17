import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { createAudioPlayer } from 'expo-audio';
import { safePlay } from '../sound/safePlay';

const VOLUME = 0.22;

type Player = ReturnType<typeof createAudioPlayer>;

/**
 * A quiet drone under the app when nothing else is playing. It yields the
 * moment anything real starts — the point is atmosphere, not competing with
 * the audiobook the user came here to listen to.
 */
export function useAmbientBed(mediaPlaying: boolean, enabled = true) {
  const playerRef = useRef<Player | null>(null);
  const playingRef = useRef(false);

  useEffect(() => {
    try {
      const player = createAudioPlayer(require('../../assets/sounds/ambient.mp3'));
      player.loop = true;
      player.volume = VOLUME;
      playerRef.current = player;
    } catch {
      playerRef.current = null;
    }
    return () => {
      try {
        playerRef.current?.release();
      } catch {
        // already gone
      }
      playerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;

    const shouldPlay = enabled && !mediaPlaying && AppState.currentState === 'active';

    try {
      if (shouldPlay && !playingRef.current) {
        safePlay(player);
        playingRef.current = true;
      } else if (!shouldPlay && playingRef.current) {
        player.pause();
        playingRef.current = false;
      }
    } catch {
      // device refused playback; not worth surfacing
    }
  }, [mediaPlaying, enabled]);

  // Never leave the drone running once the app is backgrounded.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      const player = playerRef.current;
      if (!player) return;
      try {
        if (state !== 'active' && playingRef.current) {
          player.pause();
          playingRef.current = false;
        } else if (state === 'active' && !playingRef.current && !mediaPlaying && enabled) {
          safePlay(player);
          playingRef.current = true;
        }
      } catch {
        // ignore
      }
    });
    return () => sub.remove();
  }, [mediaPlaying, enabled]);
}
