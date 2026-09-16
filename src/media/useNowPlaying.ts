export type NowPlaying = {
  isPlaying: boolean;
  trackName: string;
  artistName: string;
  progressMs: number;
  durationMs: number;
  albumArtUrl: string | null;
};

// Seam for device-wide media control (MediaSessionManager via a notification
// listener). Until that native module exists the dock renders its empty state.
export function useNowPlaying() {
  return {
    now: null as NowPlaying | null,
    liveProgressMs: 0,
    togglePlay: () => {},
    next: () => {},
    previous: () => {},
  };
}
