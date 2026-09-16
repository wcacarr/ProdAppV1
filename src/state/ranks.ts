// Placeholder rank ladder — zen-garden themed to match the art direction.
// Swap the names/thresholds once the real progression is designed.
export type Rank = {
  name: string;
  minXp: number;
};

export const RANKS: Rank[] = [
  { name: 'Pebble', minXp: 0 },
  { name: 'Raked Sand', minXp: 500 },
  { name: 'Stepping Stone', minXp: 1200 },
  { name: 'Bamboo', minXp: 2000 },
  { name: 'Koi', minXp: 3000 },
  { name: 'Pine', minXp: 4500 },
  { name: 'Still Water', minXp: 6500 },
  { name: 'Mountain', minXp: 9000 },
];

export function rankFor(lifetimeXp: number) {
  let index = 0;
  for (let i = 0; i < RANKS.length; i++) {
    if (lifetimeXp >= RANKS[i].minXp) index = i;
  }
  const current = RANKS[index];
  const next = RANKS[index + 1];
  const span = next ? next.minXp - current.minXp : 0;
  const into = lifetimeXp - current.minXp;

  return {
    name: current.name,
    tier: index + 1,
    nextName: next?.name ?? null,
    xpToNext: next ? next.minXp - lifetimeXp : 0,
    pct: next && span > 0 ? Math.round((into / span) * 100) : 100,
  };
}
