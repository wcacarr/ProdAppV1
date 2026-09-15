# Questlock

Gamified productivity app for ADHD: real-life quests earn XP, XP buys timed
unlocks for the apps you'd otherwise doomscroll, and a Spotify dock keeps a
focus playlist within reach. React Native (Expo) implementation of the
`Questlock v2` design.

## Setup

```
npm install
cp .env.example .env
```

### Spotify

Playback in the bottom dock is real Spotify Web API data — no mock queue.
It needs a Spotify Developer app:

1. Go to https://developer.spotify.com/dashboard and create an app.
2. Add this Redirect URI exactly: `prodappv1://spotify-auth-callback`
3. Copy the Client ID into `.env` as `EXPO_PUBLIC_SPOTIFY_CLIENT_ID`.

The Web API only *controls* an existing Spotify session (Premium account,
Spotify app open somewhere) — it doesn't stream audio itself. If nothing is
playing, the dock prompts to open Spotify first.

## Run

```
npx expo start
```

Requires a development build (`npx expo run:android`) or an EAS dev client
for the Spotify OAuth redirect and native modules to work — the custom
`prodappv1://` scheme does not resolve inside plain Expo Go.

## Structure

- `src/theme.ts` — palette/fonts/tokens ported from the design
- `src/state/` — quest/XP/app-lock state (zustand)
- `src/spotify/` — OAuth (PKCE) + Web API polling for the player dock
- `src/screens/` — Today / Store / Apps / Focus / Reward / Block panes
- `src/components/` — glass pane primitive, nature background, dock, sheet, toast
