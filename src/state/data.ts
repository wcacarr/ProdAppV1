import { Preset, Quest } from './types';

/** What a brand new day looks like: the morning, in the order it happens. */
export const INITIAL_QUESTS: Quest[] = [
  { id: 1, name: 'Make the bed', mins: 5, glyph: 'M', done: false, needsPhoto: true, startMin: 7 * 60, repeat: true },
  { id: 2, name: 'Breakfast', mins: 25, glyph: 'B', done: false, needsPhoto: false, startMin: 7 * 60 + 30, repeat: true },
  { id: 3, name: 'Work block', mins: 60, glyph: 'W', done: false, needsPhoto: false, startMin: 9 * 60, repeat: true },
];

/** Roughly in the order a day runs, so the list reads like a morning. */
export const PRESETS: Preset[] = [
  { name: 'Make the bed', mins: 5, glyph: 'M', needsPhoto: true },
  { name: 'Breakfast', mins: 25, glyph: 'B', needsPhoto: false },
  { name: 'Shower', mins: 15, glyph: 'S', needsPhoto: false },
  { name: 'Meditate', mins: 10, glyph: 'M', needsPhoto: false },
  { name: 'Check in With God', mins: 15, glyph: 'G', needsPhoto: false },
  { name: 'Work block', mins: 60, glyph: 'W', needsPhoto: false },
  { name: 'Homework', mins: 40, glyph: 'H', needsPhoto: false },
  { name: 'Study', mins: 40, glyph: 'S', needsPhoto: false },
  { name: 'Workout', mins: 40, glyph: 'X', needsPhoto: false },
  { name: 'Walk outside', mins: 20, glyph: 'W', needsPhoto: false },
  { name: 'Read', mins: 25, glyph: 'R', needsPhoto: false },
  { name: 'Dishes', mins: 10, glyph: 'D', needsPhoto: true },
  { name: 'Tidy one surface', mins: 10, glyph: 'T', needsPhoto: true },
  { name: 'Inbox zero', mins: 15, glyph: 'I', needsPhoto: false },
];

export const DURATION_CHOICES = [10, 25, 40, 60];

/**
 * Screen time you can buy for a locked app, cheapest first. `label` is the
 * terse form for toasts; `useLabel` is what the store tile says, phrased as the
 * thing you are actually buying.
 */
export const UNLOCK_TIERS = [
  { label: '15 min', useLabel: '15 mins of use', mins: 15, cost: 40 },
  { label: '30 min', useLabel: '30 mins of use', mins: 30, cost: 70 },
  { label: '1 hour', useLabel: '1 hour of use', mins: 60, cost: 120 },
  { label: 'rest of the day', useLabel: 'Rest of the day', mins: 600, cost: 400 },
];
