import { FreeApp, LockedApp, Offer, Preset, Quest } from './types';

export const INITIAL_QUESTS: Quest[] = [
  { id: 1, name: 'Make the bed', mins: 5, glyph: 'B', done: true },
  { id: 2, name: 'Study — deep work block', mins: 40, glyph: 'S', done: false },
  { id: 3, name: 'Walk outside', mins: 20, glyph: 'W', done: false },
  { id: 4, name: 'Dishes', mins: 10, glyph: 'D', done: false },
];

export const INITIAL_APPS: LockedApp[] = [
  { id: 'yt', name: 'Tubely', initial: 'T', until: 0 },
  { id: 'ig', name: 'Snapgram', initial: 'S', until: 0 },
  { id: 'tk', name: 'Clipfeed', initial: 'C', until: 0 },
  { id: 'sc', name: 'Flashchat', initial: 'F', until: 0 },
  { id: 'rd', name: 'Threadit', initial: 'H', until: 0 },
  { id: 'gm', name: 'Raidlands', initial: 'R', until: 0 },
];

export const FREE_APPS: FreeApp[] = [
  { name: 'Messages', initial: 'M' },
  { name: 'Phone', initial: 'P' },
  { name: 'Maps', initial: 'M' },
  { name: 'Camera', initial: 'C' },
  { name: 'Clock', initial: 'A' },
  { name: 'Notes', initial: 'N' },
  { name: 'Bank', initial: 'B' },
  { name: 'Questlock', initial: 'Q' },
];

export const PRESETS: Preset[] = [
  { name: 'Make the bed', mins: 5, glyph: 'B' },
  { name: 'Dishes', mins: 10, glyph: 'D' },
  { name: 'Walk outside', mins: 20, glyph: 'W' },
  { name: 'Tidy one surface', mins: 10, glyph: 'T' },
  { name: 'Shower', mins: 15, glyph: 'S' },
  { name: 'Read', mins: 25, glyph: 'R' },
  { name: 'Inbox zero', mins: 15, glyph: 'I' },
  { name: 'Stretch', mins: 8, glyph: 'X' },
];

export const DURATION_CHOICES = [10, 25, 40, 60];

export function offerList(apps: LockedApp[]): Offer[] {
  return [
    { appId: 'yt', title: 'Tubely — 1 hour', cost: 100, mins: 60 },
    { appId: 'ig', title: 'Snapgram — 30 min', cost: 60, mins: 30 },
    { appId: 'tk', title: 'Clipfeed — 30 min', cost: 80, mins: 30 },
    { appId: 'sc', title: 'Flashchat — 1 hour', cost: 70, mins: 60 },
    { appId: 'gm', title: 'Raidlands — 45 min', cost: 110, mins: 45 },
    { appId: 'yt', title: 'Tubely — rest of the day', cost: 400, mins: 600 },
  ].filter((o) => apps.some((a) => a.id === o.appId));
}

export const TILE_BG: Record<string, string> = {
  yt: 'rgba(243,226,196,.8)',
  ig: 'rgba(239,227,210,.8)',
  tk: 'rgba(237,230,207,.8)',
  sc: 'rgba(241,229,201,.8)',
  rd: 'rgba(234,228,212,.8)',
  gm: 'rgba(243,230,208,.8)',
};
