export type Screen = 'today' | 'store' | 'apps' | 'focus' | 'reward' | 'block' | 'lock';

export type Quest = {
  id: number;
  name: string;
  mins: number;
  glyph: string;
  done: boolean;
};

export type LockedApp = {
  id: string;
  name: string;
  initial: string;
  /** Minutes of unlocked time remaining. >=600 is treated as "rest of the day". */
  until: number;
};

export type FreeApp = {
  name: string;
  initial: string;
};

export type Offer = {
  appId: string;
  title: string;
  cost: number;
  mins: number;
};

export type Reward =
  | { kind: 'win'; name: string; gain: number }
  | { kind: 'partial'; name: string; gain: number; served: number; of: number }
  | null;

export type Preset = {
  name: string;
  mins: number;
  glyph: string;
};
