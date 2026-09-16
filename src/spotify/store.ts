import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';
import { refreshAsync } from 'expo-auth-session';
import { SPOTIFY_CLIENT_ID, SPOTIFY_DISCOVERY } from './config';

const KEY_ACCESS = 'spotify_access_token';
const KEY_REFRESH = 'spotify_refresh_token';
const KEY_EXPIRES = 'spotify_expires_at';

type SpotifyAuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
  hydrated: boolean;

  hydrate: () => Promise<void>;
  setTokens: (tokens: { accessToken: string; refreshToken?: string | null; expiresIn?: number | null }) => Promise<void>;
  clear: () => Promise<void>;
  getValidAccessToken: () => Promise<string | null>;
};

async function persist(access: string | null, refresh: string | null, expiresAt: number | null) {
  if (access) await SecureStore.setItemAsync(KEY_ACCESS, access);
  else await SecureStore.deleteItemAsync(KEY_ACCESS).catch(() => {});
  if (refresh) await SecureStore.setItemAsync(KEY_REFRESH, refresh);
  else await SecureStore.deleteItemAsync(KEY_REFRESH).catch(() => {});
  if (expiresAt) await SecureStore.setItemAsync(KEY_EXPIRES, String(expiresAt));
  else await SecureStore.deleteItemAsync(KEY_EXPIRES).catch(() => {});
}

export const useSpotifyAuthStore = create<SpotifyAuthState>((set, get) => ({
  accessToken: null,
  refreshToken: null,
  expiresAt: null,
  hydrated: false,

  hydrate: async () => {
    if (get().hydrated) return;
    try {
      const [accessToken, refreshToken, expiresAtRaw] = await Promise.all([
        SecureStore.getItemAsync(KEY_ACCESS),
        SecureStore.getItemAsync(KEY_REFRESH),
        SecureStore.getItemAsync(KEY_EXPIRES),
      ]);
      set({
        accessToken,
        refreshToken,
        expiresAt: expiresAtRaw ? Number(expiresAtRaw) : null,
        hydrated: true,
      });
    } catch {
      set({ hydrated: true });
    }
  },

  setTokens: async ({ accessToken, refreshToken, expiresIn }) => {
    const expiresAt = expiresIn ? Date.now() + expiresIn * 1000 : null;
    const nextRefresh = refreshToken ?? get().refreshToken;
    set({ accessToken, refreshToken: nextRefresh, expiresAt });
    await persist(accessToken, nextRefresh, expiresAt);
  },

  clear: async () => {
    set({ accessToken: null, refreshToken: null, expiresAt: null });
    await persist(null, null, null);
  },

  getValidAccessToken: async () => {
    await get().hydrate();
    const s = get();
    if (!s.accessToken) return null;
    const freshEnough = !s.expiresAt || s.expiresAt - Date.now() > 60_000;
    if (freshEnough) return s.accessToken;
    if (!s.refreshToken) return s.accessToken;
    try {
      const result = await refreshAsync(
        { clientId: SPOTIFY_CLIENT_ID, refreshToken: s.refreshToken },
        SPOTIFY_DISCOVERY
      );
      await get().setTokens({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken ?? s.refreshToken,
        expiresIn: result.expiresIn,
      });
      return result.accessToken;
    } catch {
      await get().clear();
      return null;
    }
  },
}));
