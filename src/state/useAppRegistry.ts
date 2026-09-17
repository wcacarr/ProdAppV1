import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import {
  InstalledApp,
  LockState,
  getInstalledApps,
  getLockStates,
} from '../../modules/questlock-blocker';

export type AppEntry = InstalledApp & {
  locked: boolean;
  /** Lock is still inside its grace window and can be undone freely. */
  inGrace: boolean;
  lockActiveAt: number;
  /** Bought screen time still running. */
  unlockedUntil: number;
};

// Loading the installed apps means decoding every launcher icon, which takes
// long enough that a screen mounting mid-fetch would render as if nothing were
// installed — which is how the Store came up empty right after a quest. The
// list is therefore fetched once for the whole app and shared, so later screens
// mount with it already in hand.
let cache: InstalledApp[] = [];
let inFlight: Promise<InstalledApp[]> | null = null;
let loadedAt = 0;
const subscribers = new Set<(apps: InstalledApp[]) => void>();

/** How stale the cached list may get before a foregrounding refreshes it, so
 *  apps installed while we were away still turn up. */
const STALE_MS = 60_000;

function loadApps(force = false): Promise<InstalledApp[]> {
  if (!force && loadedAt) return Promise.resolve(cache);
  if (!inFlight) {
    inFlight = getInstalledApps()
      .then((list) => {
        cache = list;
        loadedAt = Date.now();
        subscribers.forEach((fn) => fn(list));
        return list;
      })
      .catch(() => {
        loadedAt = Date.now();
        return cache;
      })
      .finally(() => {
        inFlight = null;
      });
  }
  return inFlight;
}

export function useAppRegistry() {
  const [apps, setApps] = useState<InstalledApp[]>(cache);
  const [locks, setLocks] = useState<LockState[]>(getLockStates);
  const [loading, setLoading] = useState(loadedAt === 0);

  const refreshLocks = useCallback(() => setLocks(getLockStates()), []);

  useEffect(() => {
    let cancelled = false;
    const receive = (list: InstalledApp[]) => {
      if (cancelled) return;
      setApps(list);
      setLoading(false);
    };
    subscribers.add(receive);
    loadApps().then(receive);
    return () => {
      cancelled = true;
      subscribers.delete(receive);
    };
  }, []);

  useEffect(() => {
    refreshLocks();
    const interval = setInterval(refreshLocks, 1000);
    const sub = AppState.addEventListener('change', (s) => {
      if (s !== 'active') return;
      refreshLocks();
      if (Date.now() - loadedAt > STALE_MS) loadApps(true);
    });
    return () => {
      clearInterval(interval);
      sub.remove();
    };
  }, [refreshLocks]);

  const now = Date.now();
  const entries: AppEntry[] = apps.map((app) => {
    const lock = locks.find((l) => l.packageName === app.packageName);
    return {
      ...app,
      locked: !!lock,
      inGrace: !!lock && now < lock.lockActiveAt,
      lockActiveAt: lock?.lockActiveAt ?? 0,
      unlockedUntil: lock?.unlockUntil ?? 0,
    };
  });

  const lockedApps = entries.filter((e) => e.locked);
  const openApps = entries.filter((e) => !e.locked);
  /** Locked, but bought time is still running. */
  const isOpenNow = (e: AppEntry) => !e.locked || e.inGrace || now < e.unlockedUntil;

  return { entries, lockedApps, openApps, isOpenNow, loading, refreshLocks };
}
