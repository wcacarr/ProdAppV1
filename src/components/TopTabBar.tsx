import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import GlassPane from './GlassPane';
import { colors, fonts, inkAlpha, mmss, radii } from '../theme';
import { useQuestStore } from '../state/store';
import { Screen } from '../state/types';

const TABS: { key: Screen; label: string; num: string }[] = [
  { key: 'today', label: 'Today', num: '1' },
  { key: 'store', label: 'Store', num: '2' },
  { key: 'apps', label: 'Apps', num: '3' },
  { key: 'lock', label: 'Lock', num: '4' },
];

export default function TopTabBar() {
  const screen = useQuestStore((s) => s.screen);
  const setScreen = useQuestStore((s) => s.setScreen);
  const balance = useQuestStore((s) => s.balance);
  const dayStreak = useQuestStore((s) => s.dayStreak);
  const focusLeft = useQuestStore((s) => s.focusLeft);

  const topStatus = screen === 'focus' ? `FOCUS · ${mmss(focusLeft)}` : `${balance} XP · ${dayStreak}d`;

  return (
    <GlassPane radius={radii.lg} intensity={30} contentStyle={styles.row}>
      {TABS.map((t) => {
        const on = screen === t.key;
        return (
          <Pressable
            key={t.key}
            onPress={() => setScreen(t.key)}
            style={[
              styles.tab,
              {
                backgroundColor: on ? colors.ochre : 'rgba(246,239,216,.5)',
                borderColor: on ? inkAlpha(0.28) : inkAlpha(0.12),
              },
            ]}
          >
            <Text style={[styles.num, { color: on ? inkAlpha(0.6) : inkAlpha(0.4) }]}>{t.num}</Text>
            <Text style={[styles.label, { color: on ? colors.ink : inkAlpha(0.55) }]}>{t.label}</Text>
          </Pressable>
        );
      })}
      <View style={{ flex: 1 }} />
      <View style={styles.status}>
        <View style={styles.dot} />
        <Text style={styles.statusText} numberOfLines={1}>
          {topStatus}
        </Text>
      </View>
    </GlassPane>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 6,
    paddingLeft: 6,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderRadius: 10,
    borderWidth: 1,
  },
  num: {
    fontFamily: fonts.bodyMedium,
    fontSize: 9.5,
  },
  label: {
    fontFamily: fonts.bodyBold,
    fontSize: 11.5,
  },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
    maxWidth: 150,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.ochre,
  },
  statusText: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: inkAlpha(0.7),
  },
});
