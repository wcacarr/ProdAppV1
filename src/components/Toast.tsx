import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text } from 'react-native';
import { BlurView } from 'expo-blur';
import { fonts } from '../theme';
import { useQuestStore } from '../state/store';

export default function Toast() {
  const toast = useQuestStore((s) => s.toast);
  const v = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!toast) return;
    v.setValue(0);
    Animated.timing(v, { toValue: 1, duration: 2600, easing: Easing.linear, useNativeDriver: true }).start();
  }, [toast, v]);

  if (!toast) return null;

  const opacity = v.interpolate({ inputRange: [0, 0.12, 0.82, 1], outputRange: [0, 1, 1, 0] });
  const translateY = v.interpolate({ inputRange: [0, 0.12, 0.82, 1], outputRange: [16, 0, 0, 6] });

  return (
    <Animated.View style={[styles.wrap, { opacity, transform: [{ translateY }] }]} pointerEvents="none">
      <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
      <Text style={styles.text}>{toast}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 116,
    borderRadius: 14,
    padding: 12,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(28,26,22,.9)',
    overflow: 'hidden',
    shadowColor: '#22201B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.26,
    shadowRadius: 26,
    elevation: 10,
  },
  text: { fontFamily: fonts.bodySemi, fontSize: 12.5, lineHeight: 17, color: '#FDF8E8' },
});
