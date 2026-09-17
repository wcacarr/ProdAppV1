import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import NatureBackground from '../components/NatureBackground';
import TopTabBar from '../components/TopTabBar';
import PlayerDock from '../components/PlayerDock';
import AddQuestSheet from '../components/AddQuestSheet';
import PhotoProofPrompt from '../components/PhotoProofPrompt';
import RippleTransition from '../components/RippleTransition';
import ExpandedPlayer from '../components/ExpandedPlayer';
import Toast from '../components/Toast';
import TodayScreen from './TodayScreen';
import StoreScreen from './StoreScreen';
import AppsScreen from './AppsScreen';
import FocusScreen from './FocusScreen';
import RewardScreen from './RewardScreen';
import BlockScreen from './BlockScreen';
import LockSetupScreen from './LockSetupScreen';
import { useQuestStore } from '../state/store';
import { useNowPlaying } from '../media/useNowPlaying';
import { useAmbientBed } from '../media/useAmbientBed';
import { colors } from '../theme';

// Springy reflow so the pane growing and the nav bar sliding down read as one
// movement when the dock leaves.
const reflow = LinearTransition.springify().damping(20).stiffness(170).mass(0.6);

// Today only — everywhere else the space reads better empty.
const DOCKED_SCREENS = ['today'];

export default function RootScreen() {
  const screen = useQuestStore((s) => s.screen);
  const sheetOpen = useQuestStore((s) => s.sheet);
  const playerExpanded = useQuestStore((s) => s.playerExpanded);
  const showDock = DOCKED_SCREENS.includes(screen);

  const { status: mediaStatus } = useNowPlaying(4000);
  useAmbientBed(mediaStatus);

  return (
    <View style={styles.root}>
      <NatureBackground />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.column}>
          <Animated.View
            key={screen}
            style={styles.pane}
            entering={FadeIn.duration(260)}
            layout={reflow}
          >
            {screen === 'today' && <TodayScreen />}
            {screen === 'store' && <StoreScreen />}
            {screen === 'apps' && <AppsScreen />}
            {screen === 'focus' && <FocusScreen />}
            {screen === 'reward' && <RewardScreen />}
            {screen === 'block' && <BlockScreen />}
            {screen === 'lock' && <LockSetupScreen />}
            <RippleTransition trigger={screen} />
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
