import React, { useEffect } from 'react';
import { AppState, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import NatureBackground from '../components/NatureBackground';
import TopTabBar from '../components/TopTabBar';
import PlayerDock from '../components/PlayerDock';
import AddQuestSheet from '../components/AddQuestSheet';
import PhotoProofPrompt from '../components/PhotoProofPrompt';
import ScreenTransition from '../components/ScreenTransition';
import ExpandedPlayer from '../components/ExpandedPlayer';
import RunningQuestPill from '../components/RunningQuestPill';
import QuestSheets from '../components/QuestSheets';
import Toast from '../components/Toast';
import TodayScreen from './TodayScreen';
import StoreScreen from './StoreScreen';
import AppsScreen from './AppsScreen';
import FocusScreen from './FocusScreen';
import RewardScreen from './RewardScreen';
import BlockScreen from './BlockScreen';
import LockSetupScreen from './LockSetupScreen';
import SettingsScreen from './SettingsScreen';
import { useQuestStore } from '../state/store';
import { useNowPlaying } from '../media/useNowPlaying';
import { useAmbientBed } from '../media/useAmbientBed';
import { clearDeliveredNotifications } from '../notify/notifications';
import { colors } from '../theme';

// Springy reflow so the pane growing and the nav bar sliding down read as one
// movement when the dock leaves.
const reflow = LinearTransition.springify().damping(20).stiffness(170).mass(0.6);

// Today and Focus. Everywhere else the space reads better empty, but during a
// quest you should be able to skip a track without leaving the timer.
const DOCKED_SCREENS = ['today', 'focus'];

export default function RootScreen() {
  const screen = useQuestStore((s) => s.screen);
  const sheetOpen = useQuestStore((s) => s.sheet);
  const playerExpanded = useQuestStore((s) => s.playerExpanded);
  const showDock = DOCKED_SCREENS.includes(screen);

  const { now, ready } = useNowPlaying(4000);
  const musicEnabled = useQuestStore((s) => s.musicEnabled);
  // Held until the first poll answers. Starting the drone before we know what
  // the phone is doing is what paused people's podcasts on launch.
  useAmbientBed(!!now?.isPlaying, musicEnabled && ready);

  // Android freezes JS timers in the background, so a quest interrupted by a
  // call or a text would otherwise come back with its countdown stopped where
  // it was. The clock is the source of truth; catch up to it on resume.
  const syncFocus = useQuestStore((s) => s.syncFocus);
  // Reminders are laid down from whatever is true when the app is open, so
  // going to the background is also the moment to leave the right ones behind.
  const syncReminders = useQuestStore((s) => s.syncReminders);
  // Coming back after midnight is the usual way a new day arrives, so the
  // rollover is checked before anything else looks at the quest list.
  const rollOverIfNewDay = useQuestStore((s) => s.rollOverIfNewDay);
  useEffect(() => {
    // Opening the app is the moment to clear the launcher badge; Android keeps
    // the count until something actively dismisses it.
    void clearDeliveredNotifications();
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') {
        rollOverIfNewDay();
        syncFocus();
        void clearDeliveredNotifications();
      }
      syncReminders();
    });
    return () => sub.remove();
  }, [rollOverIfNewDay, syncFocus, syncReminders]);

  return (
    <View style={styles.root}>
      <NatureBackground />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.column}>
          <Animated.View
            key={screen}
            style={styles.pane}
            layout={reflow}
          >
            <ScreenTransition trigger={screen}>
            {screen === 'today' && <TodayScreen />}
            {screen === 'store' && <StoreScreen />}
            {screen === 'apps' && <AppsScreen />}
            {screen === 'focus' && <FocusScreen />}
            {screen === 'reward' && <RewardScreen />}
            {screen === 'block' && <BlockScreen />}
            {screen === 'lock' && <LockSetupScreen />}
            {screen === 'settings' && <SettingsScreen />}
            </ScreenTransition>
          </Animated.View>

          <Animated.View layout={reflow}>
            <RunningQuestPill />
          </Animated.View>

          <Animated.View layout={reflow}>
            <TopTabBar />
          </Animated.View>

          {showDock && (
            <Animated.View
              layout={reflow}
              entering={FadeIn.duration(220)}
              exiting={FadeOut.duration(140)}
            >
              <PlayerDock />
            </Animated.View>
          )}
        </View>
      </SafeAreaView>
      {playerExpanded && <ExpandedPlayer />}
      {sheetOpen && <AddQuestSheet />}
      <QuestSheets />
      <PhotoProofPrompt />
      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.paperLight },
  safe: { flex: 1 },
  column: {
    flex: 1,
    gap: 8,
    paddingHorizontal: 14,
    paddingTop: 40,
    paddingBottom: 32,
  },
  pane: { flex: 1, minHeight: 0 },
});
