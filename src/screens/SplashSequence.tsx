import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { createAudioPlayer } from 'expo-audio';
import { safePlay } from '../sound/safePlay';
import NatureBackground from '../components/NatureBackground';
import { colors, fonts, inkAlpha } from '../theme';

const HOLD_MS = 2600;

// Bell rings as the word settles, the way a jingle lands with a logo.
function ringBell() {
  try {
    const player = createAudioPlayer(require('../../assets/sounds/bell.wav'));
    player.volume = 0.7;
    safePlay(player);
    setTimeout(() => {
      try {
        player.release();
      } catch {
        // already gone
      }
    }, 5000);
  } catch {
    // no audio on this device — the splash still runs
  }
}

export default function SplashSequence({ onDone }: { onDone: () => void }) {
  const fade = useSharedValue(0);
  const spread = useSharedValue(0);
  const ringScale = useSharedValue(0);

  useEffect(() => {
    ringBell();
    fade.value = withTiming(1, { duration: 1100, easing: Easing.out(Easing.cubic) });
    spread.value = withTiming(1, { duration: 1900, easing: Easing.out(Easing.cubic) });
    ringScale.value = withTiming(1, { duration: 2400, easing: Easing.out(Easing.quad) });
    const t = setTimeout(onDone, HOLD_MS);
    return () => clearTimeout(t);
  }, [fade, spread, ringScale, onDone]);

  // Letter-spacing settling outward is the whole move — it reads as a breath.
  const wordStyle = useAnimatedStyle(() => ({
    opacity: fade.value,
    letterSpacing: 2 + spread.value * 12,
    transform: [{ scale: 0.94 + fade.value * 0.06 }],
  }));

  const subStyle = useAnimatedStyle(() => ({
    opacity: withDelay(700, withTiming(fade.value * 0.75, { duration: 800 })),
  }));

  // A single expanding ring, like the strike travelling outward.
  const ringStyle = useAnimatedStyle(() => ({
    opacity: (1 - ringScale.value) * 0.5,
    transform: [{ scale: 0.3 + ringScale.value * 2.4 }],
  }));

  return (
    <Animated.View style={styles.root} exiting={FadeOut.duration(520)}>
      <NatureBackground />
      <View style={styles.center}>
        <Animated.View style={[styles.ring, ringStyle]} pointerEvents="none" />
        <Animated.Text style={[styles.word, wordStyle]}>Tasuku</Animated.Text>
        <Animated.Text style={[styles.sub, subStyle]}>タスク</Animated.Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.paperLight },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  ring: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    borderWidth: 1,
    borderColor: colors.ochre,
  },
  word: {
    fontFamily: fonts.brand,
    fontSize: 42,
    color: colors.ink,
  },
  sub: {
    fontFamily: fonts.brand,
    fontSize: 13,
    color: inkAlpha(0.5),
    marginTop: 14,
    letterSpacing: 6,
  },
});
