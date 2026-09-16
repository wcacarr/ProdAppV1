import { Quest } from './types';
import { xpFor } from '../theme';

export function fastestRemaining(quests: Quest[]): Quest | undefined {
  const remaining = quests.filter((q) => !q.done);
  return remaining.slice().sort((a, b) => a.mins - b.mins)[0] ?? quests[0];
}

export function questMeta(q: Quest) {
  if (q.done) return `DONE · +${xpFor(q.mins)} XP`;
  const base = `${q.mins} MIN · +${xpFor(q.mins)} XP`;
  return q.needsPhoto ? `${base} · PHOTO` : base;
}
