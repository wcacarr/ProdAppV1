export type Screen = 'today' | 'store' | 'apps' | 'focus' | 'reward' | 'block' | 'lock' | 'settings';

export type Quest = {
  id: number;
  name: string;
  mins: number;
  glyph: string;
  done: boolean;
  /** Finishing requires a photo of the completed task. */
  needsPhoto: boolean;
  photoUri?: string;
};

export type Offer = {
  packageName: string;
  label: string;
  tierLabel: string;
  mins: number;
  cost: number;
};

export type Reward =
  | { kind: 'win'; name: string; gain: number }
  | { kind: 'partial'; name: string; gain: number; served: number; of: number }
  | null;

export type Preset = {
  name: string;
  mins: number;
  glyph: string;
  needsPhoto: boolean;
};
