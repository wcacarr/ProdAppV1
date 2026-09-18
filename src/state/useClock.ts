import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { minutesOfDay } from './schedule';

/**
 * Minutes since midnight, re-read every half minute and again whenever the app
 * comes back to the foreground — so the calendar's idea of "now" is never the
 * one from before the phone went in a pocket.
 */
export function useNowMinute() {
  const [now, setNow] = useState(() => minutesOfDay());

  useEffect(() => {
    const tick = () => setNow(minutesOfDay());
    tick();
    const interval = setInterval(tick, 30_000);
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') tick();
    });
    return () => {
      clearInterval(interval);
      sub.remove();
    };
  }, []);

  return now;
}
