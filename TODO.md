# Tasuku — to do

Captured 2026-09-17. Nothing here is started.

## Next session

### Store page: text gets cut off
Tile labels truncate, worst on the long ones — "400 short", "Rest of the day".
Restack each tile vertically instead of putting cost and duration side by side:

```
 [icon]
 120 XP
 40 mins of use
```

So: icon, then XP cost, then the duration spelled out as usable time. Three
lines, centred, nothing competing for the same row. Check it against the
longest tier label and the "N short" state, which is the one that breaks now.

### Make the app-locking page searchable
`LockSetupScreen` lists every launcher app. Needs a search field that filters
by label — the list is unusable on a phone with 120 apps installed.

### Notifications
Three separate cases, all local notifications (no server):

1. **Timer running while the app is backgrounded** — notify so a quest
   interrupted by a call or a text isn't forgotten. Pairs with the wall-clock
   timer already in place.
2. **Gentle daily reminders** — nudge toward an activity if nothing has been
   started today.
3. **Been away a while** — a softer prompt after some days of no app use.

Needs `expo-notifications`, a permission step added to the onboarding
permissions card, and an off switch in Settings alongside the music toggle.
Keep the tone of the existing copy: quiet, not nagging.

### Calendar: highlight the current time
The Today list should show where you actually are in the day — a marker or
highlight on the slot the clock is in.

### Calendar: bedtime message
When bedtime is active, the calendar shows:

> It's bed time — come back tomorrow to start your next quest

Bedtime state already exists (`isBedtimeActive` in `src/state/store.ts`, and
`BlockStore.isBedtimeNow` natively), so this is presentation only.

## Later — colour themes

Not soon. Recorded so it isn't lost.

Theme variations that keep the existing line-art illustration style and pastel
treatment, changing only the palette, the UI accents and the ambient audio:

| Theme | Palette | Vibe | Ambient bed |
| --- | --- | --- | --- |
| Current | Warm paper / ochre | Zen garden, sunrise | The Water Remains |
| Forest | Greens | Nature, woodland | Natural sounds — birds, leaves |
| Ocean | Blues | Water | Water sounds, waves |
| Space | Black and white | Night sky | Something sparse and cold |

Same illustrations redrawn to suit each vibe rather than recoloured wholesale.
The music changes with the theme, so `useAmbientBed` needs to take the track
from the active theme instead of a single bundled file, and `src/theme.ts`
needs to become a set of palettes selected at runtime rather than a frozen
object. Theme picker belongs in Settings.
