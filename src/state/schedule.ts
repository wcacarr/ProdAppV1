import { Quest } from './types';

/** The day runs 7am to 7pm. Twelve hours is a full day's work; past that the
 *  calendar stops offering you room. */
export const DAY_START_MIN = 7 * 60;
export const DAY_END_MIN = 19 * 60;

/** Calendar granularity, same as Outlook's default. */
export const SLOT_MIN = 15;

export function clampToDay(min: number) {
  return Math.min(DAY_END_MIN, Math.max(DAY_START_MIN, Math.round(min / SLOT_MIN) * SLOT_MIN));
}

/** Rounds up, so a slot derived from an end time never lands before it. */
export function ceilToDay(min: number) {
  return Math.min(DAY_END_MIN, Math.max(DAY_START_MIN, Math.ceil(min / SLOT_MIN) * SLOT_MIN));
}

/** "7:00 AM" / "12:30 PM" — matched to how the day actually reads out loud. */
export function formatSlot(min: number) {
  const h24 = Math.floor(min / 60);
  const m = min % 60;
  const suffix = h24 < 12 ? 'AM' : 'PM';
  const h = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h}:${String(m).padStart(2, '0')} ${suffix}`;
}

/** Short form for the left gutter, where the column is narrow. */
export function formatSlotShort(min: number) {
  const h24 = Math.floor(min / 60);
  const m = min % 60;
  const h = h24 % 12 === 0 ? 12 : h24 % 12;
  const suffix = h24 < 12 ? 'am' : 'pm';
  return m === 0 ? `${h}${suffix}` : `${h}:${String(m).padStart(2, '0')}${suffix}`;
}

export function endOf(quest: Quest) {
  return quest.startMin + quest.mins;
}

/** Every slot you can drop a quest on. */
export function slotChoices(): number[] {
  const out: number[] = [];
  for (let m = DAY_START_MIN; m <= DAY_END_MIN; m += SLOT_MIN) out.push(m);
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
export function nextFreeSlot(quests: Quest[], mins: number): number {
  const latestEnd = quests.reduce((acc, q) => Math.max(acc, endOf(q)), DAY_START_MIN);
  const candidate = ceilToDay(latestEnd);
  // Keep it inside the day even when the day is already full.
  return Math.min(candidate, Math.max(DAY_START_MIN, DAY_END_MIN - mins));
}

/** True when this quest overlaps another, so the row can say so. */
export function overlaps(quest: Quest, quests: Quest[]) {
  return quests.some(
    (other) =>
      other.id !== quest.id && quest.startMin < endOf(other) && other.startMin < endOf(quest)
  );
}

/** Total booked time, for the "that is a long day" warning. */
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
