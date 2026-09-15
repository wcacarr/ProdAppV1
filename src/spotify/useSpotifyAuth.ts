import { useEffect } from 'react';
import * as WebBrowser from 'expo-web-browser';
import { exchangeCodeAsync, makeRedirectUri, useAuthRequest } from 'expo-auth-session';
import { SPOTIFY_CLIENT_ID, SPOTIFY_DISCOVERY, SPOTIFY_REDIRECT_PATH, SPOTIFY_SCOPES } from './config';
import { useSpotifyAuthStore } from './store';

WebBrowser.maybeCompleteAuthSession();

export function spotifyRedirectUri() {
  return makeRedirectUri({ scheme: 'prodappv1', path: SPOTIFY_REDIRECT_PATH });
}

export function useSpotifyAuth() {
  const setTokens = useSpotifyAuthStore((s) => s.setTokens);
  const redirectUri = spotifyRedirectUri();

  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: SPOTIFY_CLIENT_ID,
      scopes: SPOTIFY_SCOPES,
      redirectUri,
    },
    SPOTIFY_DISCOVERY
  );

  useEffect(() => {
    if (response?.type !== 'success' || !request) return;
    const { code } = response.params;
    exchangeCodeAsync(
      {
        clientId: SPOTIFY_CLIENT_ID,
        code,
        redirectUri,
        extraParams: { code_verifier: request.codeVerifier ?? '' },
      },
      SPOTIFY_DISCOVERY
    )
      .then((result) =>
        setTokens({
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          expiresIn: result.expiresIn,
        })
      )
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response]);

  return {
    connect: () => promptAsync(),
    requestReady: !!request,
    clientConfigured: !!SPOTIFY_CLIENT_ID,
    authError: response?.type === 'error' ? response.error?.message ?? 'Spotify login failed' : null,
  };
}
