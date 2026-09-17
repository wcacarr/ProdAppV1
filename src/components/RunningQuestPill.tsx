import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import PressableScale from './PressableScale';
import { colors, fonts, inkAlpha, mmss, radii } from '../theme';
import { useQuestStore } from '../state/store';

/** Shown on every screen but Focus while a quest is counting down, so leaving
 *  the timer pane never means losing it. */
export default function RunningQuestPill() {
  const screen = useQuestStore((s) => s.screen);
  const activeId = useQuestStore((s) => s.activeId);
  const focusEndAt = useQuestStore((s) => s.focusEndAt);
  const focusLeft = useQuestStore((s) => s.focusLeft);
  const focusTotal = useQuestStore((s) => s.focusTotal);
  const quests = useQuestStore((s) => s.quests);
  const setScreen = useQuestStore((s) => s.setScreen);

  if (focusEndAt == null || screen === 'focus' || screen === 'reward') return null;
  const quest = quests.find((q) => q.id === activeId);
  if (!quest) return null;

  const pct = focusTotal ? Math.min(100, ((focusTotal - focusLeft) / focusTotal) * 100) : 0;

  return (
    <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(140)}>
      <PressableScale style={styles.pill} onPress={() => setScreen('focus')} scaleTo={0.98}>
        <View style={styles.dot} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.name} numberOfLines={1}>
            {quest.name}
          </Text>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${pct}%` }]} />
          </View>
        </View>
        <Text style={styles.clock}>{mmss(focusLeft)}</Text>
      </PressableScale>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: radii.md,
    backgroundColor: colors.glassCard,
    borderWidth: 1,
    borderColor: 'rgba(233,164,0,0.5)',
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.ochre },
  name: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.ink },
  track: {
    height: 3,
    borderRadius: 999,
    backgroundColor: inkAlpha(0.12),
    overflow: 'hidden',
    marginTop: 5,
  },
  fill: { height: '100%', borderRadius: 999, backgroundColor: colors.ochre },
  clock: { fontFamily: fonts.mono, fontSize: 12, color: colors.ochreDeep, fontVariant: ['tabular-nums'] },
});
