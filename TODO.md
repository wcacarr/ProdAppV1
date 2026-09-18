# Tasuku — to do

## Later — colour themes

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

## Worth a look when the notifications have had a real day

Reminders are scheduled while the app is open, so nothing needs background
execution — but Samsung's battery optimisation can still delay or drop a
pending local notification. If the daily nudge turns out to be unreliable in
practice, the fix is to send people to
`Settings → Apps → Tasuku → Battery → Unrestricted`, ideally from a hint in
Settings next to the toggle.

## Done

- Store tiles restacked (icon / XP / duration), no more truncation
- Searchable app-locking page, locked apps pinned to the top
- Local notifications: quest-timer alert, daily nudge, been-away prompt
- Current time marked on the calendar
- Bedtime message on the calendar
