import { create } from 'zustand';
import { xpFor } from '../theme';
import { INITIAL_QUESTS } from './data';
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

  toast: string;
  blockPackage: string | null;

  setScreen: (screen: Screen) => void;
  flash: (msg: string) => void;

  startQuest: (id: number) => void;
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

export const useQuestStore = create<QuestState>((set, get) => ({
  screen: 'today',
  balance: 145,
  lifetime: 1340,
  dayStreak: 12,
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

  toast: '',
  blockPackage: null,

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
      blockPackage: null,
    });
    focusTimer = setInterval(() => {
      const endsAt = get().focusEndAt;
      if (!endsAt) return;
      const left = Math.max(0, Math.round((endsAt - Date.now()) / 1000));
      set({ focusLeft: left });
      if (left <= 0) {
        clearFocusTimer();
        get().finishQuest();
      }
    }, 1000);
  },

  // Quests that need proof pause here; the reward only lands once the photo is in.
  finishQuest: () => {
    clearFocusTimer();
    const s = get();
    const q = s.quests.find((x) => x.id === s.activeId);
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

  openSheet: () => set({ sheet: true }),
  closeSheet: () => set({ sheet: false }),
  setDraftName: (name) => set({ draftName: name }),
  setDraftMins: (mins) => set({ draftMins: mins }),
  setDraftNeedsPhoto: (needsPhoto) => set({ draftNeedsPhoto: needsPhoto }),

  addPreset: (name, mins, glyph, needsPhoto) => {
    set((s) => ({
      quests: [...s.quests, { id: Date.now(), name, mins, glyph, done: false, needsPhoto }],
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
        },
      ],
      sheet: false,
      draftName: '',
      draftNeedsPhoto: false,
    }));
    get().flash(`${name} added to today.`);
  },
}));

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
