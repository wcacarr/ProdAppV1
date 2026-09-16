import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import {
  DeviceNowPlaying,
  getDeviceNowPlaying,
  isMediaSupported,
  isNotificationAccessGranted,
  mediaNext,
  mediaPause,
  mediaPlay,
  mediaPrevious,
  mediaSeekTo,
} from '../../modules/questlock-blocker';

export type MediaStatus = 'unsupported' | 'needs_permission' | 'idle' | 'active';

export function useNowPlaying(pollMs = 2000) {
  const [now, setNow] = useState<DeviceNowPlaying | null>(null);
  const [status, setStatus] = useState<MediaStatus>('unsupported');
  const [, forceTick] = useState(0);
  const fetchedAtRef = useRef(Date.now());

  const poll = useCallback(() => {
    if (!isMediaSupported) {
      setStatus('unsupported');
      return;
    }
    if (!isNotificationAccessGranted()) {
      setStatus('needs_permission');
      setNow(null);
      return;
    }
    const playing = getDeviceNowPlaying();
    fetchedAtRef.current = Date.now();
    setNow(playing);
    setStatus(playing ? 'active' : 'idle');
  }, []);

  useEffect(() => {
    poll();
    const interval = setInterval(poll, pollMs);
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') poll();
    });
    return () => {
      clearInterval(interval);
      sub.remove();
    };
  }, [poll, pollMs]);

  // Between polls the progress bar interpolates so it doesn't jump in steps.
  useEffect(() => {
    const t = setInterval(() => forceTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const liveProgressMs = now
    ? Math.min(
        now.durationMs || Number.MAX_SAFE_INTEGER,
        now.positionMs + (now.isPlaying ? Date.now() - fetchedAtRef.current : 0)
      )
    : 0;

  const togglePlay = () => {
    if (!now) return;
    const wasPlaying = now.isPlaying;
    setNow({ ...now, isPlaying: !wasPlaying });
    if (wasPlaying) mediaPause();
    else mediaPlay();
    setTimeout(poll, 400);
  };

  const next = () => {
    mediaNext();
    setTimeout(poll, 600);
  };

  const previous = () => {
    mediaPrevious();
    setTimeout(poll, 600);
  };

  const seekTo = (positionMs: number) => {
    if (!now) return;
    setNow({ ...now, positionMs });
    fetchedAtRef.current = Date.now();
    mediaSeekTo(positionMs);
    setTimeout(poll, 500);
  };

  return { now, status, liveProgressMs, togglePlay, next, previous, seekTo };
}
