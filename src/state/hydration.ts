import { DayWindow, SLOT_MIN } from './schedule';
import { Quest, isWaterQuest } from './types';

export { isWaterQuest };

/**
 * The NHS Eatwell Guide asks for six to eight glasses of fluid a day, roughly
 * 1.2–2 litres; EFSA puts adequate total intake at 2.0 litres for women and 2.5
 * for men, of which they expect 70–80% to come from drinks. Eight is the middle
 * of the NHS range and the number people already have in their heads, so it is
 * the default — and it is a setting, because none of this is one-size-fits-all.
 */
export const DEFAULT_GLASSES = 8;
export const MIN_GLASSES = 4;
export const MAX_GLASSES = 12;

/** Each glass is a moment, not a task. */
export const WATER_MINS = 1;

/**
 * Deliberately tiny. Eight glasses at the normal ten-XP floor would pay more
 * than a forty-minute study block for doing nothing — the glasses are a nudge,
 * not a way to earn screen time.
 */
export const WATER_XP = 2;

/**
 * Spreads the glasses across the waking window, stopping an hour before the end
 * of it — a glass at the moment the day closes helps nobody, and drinking late
 * mostly just interrupts sleep.
 */
export function waterTimes(glasses: number, w: DayWindow): number[] {
  const count = Math.max(MIN_GLASSES, Math.min(MAX_GLASSES, Math.round(glasses)));
  const last = Math.max(w.startMin, w.endMin - 60);
  const span = last - w.startMin;
  if (span <= 0) return [w.startMin];

  const step = span / (count - 1);
  const times: number[] = [];
  for (let i = 0; i < count; i++) {
    const raw = w.startMin + step * i;
    times.push(Math.round(raw / SLOT_MIN) * SLOT_MIN);
  }
  // Snapping can collide on a very short day; keep them distinct.
  return [...new Set(times)];
}

/** Rebuilds today's glasses, leaving everything the user wrote alone. */
export function withWaterQuests(
  quests: Quest[],
  enabled: boolean,
  glasses: number,
  w: DayWindow
): Quest[] {
  const mine = quests.filter((q) => !isWaterQuest(q));
  if (!enabled) return mine;

  const times = waterTimes(glasses, w);
  const generated: Quest[] = times.map((startMin, i) => ({
    // Stable per slot, so re-running this does not duplicate or churn ids.
    id: WATER_ID_BASE + i,
    name: `Drink water · glass ${i + 1}`,
    mins: WATER_MINS,
    glyph: 'W',
    done: false,
    needsPhoto: false,
    repeat: false,
    kind: 'water',
    startMin,
  }));

  // Keep any glass already ticked off today ticked.
  const doneIds = new Set(quests.filter((q) => isWaterQuest(q) && q.done).map((q) => q.id));
  return [...mine, ...generated.map((q) => (doneIds.has(q.id) ? { ...q, done: true } : q))];
}

/** Far above Date.now() ids so generated quests never collide with written ones. */
const WATER_ID_BASE = -1000;
