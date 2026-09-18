import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { xpFor } from '../theme';
import { INITIAL_QUESTS } from './data';
import {
  DEFAULT_WINDOW,
  DayWindow,
  MIN_WINDOW_MIN,
  SLOT_MIN,
  ceilToWindow,
  clampToWindow,
  formatSlot,
  isWithinNightly,
  minutesOfDay,
  nextFreeSlot,
  refitToWindow,
  reorderByStart,
} from './schedule';
import { Offer, Quest, Reward, Screen } from './types';
import { playDing } from '../sound/ding';
import {
  cancelQuestEnd,
  cancelReminders,
  rescheduleReminders,
  scheduleQuestEnd,
} from '../notify/notifications';
import { grantUnlock, setBedtime as setNativeBedtime } from '../../modules/questlock-blocker';

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

  /** The stretch of the day quests can be scheduled in. */
  dayWindow: DayWindow;
  bedtimeEnabled: boolean;
  bedtimeStartMin: number;
  bedtimeWakeMin: number;
  remindersEnabled: boolean;

  setScreen: (screen: Screen) => void;
  setPlayerExpanded: (open: boolean) => void;
  setMusicEnabled: (on: boolean) => void;
  setDayWindow: (window: Partial<DayWindow>) => void;
  setBedtime: (next: Partial<{ enabled: boolean; startMin: number; wakeMin: number }>) => void;
  setRemindersEnabled: (on: boolean) => void;
  /** Pushes the bedtime window down to the native blocker (boot, rehydrate). */
  syncBedtime: () => void;
  /** Re-lays the pending reminders from current state (foreground, rehydrate). */
  syncReminders: () => void;
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

/** Settings times land on the same quarter-hour grid as the calendar. */
const snap = (min: number) => Math.round(min / SLOT_MIN) * SLOT_MIN;

type BedtimeFields = Pick<QuestState, 'bedtimeEnabled' | 'bedtimeStartMin' | 'bedtimeWakeMin'>;

/** True while the overnight relock is in force. */
export function isBedtimeActive(s: BedtimeFields) {
  return s.bedtimeEnabled && isWithinNightly(minutesOfDay(), s.bedtimeStartMin, s.bedtimeWakeMin);
}

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
  draftStartMin: DEFAULT_WINDOW.startMin,
  editingTimeId: null,

  toast: '',
  blockPackage: null,
  playerExpanded: false,
  musicEnabled: true,

  dayWindow: DEFAULT_WINDOW,
  bedtimeEnabled: false,
  bedtimeStartMin: 22 * 60,
  bedtimeWakeMin: 7 * 60,
  remindersEnabled: false,

  setScreen: (screen) => set({ screen }),
  setPlayerExpanded: (open) => set({ playerExpanded: open }),
  setMusicEnabled: (on) => set({ musicEnabled: on }),

  // Narrowing the window drags any quest that fell outside it back in, rather
  // than leaving it stranded at a time the calendar no longer shows.
  setDayWindow: (next) =>
    set((s) => {
      const merged = { ...s.dayWindow, ...next };
      const startMin = Math.max(0, Math.min(1440 - MIN_WINDOW_MIN, snap(merged.startMin)));
      const endMin = Math.min(1440, Math.max(startMin + MIN_WINDOW_MIN, snap(merged.endMin)));
      const dayWindow = { startMin, endMin };
      return { dayWindow, quests: refitToWindow(s.quests, dayWindow) };
    }),

  setBedtime: (next) => {
    set((s) => ({
      bedtimeEnabled: next.enabled ?? s.bedtimeEnabled,
      bedtimeStartMin: next.startMin != null ? snap(next.startMin) : s.bedtimeStartMin,
      bedtimeWakeMin: next.wakeMin != null ? snap(next.wakeMin) : s.bedtimeWakeMin,
    }));
    get().syncBedtime();
  },

  setRemindersEnabled: (on) => {
    set({ remindersEnabled: on });
    if (on) get().syncReminders();
    else void cancelReminders();
  },

  syncBedtime: () => {
    const s = get();
    setNativeBedtime(s.bedtimeEnabled, s.bedtimeStartMin, s.bedtimeWakeMin);
  },

  syncReminders: () => {
    const s = get();
    void rescheduleReminders({
      enabled: s.remindersEnabled,
      hasUnfinished: s.quests.some((q) => !q.done),
      nudgeMin: s.dayWindow.startMin,
      bedtimeStartMin: s.bedtimeEnabled ? s.bedtimeStartMin : null,
    });
  },

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
      quests: s.quests.map((q) =>
        q.id === id ? { ...q, startMin: clampToWindow(startMin, s.dayWindow) } : q
      ),
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
    const endAt = Date.now() + totalSecs * 1000;
    set({
      screen: 'focus',
      activeId: id,
      focusEndAt: endAt,
      focusTotal: totalSecs,
      focusLeft: totalSecs,
      blockPackage: null,
    });
    runFocusTimer(set, get);
    // JS is frozen in the background, so the only thing that can tell you the
    // timer landed while you were in a phone call is the OS.
    if (get().remindersEnabled) void scheduleQuestEnd(q.name, endAt);
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
    void cancelQuestEnd();
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
    void cancelQuestEnd();
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
    // Overnight the native blocker ignores bought time, so selling it would be
    // taking XP for nothing.
    if (isBedtimeActive(s)) {
      s.flash(`Bedtime until ${formatSlot(s.bedtimeWakeMin)}. Nothing to buy till then.`);
      return;
    }
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
    set((s) => ({
      sheet: true,
      draftStartMin: nextFreeSlot(s.quests, s.draftMins, s.dayWindow),
    })),
  closeSheet: () => set({ sheet: false }),
  setDraftName: (name) => set({ draftName: name }),
  setDraftMins: (mins) => set({ draftMins: mins }),
  setDraftNeedsPhoto: (needsPhoto) => set({ draftNeedsPhoto: needsPhoto }),
  setDraftStartMin: (startMin) =>
    set((s) => ({ draftStartMin: clampToWindow(startMin, s.dayWindow) })),

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
          startMin: nextFreeSlot(s.quests, mins, s.dayWindow),
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
        dayWindow: s.dayWindow,
        bedtimeEnabled: s.bedtimeEnabled,
        bedtimeStartMin: s.bedtimeStartMin,
        bedtimeWakeMin: s.bedtimeWakeMin,
        remindersEnabled: s.remindersEnabled,
        activeId: s.activeId,
        focusEndAt: s.focusEndAt,
        focusTotal: s.focusTotal,
      }),
      // v1 quests predate the calendar, so lay them out down the morning in
      // the order they were already in.
      migrate: (persisted, version) => {
        const state = persisted as Partial<QuestState> | undefined;
        if (!state || version >= 2) return state as QuestState;
        let cursor = DEFAULT_WINDOW.startMin;
        const quests = (state.quests ?? []).map((q) => {
          const startMin = ceilToWindow(cursor, DEFAULT_WINDOW);
          cursor = startMin + Math.max(q.mins, 30);
          return { ...q, startMin };
        });
        return { ...state, quests } as QuestState;
      },
      onRehydrateStorage: () => (state) => {
        // A quest that was running when the app was killed picks up where the
        // clock says it should be, not where it was when we lost focus.
        state?.syncFocus();
        // Native prefs can be wiped (clear data) without touching ours, so the
        // saved bedtime window is re-asserted on every start.
        state?.syncBedtime();
        state?.syncReminders();
      },
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
