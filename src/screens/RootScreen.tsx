import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import NatureBackground from '../components/NatureBackground';
import TopTabBar from '../components/TopTabBar';
import PlayerDock from '../components/PlayerDock';
import AddQuestSheet from '../components/AddQuestSheet';
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

export default function RootScreen() {
  const screen = useQuestStore((s) => s.screen);
  const sheetOpen = useQuestStore((s) => s.sheet);

  return (
    <View style={styles.root}>
      <NatureBackground />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.column}>
          <TopTabBar />
          {screen === 'today' && <TodayScreen />}
          {screen === 'store' && <StoreScreen />}
          {screen === 'apps' && <AppsScreen />}
          {screen === 'focus' && <FocusScreen />}
          {screen === 'reward' && <RewardScreen />}
          {screen === 'block' && <BlockScreen />}
          {screen === 'lock' && <LockSetupScreen />}
          <PlayerDock />
        </View>
      </SafeAreaView>
      {sheetOpen && <AddQuestSheet />}
      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.paperLight },
  safe: { flex: 1 },
  column: { flex: 1, gap: 8, padding: 8 },
});
