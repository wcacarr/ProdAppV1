import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { xpFor } from '../theme';
import { INITIAL_QUESTS } from './data';
import { DAY_START_MIN, ceilToDay, clampToDay, nextFreeSlot, reorderByStart } from './schedule';
import { Offer, Quest, Reward, Screen } from './types';
import { playDing } from '../sound/ding';
import { grantUnlock } from '../../modules/questlock-blocker';

type QuestState = {
  screen: Screen;
  balance: number;
  lifetime: number;
  dayStreak: number;
  quests: Quest[];

  activeId: number | null;
  focusEndAt: number | null;
  focusTotal: number;
  focusLeft: number;
  /** Set when a finished quest is waiting on its photo. */
  awaitingPhotoId: number | null;

  reward: Reward;
  rewardCounter: number;

  sheet: boolean;
  draftName: string;
  draftMins: number;
  draftNeedsPhoto: boolean;
  draftStartMin: number;
  /** Quest whose time slot is being changed, or null. */
  editingTimeId: number | null;

  toast: string;
  blockPackage: string | null;
  playerExpanded: boolean;
  musicEnabled: boolean;

  setScreen: (screen: Screen) => void;
  setPlayerExpanded: (open: boolean) => void;
  setMusicEnabled: (on: boolean) => void;
  deleteQuest: (id: number) => void;
  reorderQuests: (from: number, to: number) => void;
  openTimeEditor: (id: number) => void;
  closeTimeEditor: () => void;
  setQuestStart: (id: number, startMin: number) => void;
  flash: (msg: string) => void;

  startQuest: (id: number) => void;
  /** Recompute the countdown from the wall clock (app resumed, or rehydrated). */
  syncFocus: () => void;
  finishQuest: () => void;
  submitPhoto: (uri: string) => void;
  cancelPhoto: () => void;
  bailQuest: () => void;

  buy: (offer: Offer) => void;

  openBlock: (packageName: string) => void;
  closeBlock: () => void;

  openSheet: () => void;
  closeSheet: () => void;
  setDraftName: (name: string) => void;
  setDraftMins: (mins: number) => void;
  setDraftNeedsPhoto: (needsPhoto: boolean) => void;
  setDraftStartMin: (startMin: number) => void;
  addPreset: (name: string, mins: number, glyph: string, needsPhoto: boolean) => void;
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

/** Ticks the display once a second. Idempotent, so resuming can just call it. */
function runFocusTimer(set: Setter, get: () => QuestState) {
  if (focusTimer) return;
  focusTimer = setInterval(() => {
    const endsAt = get().focusEndAt;
    if (endsAt == null) {
      clearFocusTimer();
      return;
    }
    const left = Math.max(0, Math.round((endsAt - Date.now()) / 1000));
    set({ focusLeft: left });
    if (left <= 0) {
      clearFocusTimer();
      get().finishQuest();
    }
  }, 1000);
}

export const useQuestStore = create<QuestState>()(
  persist(
    (set, get) => ({
  screen: 'today',
  balance: 0,
  lifetime: 0,
  dayStreak: 1,
  quests: INITIAL_QUESTS,

  activeId: null,
  focusEndAt: null,
  focusTotal: 0,
  focusLeft: 0,
  awaitingPhotoId: null,

  reward: null,
  rewardCounter: 0,

  sheet: false,
  draftName: '',
  draftMins: 25,
  draftNeedsPhoto: false,
  draftStartMin: DAY_START_MIN,
  editingTimeId: null,

  toast: '',
  blockPackage: null,
  playerExpanded: false,
  musicEnabled: true,

  setScreen: (screen) => set({ screen }),
  setPlayerExpanded: (open) => set({ playerExpanded: open }),
  setMusicEnabled: (on) => set({ musicEnabled: on }),

  deleteQuest: (id) => {
    const quest = get().quests.find((q) => q.id === id);
    set((s) => ({ quests: s.quests.filter((q) => q.id !== id) }));
    if (quest) get().flash(`${quest.name} removed.`);
  },

  // Indices are positions in the schedule, not in the raw array.
  reorderQuests: (from, to) =>
    set((s) => ({ quests: reorderByStart(s.quests, from, to) })),

  openTimeEditor: (id) => set({ editingTimeId: id }),
  closeTimeEditor: () => set({ editingTimeId: null }),

  setQuestStart: (id, startMin) =>
    set((s) => ({
      editingTimeId: null,
      quests: s.quests.map((q) => (q.id === id ? { ...q, startMin: clampToDay(startMin) } : q)),
    })),

  flash: (msg) => {
    if (toastTimer) clearTimeout(toastTimer);
    set({ toast: msg });
    toastTimer = setTimeout(() => set({ toast: '' }), 2600);
  },

  startQuest: (id) => {
    const q = get().quests.find((x) => x.id === id);
    if (!q) return;
    const totalSecs = q.mins * 60;
    set({
      screen: 'focus',
      activeId: id,
      focusEndAt: Date.now() + totalSecs * 1000,
      focusTotal: totalSecs,
      focusLeft: totalSecs,
      blockPackage: null,
    });
    runFocusTimer(set, get);
  },

  // The countdown is always derived from focusEndAt rather than counted down,
  // so a backgrounded app, a phone call, or a cold start lands on the right
  // number instead of a frozen one.
  syncFocus: () => {
    const { focusEndAt } = get();
    if (focusEndAt == null) return;
    const left = Math.max(0, Math.round((focusEndAt - Date.now()) / 1000));
    set({ focusLeft: left });
    if (left <= 0) {
      clearFocusTimer();
      get().finishQuest();
      return;
    }
    runFocusTimer(set, get);
  },

  // Quests that need proof pause here; the reward only lands once the photo is in.
  finishQuest: () => {
    clearFocusTimer();
    const s = get();
    const q = s.quests.find((x) => x.id === s.activeId);
    set({ focusEndAt: null, focusLeft: 0 });
    if (!q) return;
    if (q.needsPhoto) {
      set({ awaitingPhotoId: q.id });
      return;
    }
    grantReward(set, get, q);
  },

  submitPhoto: (uri) => {
    const s = get();
    const q = s.quests.find((x) => x.id === s.awaitingPhotoId);
    if (!q) return;
    set({
      awaitingPhotoId: null,
      quests: s.quests.map((x) => (x.id === q.id ? { ...x, photoUri: uri } : x)),
    });
    grantReward(set, get, q);
  },

  cancelPhoto: () => {
    set({ awaitingPhotoId: null, screen: 'today' });
    get().flash('Photo needed to claim that one.');
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
      awaitingPhotoId: null,
      focusEndAt: null,
      focusLeft: 0,
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
    grantUnlock(offer.packageName, offer.mins);
    set({
      balance: s.balance - offer.cost,
      blockPackage: null,
      screen: s.screen === 'block' ? 'apps' : s.screen,
    });
    get().flash(`Unlocked · ${offer.label} for ${offer.tierLabel.toLowerCase()}`);
  },

  openBlock: (packageName) => set({ screen: 'block', blockPackage: packageName }),
  closeBlock: () => set({ screen: 'apps', blockPackage: null }),

  openSheet: () =>
    set((s) => ({ sheet: true, draftStartMin: nextFreeSlot(s.quests, s.draftMins) })),
  closeSheet: () => set({ sheet: false }),
  setDraftName: (name) => set({ draftName: name }),
  setDraftMins: (mins) => set({ draftMins: mins }),
  setDraftNeedsPhoto: (needsPhoto) => set({ draftNeedsPhoto: needsPhoto }),
  setDraftStartMin: (startMin) => set({ draftStartMin: clampToDay(startMin) }),

  addPreset: (name, mins, glyph, needsPhoto) => {
    set((s) => ({
      quests: [
        ...s.quests,
        {
          id: Date.now(),
          name,
          mins,
          glyph,
          done: false,
          needsPhoto,
          startMin: nextFreeSlot(s.quests, mins),
        },
      ],
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
      quests: [
        ...st.quests,
        {
          id: Date.now(),
          name,
          mins: st.draftMins,
          glyph: name[0].toUpperCase(),
          done: false,
          needsPhoto: st.draftNeedsPhoto,
          startMin: st.draftStartMin,
        },
      ],
      sheet: false,
      draftName: '',
      draftNeedsPhoto: false,
    }));
      get().flash(`${name} added to today.`);
      },
    }),
    {
      name: 'tasuku-store-v1',
      version: 2,
      storage: createJSONStorage(() => AsyncStorage),
      // Progress, settings and any running quest survive. Sheets and the
      // current screen deliberately do not.
      partialize: (s) => ({
        balance: s.balance,
        lifetime: s.lifetime,
        dayStreak: s.dayStreak,
        quests: s.quests,
        musicEnabled: s.musicEnabled,
        activeId: s.activeId,
        focusEndAt: s.focusEndAt,
        focusTotal: s.focusTotal,
      }),
      // v1 quests predate the calendar, so lay them out down the morning in
      // the order they were already in.
      migrate: (persisted, version) => {
        const state = persisted as Partial<QuestState> | undefined;
        if (!state || version >= 2) return state as QuestState;
        let cursor = DAY_START_MIN;
        const quests = (state.quests ?? []).map((q) => {
          const startMin = ceilToDay(cursor);
          cursor = startMin + Math.max(q.mins, 30);
          return { ...q, startMin };
        });
        return { ...state, quests } as QuestState;
      },
      // A quest that was running when the app was killed picks up where the
      // clock says it should be, not where it was when we lost focus.
      onRehydrateStorage: () => (state) => state?.syncFocus(),
    }
  )
);

type Setter = (partial: Partial<QuestState> | ((s: QuestState) => Partial<QuestState>)) => void;

function grantReward(set: Setter, get: () => QuestState, quest: Quest) {
  const s = get();
  const gain = xpFor(quest.mins);
  set({
    screen: 'reward',
    quests: s.quests.map((x) => (x.id === quest.id ? { ...x, done: true } : x)),
    balance: s.balance + gain,
    lifetime: s.lifetime + gain,
    reward: { kind: 'win', name: quest.name, gain },
    rewardCounter: gain,
  });
  playDing();
}
