import { Quest } from './types';
import { durationLabel, xpFor } from '../theme';
import { WATER_XP, isWaterQuest } from './hydration';

/** What finishing this quest actually pays. */
export function questXp(q: Quest) {
  return isWaterQuest(q) ? WATER_XP : xpFor(q.mins);
}

export function fastestRemaining(quests: Quest[]): Quest | undefined {
  // Glasses of water are always the shortest thing on the list and would win
  // every time, which is not the encouragement the nudge is for.
  const real = quests.filter((q) => !isWaterQuest(q));
  const remaining = real.filter((q) => !q.done);
  return remaining.slice().sort((a, b) => a.mins - b.mins)[0] ?? real[0];
}

export function questMeta(q: Quest) {
  if (q.done) return `DONE · +${questXp(q)} XP`;
  const base = `${durationLabel(q.mins).toUpperCase()} · +${questXp(q)} XP`;
  return q.needsPhoto ? `${base} · PHOTO` : base;
}

/** Same thing minus the duration, for rows that already show a time slot. */
export function questReward(q: Quest) {
  if (q.done) return `DONE · +${questXp(q)} XP`;
  const base = `+${questXp(q)} XP`;
  return q.needsPhoto ? `${base} · PHOTO` : base;
}
