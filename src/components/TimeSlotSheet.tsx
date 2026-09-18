import React, { useEffect, useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, { Easing, FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PressableScale from './PressableScale';
import { colors, fonts, inkAlpha, radii } from '../theme';
import { formatSlot } from '../state/schedule';

const ROW_H = 44;

/** Outlook-style time list. The caller supplies the slots, so the same sheet
 *  serves the day's calendar and the round-the-clock settings times. */
export default function TimeSlotSheet({
  title,
  subtitle,
  value,
  slots,
  onPick,
  onClose,
}: {
  title: string;
  subtitle?: string;
  value: number;
  slots: number[];
  onPick: (startMin: number) => void;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const positioned = useRef(false);

  // Open on the current value rather than at the top, three rows up so there is
  // context above it — but only once. Re-running this on every render is what
  // made the list snap back to the current time the moment you started
  // scrolling, since `slots` is a fresh array each time the parent renders.
  useEffect(() => {
    if (positioned.current) return;
    positioned.current = true;
    const index = Math.max(0, slots.indexOf(value));
    const y = Math.max(0, (index - 3) * ROW_H);
    const id = setTimeout(() => scrollRef.current?.scrollTo({ y, animated: false }), 30);
    return () => clearTimeout(id);
  }, [slots, value]);

  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(140)} style={StyleSheet.absoluteFill}>
        <Pressable style={[StyleSheet.absoluteFill, styles.backdrop]} onPress={onClose} />
      </Animated.View>

      <Animated.View
        entering={SlideInDown.duration(240).easing(Easing.out(Easing.cubic))}
        exiting={SlideOutDown.duration(180).easing(Easing.in(Easing.cubic))}
        style={[styles.sheetOuter, { paddingBottom: insets.bottom }]}
      >
        <View style={styles.sheet}>
          <BlurView intensity={55} tint="light" style={StyleSheet.absoluteFill} />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.glassSheet }]} />

          <View style={styles.header}>
            <View style={styles.handle} />
            <Text style={styles.title}>{title}</Text>
            {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>

          <ScrollView ref={scrollRef} style={styles.list} contentContainerStyle={styles.listContent}>
            {slots.map((slot) => {
              const on = slot === value;
              const onTheHour = slot % 60 === 0;
              return (
                <Pressable
                  key={slot}
                  style={[styles.slot, on && styles.slotOn]}
                  onPress={() => onPick(slot)}
                >
                  <Text style={[styles.slotText, onTheHour && styles.slotHour, on && styles.slotTextOn]}>
                    {formatSlot(slot)}
                  </Text>
                  {on && <Text style={styles.slotTick}>{'✓'}</Text>}
                </Pressable>
              );
            })}
          </ScrollView>

          <PressableScale style={styles.cancel} onPress={onClose} scaleTo={0.97}>
            <Text style={styles.cancelText}>Cancel</Text>
          </PressableScale>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: colors.overlay },
  sheetOuter: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  sheet: {
    margin: 8,
    borderRadius: radii.xxl,
    borderWidth: 1,
    borderColor: inkAlpha(0.2),
    overflow: 'hidden',
    maxHeight: 460,
  },
  header: { paddingTop: 12, paddingHorizontal: 16, paddingBottom: 10 },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 999,
    backgroundColor: inkAlpha(0.2),
    alignSelf: 'center',
    marginBottom: 12,
  },
  title: { fontFamily: fonts.bodyExtra, fontSize: 16, color: colors.ink },
  subtitle: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1.3, color: inkAlpha(0.52), marginTop: 5 },

  list: { flexGrow: 0 },
  listContent: { paddingHorizontal: 10, paddingBottom: 6 },
  slot: {
    height: ROW_H,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 13,
    borderRadius: radii.sm,
  },
  slotOn: { backgroundColor: colors.ochre },
  slotText: { fontFamily: fonts.bodyMedium, fontSize: 14, color: inkAlpha(0.6) },
  slotHour: { fontFamily: fonts.bodyBold, color: colors.ink },
  slotTextOn: { fontFamily: fonts.bodyExtra, color: colors.ink },
  slotTick: { fontFamily: fonts.bodyExtra, fontSize: 13, color: colors.ink },

  cancel: { paddingVertical: 14, alignItems: 'center', borderTopWidth: 1, borderTopColor: inkAlpha(0.12) },
  cancelText: { fontFamily: fonts.bodyBold, fontSize: 13, color: inkAlpha(0.6) },
});
