import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path, Rect } from 'react-native-svg';
import { colors, fonts, inkAlpha, radii } from '../theme';

const THRESHOLD = -96;
const OFF_SCREEN = -520;

// Drag left to reveal the bin; past the threshold it commits and the row
// slides out. Below it, the row springs back.
export default function SwipeToDelete({
  children,
  onDelete,
}: {
  children: React.ReactNode;
  onDelete: () => void;
}) {
  const translateX = useSharedValue(0);
  const height = useSharedValue<number | undefined>(undefined);

  const pan = Gesture.Pan()
    .activeOffsetX([-12, 12])
    .failOffsetY([-10, 10])
    .onUpdate((e) => {
      translateX.value = Math.min(0, e.translationX);
    })
    .onEnd(() => {
      if (translateX.value < THRESHOLD) {
        translateX.value = withTiming(OFF_SCREEN, { duration: 180 }, (done) => {
          if (done) runOnJS(onDelete)();
        });
      } else {
        translateX.value = withSpring(0, { damping: 20, stiffness: 240 });
      }
    });

  const rowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  // The bin fades and grows as the row clears it, so the gesture feels
  // like it's uncovering something rather than just sliding.
  const binStyle = useAnimatedStyle(() => {
    const progress = Math.min(1, Math.abs(translateX.value) / Math.abs(THRESHOLD));
    return {
      opacity: progress,
      transform: [{ scale: 0.7 + progress * 0.3 }],
    };
  });

  return (
    <View style={styles.wrap}>
      <Animated.View style={[styles.binLane, binStyle]} pointerEvents="none">
        <BinIcon />
        <Text style={styles.binText}>Delete</Text>
      </Animated.View>
      <GestureDetector gesture={pan}>
        <Animated.View style={rowStyle}>{children}</Animated.View>
      </GestureDetector>
    </View>
  );
}

function BinIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24">
      <Path d="M5 7h14l-1 13H6L5 7z" fill="none" stroke={colors.paperLight} strokeWidth={1.8} />
      <Rect x={9} y={10} width={1.6} height={7} fill={colors.paperLight} />
      <Rect x={13.4} y={10} width={1.6} height={7} fill={colors.paperLight} />
      <Path d="M3.5 7h17M9.5 7V4.5h5V7" fill="none" stroke={colors.paperLight} strokeWidth={1.8} />
    </Svg>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'relative' },
  binLane: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 96,
    borderRadius: radii.md,
    backgroundColor: 'rgba(150,54,38,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    borderWidth: 1,
    borderColor: inkAlpha(0.18),
  },
  binText: { fontFamily: fonts.bodyBold, fontSize: 10.5, color: colors.paperLight },
});
