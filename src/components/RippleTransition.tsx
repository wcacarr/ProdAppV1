import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '../theme';

const RINGS = [0, 120, 240];

/**
 * Concentric rings spreading from the centre on each screen change — the
 * raked-sand ripple the background art is already built from. A true
 * refraction would need a shader; this reads as water in the same language
 * as the rest of the illustration.
 */
export default function RippleTransition({ trigger }: { trigger: string }) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {RINGS.map((delay, i) => (
        <Ring key={`${trigger}-${i}`} delay={delay} />
      ))}
    </View>
  );
}

function Ring({ delay }: { delay: number }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) })
    );
  }, [progress, delay]);

  const style = useAnimatedStyle(() => ({
    opacity: (1 - progress.value) * 0.32,
    transform: [
      { scaleX: 0.15 + progress.value * 2.6 },
      // Flattened vertically so it lands like a ripple on a pond surface
      // rather than a circle drawn on glass.
      { scaleY: (0.15 + progress.value * 2.6) * 0.42 },
    ],
  }));

  return (
    <View style={styles.center} pointerEvents="none">
      <Animated.View style={[styles.ring, style]} />
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    width: 260,
    height: 260,
    borderRadius: 130,
    borderWidth: 1.5,
    borderColor: colors.ochreDeep,
  },
});
