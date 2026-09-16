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

// Installed apps are expensive to load (icons), so they're fetched once;
// lock state is cheap and ticks every second so countdowns stay live.
export function useAppRegistry() {
  const [apps, setApps] = useState<InstalledApp[]>([]);
  const [locks, setLocks] = useState<LockState[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshLocks = useCallback(() => setLocks(getLockStates()), []);

  useEffect(() => {
    let cancelled = false;
    getInstalledApps()
      .then((list) => {
        if (cancelled) return;
        setApps(list);
        setLoading(false);
      })
      .catch(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    refreshLocks();
    const interval = setInterval(refreshLocks, 1000);
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') refreshLocks();
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
