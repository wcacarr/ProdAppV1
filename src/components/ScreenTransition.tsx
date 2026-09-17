import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

/**
 * Content settles into place: a short eased rise with a fade, the way the
 * reference transition moves. Previously this drew expanding rings, which
 * stuttered — three large bordered views scaling at once is a lot of overdraw
 * for something meant to be barely noticed.
 */
export default function ScreenTransition({
  trigger,
  children,
}: {
  trigger: string;
  children: React.ReactNode;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = 0;
    progress.value = withTiming(1, {
      duration: 340,
      easing: Easing.bezier(0.22, 1, 0.36, 1), // long tail, no overshoot
    });
  }, [trigger, progress]);

  const style = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * 22 }],
  }));

  return (
    <Animated.View style={[styles.fill, style]}>
      <View style={styles.fill}>{children}</View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, minHeight: 0 },
});
