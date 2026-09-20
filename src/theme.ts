// Design tokens ported 1:1 from project/Questlock v2.dc.html.
// Warm paper / ink / ochre, zen-garden line-art vibe.

export const colors = {
  paper: '#EFE9D6',
  paperLight: '#FDF8E8',
  paperCard: '#F6EFD8',
  ink: '#22201B',
  ochre: '#E9A400',
  ochreDeep: '#B07B00',
  glassPaper: 'rgba(253,248,232,0.7)',
  glassPaperToday: 'rgba(253,248,232,0.62)',
  glassPaperList: 'rgba(253,248,232,0.68)',
  glassPaperApps: 'rgba(253,248,232,0.6)',
  glassPaperFocus: 'rgba(253,248,232,0.58)',
  glassPaperReward: 'rgba(253,248,232,0.6)',
  glassCard: 'rgba(255,252,242,0.72)',
  glassNudge: 'rgba(246,239,216,0.7)',
  glassSheet: 'rgba(253,248,232,0.92)',
  blockBg: 'rgba(28,26,22,0.86)',
  blockBorder: 'rgba(233,164,0,0.45)',
  toastBg: 'rgba(28,26,22,0.9)',
  overlay: 'rgba(34,32,27,0.4)',
} as const;

export function inkAlpha(a: number) {
  return `rgba(34,32,27,${a})`;
}

export function paperAlpha(a: number) {
  return `rgba(253,248,232,${a})`;
}

export const radii = {
  sm: 10,
  md: 14,
  lg: 15,
  xl: 19,
  xxl: 22,
  pill: 999,
};

export const fonts = {
  body: 'Nunito_400Regular',
  bodyMedium: 'Nunito_500Medium',
  bodySemi: 'Nunito_600SemiBold',
  bodyBold: 'Nunito_700Bold',
  bodyExtra: 'Nunito_800ExtraBold',
  mono: 'IBMPlexMono_400Regular',
  brand: 'ShipporiMincho_600SemiBold',
  monoMedium: 'IBMPlexMono_500Medium',
};

export const xpFor = (mins: number) => Math.max(10, Math.round(mins * 3));

/** "45s", "2m", "1m 30s", "40m" — durations are no longer whole minutes. */
export function durationLabel(mins: number) {
  const total = Math.max(0, Math.round(mins * 60));
  const m = Math.floor(total / 60);
  const s = total % 60;
  if (!m) return `${s}s`;
  if (!s) return `${m}m`;
  return `${m}m ${s}s`;
}

export const mmss = (t: number) => {
  const s = Math.max(0, Math.round(t));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};
