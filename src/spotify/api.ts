import { useSpotifyAuthStore } from './store';

export type NowPlaying = {
  isPlaying: boolean;
  trackName: string;
  artistName: string;
  progressMs: number;
  durationMs: number;
  albumArtUrl: string | null;
};

export type SpotifyResult<T> =
  | { ok: true; data: T }
  | { ok: false; reason: 'unauthenticated' | 'no_active_device' | 'premium_required' | 'error'; message?: string };

const BASE = 'https://api.spotify.com/v1';

async function spotifyFetch(path: string, init: RequestInit = {}): Promise<Response | null> {
  const token = await useSpotifyAuthStore.getState().getValidAccessToken();
  if (!token) return null;
  return fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
}

export async function getCurrentlyPlaying(): Promise<SpotifyResult<NowPlaying | null>> {
  try {
    const res = await spotifyFetch('/me/player/currently-playing');
    if (!res) return { ok: false, reason: 'unauthenticated' };
    if (res.status === 204) return { ok: true, data: null };
    if (res.status === 401) return { ok: false, reason: 'unauthenticated' };
    if (!res.ok) return { ok: false, reason: 'error', message: `HTTP ${res.status}` };
    const json = await res.json();
    if (!json || !json.item) return { ok: true, data: null };
    const images: { url: string }[] = json.item.album?.images ?? [];
    const art = images[images.length - 1]?.url ?? images[0]?.url ?? null;
    return {
      ok: true,
      data: {
        isPlaying: !!json.is_playing,
        trackName: json.item.name ?? '',
        artistName: (json.item.artists ?? []).map((a: { name: string }) => a.name).join(', '),
        progressMs: json.progress_ms ?? 0,
        durationMs: json.item.duration_ms ?? 0,
        albumArtUrl: art,
      },
    };
  } catch (e) {
    return { ok: false, reason: 'error', message: e instanceof Error ? e.message : String(e) };
  }
}

async function transportControl(path: string, method: 'PUT' | 'POST'): Promise<SpotifyResult<null>> {
  try {
    const res = await spotifyFetch(path, { method });
    if (!res) return { ok: false, reason: 'unauthenticated' };
    if (res.status === 401) return { ok: false, reason: 'unauthenticated' };
    if (res.status === 403) return { ok: false, reason: 'premium_required' };
    if (res.status === 404) return { ok: false, reason: 'no_active_device' };
    if (!res.ok) return { ok: false, reason: 'error', message: `HTTP ${res.status}` };
    return { ok: true, data: null };
  } catch (e) {
    return { ok: false, reason: 'error', message: e instanceof Error ? e.message : String(e) };
  }
}

export const spotifyPlay = () => transportControl('/me/player/play', 'PUT');
export const spotifyPause = () => transportControl('/me/player/pause', 'PUT');
export const spotifyNext = () => transportControl('/me/player/next', 'POST');
export const spotifyPrevious = () => transportControl('/me/player/previous', 'POST');
