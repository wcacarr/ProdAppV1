import { Quest } from './types';

/** The stretch of the day quests can be scheduled in, in minutes from midnight. */
export type DayWindow = { startMin: number; endMin: number };

/** Nine-to-five plus a margin either side. Overridable in Settings. */
export const DEFAULT_WINDOW: DayWindow = { startMin: 7 * 60, endMin: 19 * 60 };

/** Calendar granularity, same as Outlook's default. */
export const SLOT_MIN = 15;

/** A window narrower than this cannot hold a useful day. */
export const MIN_WINDOW_MIN = 60;

export function clampToWindow(min: number, w: DayWindow) {
  const snapped = Math.round(min / SLOT_MIN) * SLOT_MIN;
  return Math.min(w.endMin, Math.max(w.startMin, snapped));
}

/** Rounds up, so a slot derived from an end time never lands before it. */
export function ceilToWindow(min: number, w: DayWindow) {
  const snapped = Math.ceil(min / SLOT_MIN) * SLOT_MIN;
  return Math.min(w.endMin, Math.max(w.startMin, snapped));
}

/** "7:00 AM" / "12:30 PM" — matched to how the day reads out loud. */
export function formatSlot(min: number) {
  const wrapped = ((min % 1440) + 1440) % 1440;
  const h24 = Math.floor(wrapped / 60);
  const m = wrapped % 60;
  const suffix = h24 < 12 ? 'AM' : 'PM';
  const h = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h}:${String(m).padStart(2, '0')} ${suffix}`;
}

/** Short form for the left gutter, where the column is narrow. */
export function formatSlotShort(min: number) {
  const wrapped = ((min % 1440) + 1440) % 1440;
  const h24 = Math.floor(wrapped / 60);
  const m = wrapped % 60;
  const h = h24 % 12 === 0 ? 12 : h24 % 12;
  const suffix = h24 < 12 ? 'am' : 'pm';
  return m === 0 ? `${h}${suffix}` : `${h}:${String(m).padStart(2, '0')}${suffix}`;
}

/** "7AM – 7PM", for headers. */
export function windowLabel(w: DayWindow) {
  return `${formatSlotShort(w.startMin).toUpperCase()} – ${formatSlotShort(w.endMin).toUpperCase()}`;
}

export function endOf(quest: Quest) {
  return quest.startMin + quest.mins;
}

/** Every slot a quest can be dropped on. */
export function slotChoices(w: DayWindow): number[] {
  const out: number[] = [];
  for (let m = w.startMin; m <= w.endMin; m += SLOT_MIN) out.push(m);
  return out;
}

/** Every quarter hour in the whole day, for settings times that are not bound
 *  to the work window. */
export function allDaySlots(): number[] {
  const out: number[] = [];
  for (let m = 0; m < 1440; m += SLOT_MIN) out.push(m);
  return out;
}

export function byStart(a: Quest, b: Quest) {
  return a.startMin - b.startMin || a.id - b.id;
}

export function sortedByStart(quests: Quest[]): Quest[] {
  return [...quests].sort(byStart);
}

/** First slot after everything already booked, so a new quest lands at the end
 *  of the day rather than on top of something. */
export function nextFreeSlot(quests: Quest[], mins: number, w: DayWindow): number {
  const latestEnd = quests.reduce((acc, q) => Math.max(acc, endOf(q)), w.startMin);
  const candidate = ceilToWindow(latestEnd, w);
  // Keep it inside the window even when the day is already full.
  return Math.min(candidate, Math.max(w.startMin, w.endMin - mins));
}

/** True when this quest overlaps another, so the row can say so. */
export function overlaps(quest: Quest, quests: Quest[]) {
  return quests.some(
    (other) =>
      other.id !== quest.id && quest.startMin < endOf(other) && other.startMin < endOf(quest)
  );
}

/** Total booked time, for the day-length readout. */
export function bookedMinutes(quests: Quest[]) {
  return quests.reduce((acc, q) => acc + q.mins, 0);
}

/**
 * Moves a quest to a different position in the day. The set of start times
 * stays exactly as it was — the quests trade places within it — so dragging
 * rearranges the order without silently re-flowing everyone's schedule.
 */
export function reorderByStart(quests: Quest[], from: number, to: number): Quest[] {
  const ordered = sortedByStart(quests);
  if (from === to || from < 0 || to < 0 || from >= ordered.length || to >= ordered.length) {
    return quests;
  }
  const times = ordered.map((q) => q.startMin);
  const moved = ordered.slice();
  const [item] = moved.splice(from, 1);
  moved.splice(to, 0, item);

  const byId = new Map(moved.map((q, i) => [q.id, times[i]]));
  return quests.map((q) => (byId.has(q.id) ? { ...q, startMin: byId.get(q.id)! } : q));
}

/** Pulls quests back inside a window the user has just narrowed. */
export function refitToWindow(quests: Quest[], w: DayWindow): Quest[] {
  return quests.map((q) =>
    q.startMin >= w.startMin && q.startMin <= w.endMin
      ? q
      : { ...q, startMin: clampToWindow(q.startMin, w) }
  );
}

/** Bedtime can wrap past midnight, so "inside it" is two ranges, not one. */
export function isWithinNightly(nowMin: number, startMin: number, wakeMin: number) {
  if (startMin === wakeMin) return false;
  return startMin < wakeMin
    ? nowMin >= startMin && nowMin < wakeMin
    : nowMin >= startMin || nowMin < wakeMin;
}

export function minutesOfDay(date = new Date()) {
  return date.getHours() * 60 + date.getMinutes();
}
