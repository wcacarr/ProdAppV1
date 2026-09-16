# Questlock

Gamified productivity app for ADHD: real-life quests earn XP, XP buys timed
unlocks for the apps you'd otherwise doomscroll. React Native (Expo) UI with a
Kotlin native module doing the actual app blocking. Android only.

## Run the UI

```
npm install
npx expo start
```

The quest/XP/store/focus screens all work in Expo Go. App locking does not —
it needs the native module, so the Lock tab shows a "needs a dev build"
message until you build for a device.

## Test app locking (dev build required)

```
npx expo prebuild --platform android
npx expo run:android          # real device recommended
```

Then on the device:

1. Open the **Lock** tab (dev builds only).
2. Tap **Turn on** — this opens Android's Accessibility settings. Enable
   "Questlock app locking". Android will warn about the permission; that's
   expected, the service only reads which app came to the foreground.
3. Come back to Questlock. The tab should now say "Enforcement is on".
4. Tick an app to lock it, then leave Questlock and open that app.
   You should be bounced back to the home screen.
5. Tap **+1 min** next to a locked app, then open it again — it should open
   normally until the minute runs out. That's the XP purchase mechanic.

### What to watch for

- **Bounce works but the Questlock block screen doesn't appear.** Expected on
  newer Android: background activity launch is restricted. The HOME action is
  the real enforcement; surfacing our own screen is best-effort and may need
  the "Display over other apps" permission instead.
- **Service switches itself off.** Android kills accessibility services under
  aggressive battery optimisation (bad on Samsung/Xiaomi). Exempting Questlock
  from battery optimisation is the usual fix.
- **A locked app opens anyway.** Note which app and how you opened it
  (launcher, recents, notification) — the window-change event isn't fired
  identically in every case.

## Known limits

App blocking on Android has no official API. This uses the same approach as
Opal/ScreenZen — an AccessibilityService watching foreground app changes. A
user can always disable it in system Settings; it creates friction, not a
cage. Only Device Owner provisioning (enterprise, requires factory reset) is
truly unbypassable.

The accessibility service must decide in milliseconds with no JS running, so
lock rules live in native `SharedPreferences` (`BlockStore.kt`), written by the
RN UI. Native is the source of truth, not the zustand store.

Play Store: using AccessibilityService for non-accessibility purposes needs a
digital-wellbeing justification and prominent disclosure at review. Installed
apps are read via a launcher-intent `<queries>` block specifically to avoid
`QUERY_ALL_PACKAGES` and its separate declaration.

## Structure

- `modules/questlock-blocker/` — Kotlin native module: accessibility service,
  block store, installed-app list, permission flows
- `src/theme.ts` — palette/fonts ported from the Claude Design handoff
- `src/state/` — quest/XP game logic (zustand)
- `src/screens/` — Today / Store / Apps / Focus / Reward / Block panes,
  plus the Lock spike screen
- `src/media/` — seam for device-wide media control (MediaSession), not built yet
