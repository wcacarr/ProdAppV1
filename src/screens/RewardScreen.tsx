import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import GlassPane from '../components/GlassPane';
import { colors, fonts, inkAlpha, radii } from '../theme';
import { useQuestStore } from '../state/store';

function useRise(delay: number) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: 1, duration: 450, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [v, delay]);
  return {
    opacity: v,
    transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
  };
}

function useExpandRing(delay: number) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: 1, duration: 1150, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [v, delay]);
  return {
    opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] }),
    transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.5, 2.1] }) }],
  };
}

export default function RewardScreen() {
  const reward = useQuestStore((s) => s.reward);
  const rewardCounter = useQuestStore((s) => s.rewardCounter);
  const balance = useQuestStore((s) => s.balance);
  const setScreen = useQuestStore((s) => s.setScreen);

  const win = reward?.kind === 'win';
  const glyph = win ? '✓' : '≈';
  const title = win ? 'Quest complete' : 'Part credit';
  const body =
    reward?.kind === 'win'
      ? `${reward.name} — done. That is real XP, in the bank.`
      : reward?.kind === 'partial'
        ? `You served ${reward.served} of ${reward.of} minutes on "${reward.name}". Paid out for the time you did.`
        : '';

  const pop = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(pop, { toValue: 1, friction: 4.5, tension: 110, useNativeDriver: true }).start();
  }, [pop]);

  const ring1 = useExpandRing(0);
  const ring2 = useExpandRing(200);
  const ring3 = useExpandRing(360);
  const textStyle = useRise(180);
  const counterStyle = useRise(280);
  const balanceStyle = useRise(340);
  const actionsStyle = useRise(420);

  return (
    <GlassPane
      radius={radii.xl}
      intensity={44}
      tint={colors.glassPaperReward}
      style={{ flex: 1, minHeight: 0 }}
      contentStyle={styles.content}
    >
      <View style={styles.iconWrap}>
        <Svg width={186} height={186} style={StyleSheet.absoluteFill} pointerEvents="none">
          <G stroke={colors.ink} strokeOpacity={0.18} strokeWidth={0.9} fill="none">
            <Circle cx={93} cy={93} r={70} />
            <Circle cx={93} cy={93} r={82} />
            <Circle cx={93} cy={93} r={92} />
          </G>
        </Svg>
        <Animated.View style={[styles.ring, ring1]} />
        <Animated.View style={[styles.ring, ring2]} />
        <Animated.View style={[styles.ring, styles.ringFaint, ring3]} />
        <Animated.View
          style={[
            styles.popCircle,
            {
              opacity: pop,
              transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] }) }],
            },
          ]}
        >
          <Text style={styles.popGlyph}>{glyph}</Text>
        </Animated.View>
      </View>

      <Animated.View style={[styles.textBlock, textStyle]}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>{body}</Text>
      </Animated.View>

      <Animated.View style={[styles.counterRow, counterStyle]}>
        <Text style={styles.counter}>+{rewardCounter}</Text>
        <Text style={styles.xpLabel}>XP</Text>
      </Animated.View>

      <Animated.Text style={[styles.balanceLabel, balanceStyle]}>BALANCE {balance} XP</Animated.Text>

      <Animated.View style={[styles.actions, actionsStyle]}>
        <Pressable style={styles.primaryBtn} onPress={() => setScreen('store')}>
          <Text style={styles.primaryBtnText}>Spend it in the store</Text>
        </Pressable>
        <Pressable style={styles.secondaryBtn} onPress={() => setScreen('today')}>
          <Text style={styles.secondaryBtnText}>Back to quests</Text>
        </Pressable>
      </Animated.View>
    </GlassPane>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, minHeight: 0, alignItems: 'center', justifyContent: 'center', padding: 22, overflow: 'hidden' },
  iconWrap: { width: 186, height: 186, alignItems: 'center', justifyContent: 'center' },
  ring: {
    position: 'absolute',
    width: 138,
    height: 138,
    borderRadius: 69,
    borderWidth: 2,
    borderColor: colors.ochre,
  },
  ringFaint: { borderWidth: 1, borderColor: inkAlpha(0.3) },
  popCircle: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: colors.ochre,
    alignItems: 'center',
    justifyContent: 'center',
  },
  popGlyph: { fontFamily: fonts.bodyExtra, fontSize: 34, color: colors.paperLight },
  textBlock: { alignItems: 'center', marginTop: 6 },
  title: { fontFamily: fonts.bodyExtra, fontSize: 23, color: colors.ink, textAlign: 'center' },
  body: { fontFamily: fonts.body, fontSize: 13, lineHeight: 20, color: inkAlpha(0.65), textAlign: 'center', maxWidth: 258, marginTop: 8 },
  counterRow: { flexDirection: 'row', alignItems: 'baseline', gap: 7, marginTop: 18 },
  counter: { fontFamily: fonts.bodyExtra, fontSize: 42, color: colors.ochreDeep, fontVariant: ['tabular-nums'] },
  xpLabel: { fontFamily: fonts.bodyBold, fontSize: 14, color: inkAlpha(0.55) },
  balanceLabel: { fontFamily: fonts.mono, fontSize: 10, color: inkAlpha(0.5), marginTop: 7 },
  actions: { width: '100%', maxWidth: 272, marginTop: 24, gap: 8 },
  primaryBtn: { paddingVertical: 13, borderRadius: 999, backgroundColor: colors.ink, alignItems: 'center' },
  primaryBtnText: { fontFamily: fonts.bodyBold, fontSize: 13.5, color: colors.paperLight },
  secondaryBtn: { paddingVertical: 11, borderRadius: 999, borderWidth: 1, borderColor: inkAlpha(0.2), alignItems: 'center' },
  secondaryBtnText: { fontFamily: fonts.bodyBold, fontSize: 12.5, color: inkAlpha(0.65) },
});
