import { useEffect, useRef, useState } from 'react';
import { NowPlaying, getCurrentlyPlaying, spotifyNext, spotifyPause, spotifyPlay, spotifyPrevious } from './api';
import { useSpotifyAuthStore } from './store';

export type DockStatus = 'disconnected' | 'connecting' | 'connected' | 'no_track' | 'no_device' | 'error';

export function useNowPlaying(pollMs = 4000) {
  const accessToken = useSpotifyAuthStore((s) => s.accessToken);
  const hydrate = useSpotifyAuthStore((s) => s.hydrate);
  const [now, setNow] = useState<NowPlaying | null>(null);
  const [status, setStatus] = useState<DockStatus>('connecting');
  const [, forceTick] = useState(0);
  const fetchedAtRef = useRef<number>(Date.now());

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!accessToken) {
      setStatus('disconnected');
      setNow(null);
      return;
    }
    let cancelled = false;

    const poll = async () => {
      const res = await getCurrentlyPlaying();
      if (cancelled) return;
      if (!res.ok) {
        setStatus(res.reason === 'unauthenticated' ? 'disconnected' : 'error');
        return;
      }
      fetchedAtRef.current = Date.now();
      setNow(res.data);
      setStatus(res.data ? 'connected' : 'no_track');
    };

    poll();
    const interval = setInterval(poll, pollMs);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [accessToken, pollMs]);

  useEffect(() => {
    const t = setInterval(() => forceTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const liveProgressMs = now
    ? Math.min(now.durationMs, now.progressMs + (now.isPlaying ? Date.now() - fetchedAtRef.current : 0))
    : 0;

  const togglePlay = async () => {
    if (!now) return;
    const wasPlaying = now.isPlaying;
    setNow({ ...now, isPlaying: !wasPlaying });
    const res = wasPlaying ? await spotifyPause() : await spotifyPlay();
    if (!res.ok) {
      setStatus(
        res.reason === 'no_active_device' ? 'no_device' : res.reason === 'unauthenticated' ? 'disconnected' : 'error'
      );
    }
  };

  const next = async () => {
    await spotifyNext();
  };
  const previous = async () => {
    await spotifyPrevious();
  };

  return { now, status, liveProgressMs, togglePlay, next, previous };
}
