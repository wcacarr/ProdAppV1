import { create } from 'zustand';
import { xpFor } from '../theme';
import { INITIAL_APPS, INITIAL_QUESTS } from './data';
import { LockedApp, Offer, Quest, Reward, Screen } from './types';
import { playDing } from '../sound/ding';

type QuestState = {
  screen: Screen;
  balance: number;
  lifetime: number;
  dayStreak: number;
  quests: Quest[];
  apps: LockedApp[];

  activeId: number | null;
  focusEndAt: number | null;
  focusTotal: number;
  focusLeft: number;

  reward: Reward;
  rewardCounter: number;

  sheet: boolean;
  draftName: string;
  draftMins: number;

  toast: string;
  blockId: string | null;
  strictMode: boolean;

  setScreen: (screen: Screen) => void;
  flash: (msg: string) => void;

  startQuest: (id: number) => void;
  completeQuest: () => void;
  bailQuest: () => void;

  buy: (offer: Offer) => void;

  openBlock: (appId: string) => void;
  closeBlock: () => void;

  openSheet: () => void;
  closeSheet: () => void;
  setDraftName: (name: string) => void;
  setDraftMins: (mins: number) => void;
  addPreset: (name: string, mins: number, glyph: string) => void;
  addCustom: () => void;
};

let focusTimer: ReturnType<typeof setInterval> | null = null;
let toastTimer: ReturnType<typeof setTimeout> | null = null;

function clearFocusTimer() {
  if (focusTimer) {
    clearInterval(focusTimer);
    focusTimer = null;
  }
}

export const useQuestStore = create<QuestState>((set, get) => ({
  screen: 'today',
  balance: 145,
  lifetime: 1340,
  dayStreak: 12,
  quests: INITIAL_QUESTS,
  apps: INITIAL_APPS,

  activeId: null,
  focusEndAt: null,
  focusTotal: 0,
  focusLeft: 0,

  reward: null,
  rewardCounter: 0,

  sheet: false,
  draftName: '',
  draftMins: 25,

  toast: '',
  blockId: null,
  strictMode: false,

  setScreen: (screen) => set({ screen }),

  flash: (msg) => {
    if (toastTimer) clearTimeout(toastTimer);
    set({ toast: msg });
    toastTimer = setTimeout(() => set({ toast: '' }), 2600);
  },

  startQuest: (id) => {
    const q = get().quests.find((x) => x.id === id);
    if (!q) return;
    clearFocusTimer();
    const totalSecs = q.mins * 60;
    const endAt = Date.now() + totalSecs * 1000;
    set({
      screen: 'focus',
      activeId: id,
      focusEndAt: endAt,
      focusTotal: totalSecs,
      focusLeft: totalSecs,
      blockId: null,
    });
    focusTimer = setInterval(() => {
      const endsAt = get().focusEndAt;
      if (!endsAt) return;
      const left = Math.max(0, Math.round((endsAt - Date.now()) / 1000));
      set({ focusLeft: left });
      if (left <= 0) {
        clearFocusTimer();
        get().completeQuest();
      }
    }, 1000);
  },

  completeQuest: () => {
    clearFocusTimer();
    const s = get();
    const q = s.quests.find((x) => x.id === s.activeId);
    if (!q) return;
    const gain = xpFor(q.mins);
    set({
      screen: 'reward',
      quests: s.quests.map((x) => (x.id === q.id ? { ...x, done: true } : x)),
      balance: s.balance + gain,
      lifetime: s.lifetime + gain,
      reward: { kind: 'win', name: q.name, gain },
      rewardCounter: gain,
    });
    playDing();
  },

  bailQuest: () => {
    clearFocusTimer();
    const s = get();
    const q = s.quests.find((x) => x.id === s.activeId);
    if (!q) return;
    const ratio = s.focusTotal ? 1 - s.focusLeft / s.focusTotal : 0;
    const gain = Math.max(0, Math.round(xpFor(q.mins) * ratio));
    set({
      screen: 'reward',
      balance: s.balance + gain,
      lifetime: s.lifetime + gain,
      reward: {
        kind: 'partial',
        name: q.name,
        gain,
        served: Math.round(q.mins * ratio),
        of: q.mins,
      },
      rewardCounter: gain,
    });
  },

  buy: (offer) => {
    const s = get();
    if (s.balance < offer.cost) {
      s.flash(`${offer.cost - s.balance} XP short. One quest should cover it.`);
      return;
    }
    set({
      balance: s.balance - offer.cost,
      apps: s.apps.map((a) => (a.id === offer.appId ? { ...a, until: a.until + offer.mins } : a)),
      blockId: null,
      screen: s.screen === 'block' ? 'apps' : s.screen,
    });
    get().flash(`Unlocked · ${offer.title.replace(' — ', ' for ')}`);
  },

  openBlock: (appId) => set({ screen: 'block', blockId: appId }),
  closeBlock: () => set({ screen: 'apps', blockId: null }),

  openSheet: () => set({ sheet: true }),
  closeSheet: () => set({ sheet: false }),
  setDraftName: (name) => set({ draftName: name }),
  setDraftMins: (mins) => set({ draftMins: mins }),

  addPreset: (name, mins, glyph) => {
    set((s) => ({
      quests: [...s.quests, { id: Date.now(), name, mins, glyph, done: false }],
      sheet: false,
    }));
    get().flash(`${name} added to today.`);
  },

  addCustom: () => {
    const s = get();
    const name = s.draftName.trim();
    if (!name) {
      s.flash('Give the quest a name first.');
      return;
    }
    set((st) => ({
      quests: [...st.quests, { id: Date.now(), name, mins: st.draftMins, glyph: name[0].toUpperCase(), done: false }],
      sheet: false,
      draftName: '',
    }));
    get().flash(`${name} added to today.`);
  },
}));
