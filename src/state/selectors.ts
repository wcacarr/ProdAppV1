import { Quest } from './types';
import { xpFor } from '../theme';

export function levelInfo(lifetime: number) {
  const level = 1 + Math.floor(lifetime / 500);
  const intoLevel = lifetime % 500;
  return {
    level,
    nextLevelXp: 500 - intoLevel,
    pct: Math.round((intoLevel / 500) * 100),
  };
}

export function fastestRemaining(quests: Quest[]): Quest | undefined {
  const remaining = quests.filter((q) => !q.done);
  return remaining.slice().sort((a, b) => a.mins - b.mins)[0] ?? quests[0];
}

export function questMeta(q: Quest) {
  return q.done ? `DONE · +${xpFor(q.mins)} XP` : `${q.mins} MIN · +${xpFor(q.mins)} XP`;
}
