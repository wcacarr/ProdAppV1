import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut, LinearTransition } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import NatureBackground from '../components/NatureBackground';
import TopTabBar from '../components/TopTabBar';
import PlayerDock from '../components/PlayerDock';
import AddQuestSheet from '../components/AddQuestSheet';
import PhotoProofPrompt from '../components/PhotoProofPrompt';
import Toast from '../components/Toast';
import TodayScreen from './TodayScreen';
import StoreScreen from './StoreScreen';
import AppsScreen from './AppsScreen';
import FocusScreen from './FocusScreen';
import RewardScreen from './RewardScreen';
import BlockScreen from './BlockScreen';
import LockSetupScreen from './LockSetupScreen';
import { useQuestStore } from '../state/store';
import { colors } from '../theme';

// Springy reflow so the pane growing and the nav bar sliding down read as one
// movement when the dock leaves.
const reflow = LinearTransition.springify().damping(20).stiffness(170).mass(0.6);

// The dock only earns its space where music is part of the moment.
const DOCKED_SCREENS = ['today', 'focus', 'reward', 'block'];

export default function RootScreen() {
  const screen = useQuestStore((s) => s.screen);
  const sheetOpen = useQuestStore((s) => s.sheet);
  const showDock = DOCKED_SCREENS.includes(screen);

  return (
    <View style={styles.root}>
      <NatureBackground />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.column}>
          <Animated.View
            key={screen}
            style={styles.pane}
            entering={FadeInDown.duration(240).springify().damping(22)}
            layout={reflow}
          >
            {screen === 'today' && <TodayScreen />}
            {screen === 'store' && <StoreScreen />}
            {screen === 'apps' && <AppsScreen />}
            {screen === 'focus' && <FocusScreen />}
            {screen === 'reward' && <RewardScreen />}
            {screen === 'block' && <BlockScreen />}
            {screen === 'lock' && <LockSetupScreen />}
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
    paddingTop: 22,
    paddingBottom: 16,
  },
  pane: { flex: 1, minHeight: 0 },
});
