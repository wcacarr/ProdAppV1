import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

const KEY = 'tasuku_onboarded_v1';

export function useFirstRun() {
  const [checked, setChecked] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((v) => setNeedsOnboarding(v !== 'done'))
      .catch(() => setNeedsOnboarding(false)) // storage unavailable: don't trap the user
      .finally(() => setChecked(true));
  }, []);

  const complete = () => {
    setNeedsOnboarding(false);
    AsyncStorage.setItem(KEY, 'done').catch(() => {});
  };

  return { checked, needsOnboarding, complete };
}
