import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import GlassPane from '../components/GlassPane';
import { colors, fonts, inkAlpha, mmss, radii, xpFor } from '../theme';
import { useQuestStore } from '../state/store';

const RING_R = 102;
const RING_LEN = 2 * Math.PI * RING_R;

export default function FocusScreen() {
  const quests = useQuestStore((s) => s.quests);
  const activeId = useQuestStore((s) => s.activeId);
  const focusLeft = useQuestStore((s) => s.focusLeft);
  const focusTotal = useQuestStore((s) => s.focusTotal);
  const bailQuest = useQuestStore((s) => s.bailQuest);

  const q = quests.find((x) => x.id === activeId);
  const progress = focusTotal ? 1 - focusLeft / focusTotal : 0;

  const breathe = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, { toValue: 1, duration: 2750, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(breathe, { toValue: 0, duration: 2750, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [breathe]);
  const breatheScale = breathe.interpolate({ inputRange: [0, 1], outputRange: [1, 1.03] });

  return (
    <GlassPane
      radius={radii.xl}
      intensity={42}
      tint={colors.glassPaperFocus}
      style={{ flex: 1, minHeight: 0 }}
      contentStyle={styles.content}
    >
      <Text style={styles.label}>QUEST IN PROGRESS</Text>
      <Text style={styles.name}>{q?.name ?? ''}</Text>

      <View style={styles.ringWrap}>
        <Animated.View style={[styles.breatheCircle, { transform: [{ scale: breatheScale }] }]} />
        <Svg width={228} height={228} style={StyleSheet.absoluteFill} pointerEvents="none">
          <G stroke={colors.ink} strokeOpacity={0.16} strokeWidth={0.9} fill="none">
            <Circle cx={114} cy={114} r={26} />
            <Circle cx={114} cy={114} r={42} />
            <Circle cx={114} cy={114} r={58} />
            <Circle cx={114} cy={114} r={74} />
          </G>
        </Svg>
        <Svg width={228} height={228} style={StyleSheet.absoluteFill}>
          <G rotation={-90} origin="114,114">
            <Circle cx={114} cy={114} r={RING_R} stroke="rgba(34,32,27,0.13)" strokeWidth={6} fill="none" />
            <Circle
              cx={114}
              cy={114}
              r={RING_R}
              stroke={colors.ochre}
              strokeWidth={6}
              strokeLinecap="round"
              fill="none"
              strokeDasharray={`${RING_LEN} ${RING_LEN}`}
              strokeDashoffset={RING_LEN * (1 - progress)}
            />
          </G>
        </Svg>
        <View style={styles.ringCenter}>
          <Text style={styles.clock}>{mmss(focusLeft)}</Text>
          <Text style={styles.xpNote}>+{xpFor(q?.mins ?? 0)} XP ON COMPLETION</Text>
        </View>
      </View>

      <Text style={styles.hint}>
        Locked apps stay shut until the timer lands. The music keeps going if you leave this pane.
      </Text>

      <View style={styles.actions}>
        <Pressable style={styles.stopBtn} onPress={bailQuest}>
          <Text style={styles.stopBtnText}>Stop early</Text>
        </Pressable>
      </View>
    </GlassPane>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    minHeight: 0,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  label: { fontFamily: fonts.mono, fontSize: 9.5, letterSpacing: 2, color: inkAlpha(0.52) },
  name: { fontFamily: fonts.bodyExtra, fontSize: 19, marginTop: 8, textAlign: 'center', maxWidth: 250, color: colors.ink },
  ringWrap: { width: 228, height: 228, marginTop: 20, marginBottom: 4, alignItems: 'center', justifyContent: 'center' },
  breatheCircle: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    bottom: 16,
    borderRadius: 98,
    backgroundColor: 'rgba(246,239,216,.62)',
  },
  ringCenter: { alignItems: 'center' },
  clock: { fontFamily: fonts.bodyExtra, fontSize: 46, letterSpacing: -1.4, color: colors.ink, fontVariant: ['tabular-nums'] },
  xpNote: { fontFamily: fonts.mono, fontSize: 10, color: inkAlpha(0.55), marginTop: 7 },
  hint: { fontFamily: fonts.body, fontSize: 12, lineHeight: 18, color: inkAlpha(0.6), textAlign: 'center', maxWidth: 240, marginTop: 10 },
  actions: { width: '100%', maxWidth: 272, marginTop: 18 },
  stopBtn: {
    paddingVertical: 11,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: inkAlpha(0.2),
    alignItems: 'center',
  },
  stopBtnText: { fontFamily: fonts.bodyBold, fontSize: 12.5, color: inkAlpha(0.6) },
});
