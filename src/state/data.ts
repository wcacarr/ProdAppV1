import { Preset, Quest } from './types';

export const INITIAL_QUESTS: Quest[] = [
  { id: 1, name: 'Study — deep work block', mins: 40, glyph: 'S', done: false, needsPhoto: false },
  { id: 2, name: 'Walk outside', mins: 20, glyph: 'W', done: false, needsPhoto: false },
  { id: 3, name: 'Dishes', mins: 10, glyph: 'D', done: false, needsPhoto: true },
];

export const PRESETS: Preset[] = [
  { name: 'Make the bed', mins: 5, glyph: 'B', needsPhoto: true },
  { name: 'Dishes', mins: 10, glyph: 'D', needsPhoto: true },
  { name: 'Walk outside', mins: 20, glyph: 'W', needsPhoto: false },
  { name: 'Tidy one surface', mins: 10, glyph: 'T', needsPhoto: true },
  { name: 'Shower', mins: 15, glyph: 'S', needsPhoto: false },
  { name: 'Read', mins: 25, glyph: 'R', needsPhoto: false },
  { name: 'Inbox zero', mins: 15, glyph: 'I', needsPhoto: false },
  { name: 'Stretch', mins: 8, glyph: 'X', needsPhoto: false },
];

export const DURATION_CHOICES = [10, 25, 40, 60];

/** Screen time you can buy for a locked app, cheapest first. */
export const UNLOCK_TIERS = [
  { label: '15 min', mins: 15, cost: 40 },
  { label: '30 min', mins: 30, cost: 70 },
  { label: '1 hour', mins: 60, cost: 120 },
  { label: 'Rest of the day', mins: 600, cost: 400 },
];
