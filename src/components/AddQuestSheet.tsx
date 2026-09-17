import React from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, inkAlpha, radii, xpFor } from '../theme';
import { useQuestStore } from '../state/store';
import { DURATION_CHOICES, PRESETS } from '../state/data';
import { DAY_START_MIN, SLOT_MIN, formatSlot, slotChoices } from '../state/schedule';

const SLOT_CHIP_W = 84;

export default function AddQuestSheet() {
  const scrollRef = React.useRef<ScrollView>(null);
  const timeScrollRef = React.useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();
  const closeSheet = useQuestStore((s) => s.closeSheet);
  const draftName = useQuestStore((s) => s.draftName);
  const draftMins = useQuestStore((s) => s.draftMins);
  const setDraftName = useQuestStore((s) => s.setDraftName);
  const setDraftMins = useQuestStore((s) => s.setDraftMins);
  const addPreset = useQuestStore((s) => s.addPreset);
  const addCustom = useQuestStore((s) => s.addCustom);
  const draftNeedsPhoto = useQuestStore((s) => s.draftNeedsPhoto);
  const setDraftNeedsPhoto = useQuestStore((s) => s.setDraftNeedsPhoto);
  const draftStartMin = useQuestStore((s) => s.draftStartMin);
  const setDraftStartMin = useQuestStore((s) => s.setDraftStartMin);

  const dragY = useSharedValue(0);
  // The sheet can only be thrown away from the top of its own scroll, so
  // dragging down mid-list still scrolls the list.
  const [atTop, setAtTop] = React.useState(true);

  const dismiss = React.useCallback(() => {
    Keyboard.dismiss();
    closeSheet();
  }, [closeSheet]);

  // Drag the sheet down to throw it away; short drags spring back.
  const swipeDown = Gesture.Pan()
    .enabled(atTop)
    .activeOffsetY(12)
    .failOffsetY(-14)
    .onUpdate((e) => {
      dragY.value = Math.max(0, e.translationY);
    })
    .onEnd((e) => {
      if (e.translationY > 110 || e.velocityY > 900) {
        runOnJS(dismiss)();
      } else {
        dragY.value = withTiming(0, { duration: 180, easing: Easing.out(Easing.cubic) });
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: dragY.value }],
  }));

  // Open the slot strip on the chosen time rather than at 7am.
  const onSlotStripLayout = () => {
    const index = Math.max(0, Math.round((draftStartMin - DAY_START_MIN) / SLOT_MIN));
    timeScrollRef.current?.scrollTo({ x: Math.max(0, (index - 1) * SLOT_CHIP_W), animated: false });
  };

  return (
    <View style={StyleSheet.absoluteFill}>
      <Pressable style={[StyleSheet.absoluteFill, styles.backdrop]} onPress={dismiss} />
      <KeyboardAvoidingView
        behavior="padding"
        style={styles.sheetOuter}
        pointerEvents="box-none"
      >
        <GestureDetector gesture={swipeDown}>
        <Animated.View style={[styles.sheetClip, { marginBottom: 8 + insets.bottom }, sheetStyle]}>
          <BlurView intensity={50} tint="light" style={StyleSheet.absoluteFill} />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.glassSheet }]} />
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={styles.sheetContent}
            keyboardShouldPersistTaps="handled"
            scrollEventThrottle={32}
            onScroll={(e) => setAtTop(e.nativeEvent.contentOffset.y <= 2)}
          >
            <View style={styles.handle} />
            <Text style={styles.title}>Add a quest</Text>
            <Text style={styles.subtitle}>PICK ONE OR WRITE YOUR OWN</Text>

            <View style={styles.presetWrap}>
              {PRESETS.map((p) => (
                <Pressable
                  key={p.name}
                  style={styles.presetPill}
                  onPress={() => addPreset(p.name, p.mins, p.glyph, p.needsPhoto)}
                >
                  <Text style={styles.presetName}>{p.name}</Text>
                  <Text style={styles.presetMeta}>
                    {p.mins}m · +{xpFor(p.mins)}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.divider} />
            <Text style={styles.ownLabel}>YOUR OWN</Text>
            <TextInput
              value={draftName}
              onChangeText={setDraftName}
              onFocus={() => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120)}
              placeholder="e.g. 20 minutes of guitar"
              placeholderTextColor={inkAlpha(0.4)}
              style={styles.input}
            />
            <View style={styles.durationRow}>
              {DURATION_CHOICES.map((m) => {
                const on = draftMins === m;
                return (
                  <Pressable
                    key={m}
                    style={[
                      styles.durationBtn,
                      { backgroundColor: on ? colors.ochre : 'rgba(255,252,242,.8)', borderColor: on ? 'rgba(34,32,27,0.3)' : inkAlpha(0.16) },
                    ]}
                    onPress={() => setDraftMins(m)}
                  >
                    <Text style={styles.durationText}>{m}m</Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={[styles.ownLabel, { marginTop: 13 }]}>WHEN</Text>
            <ScrollView
              ref={timeScrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              onLayout={onSlotStripLayout}
              contentContainerStyle={styles.slotStrip}
            >
              {slotChoices().map((slot) => {
                const on = slot === draftStartMin;
                return (
                  <Pressable
                    key={slot}
                    style={[styles.slotChip, on && styles.slotChipOn]}
                    onPress={() => setDraftStartMin(slot)}
                  >
                    <Text style={[styles.slotChipText, on && styles.slotChipTextOn]}>
                      {formatSlot(slot)}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Pressable style={styles.photoToggle} onPress={() => setDraftNeedsPhoto(!draftNeedsPhoto)}>
              <View style={[styles.photoCheckbox, draftNeedsPhoto && styles.photoCheckboxOn]}>
                {draftNeedsPhoto && <Text style={styles.photoCheckmark}>{'✓'}</Text>}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.photoLabel}>Photo to finish</Text>
                <Text style={styles.photoHint}>You'll have to show the finished job to claim the XP.</Text>
              </View>
            </Pressable>

            <Text style={styles.xpHint}>
              {formatSlot(draftStartMin)} · {draftMins} MIN PAYS +{xpFor(draftMins)} XP
            </Text>
            <Pressable style={styles.addBtn} onPress={addCustom}>
              <Text style={styles.addBtnText}>Add to today</Text>
            </Pressable>
          </ScrollView>
        </Animated.View>
        </GestureDetector>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: colors.overlay },
  sheetOuter: { flex: 1, justifyContent: 'flex-end' },
  sheetClip: {
    margin: 8,
    borderRadius: radii.xxl,
    borderWidth: 1,
    borderColor: inkAlpha(0.2),
    overflow: 'hidden',
    maxHeight: '76%',
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
  sheetContent: { paddingTop: 14, paddingHorizontal: 16, paddingBottom: 18 },
  handle: { width: 36, height: 4, borderRadius: 999, backgroundColor: inkAlpha(0.2), alignSelf: 'center', marginBottom: 13 },
  title: { fontFamily: fonts.bodyExtra, fontSize: 17, color: colors.ink },
  subtitle: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1.4, color: inkAlpha(0.52), marginTop: 6 },
  presetWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 13 },
  presetPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(255,252,242,.8)',
    borderWidth: 1,
    borderColor: inkAlpha(0.16),
  },
  presetName: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.ink },
  presetMeta: { fontFamily: fonts.mono, fontSize: 10, color: inkAlpha(0.5) },
  divider: { height: 1, backgroundColor: inkAlpha(0.12), marginTop: 16, marginBottom: 13 },
  ownLabel: { fontFamily: fonts.mono, fontSize: 9.5, letterSpacing: 1.6, color: inkAlpha(0.45), marginBottom: 8 },
  input: {
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 13,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: inkAlpha(0.18),
    backgroundColor: 'rgba(255,252,242,.85)',
    fontFamily: fonts.bodySemi,
    fontSize: 13.5,
    color: colors.ink,
  },
  durationRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 10 },
  durationBtn: { flex: 1, paddingVertical: 10, borderRadius: 11, alignItems: 'center', borderWidth: 1 },
  durationText: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.ink },
  slotStrip: { gap: 7, paddingRight: 4 },
  slotChip: {
    width: SLOT_CHIP_W - 7,
    paddingVertical: 10,
    borderRadius: 11,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: inkAlpha(0.16),
    backgroundColor: 'rgba(255,252,242,.8)',
  },
  slotChipOn: { backgroundColor: colors.ochre, borderColor: 'rgba(34,32,27,0.3)' },
  slotChipText: { fontFamily: fonts.bodySemi, fontSize: 12, color: inkAlpha(0.65) },
  slotChipTextOn: { fontFamily: fonts.bodyExtra, color: colors.ink },
  photoToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
    padding: 11,
    borderRadius: radii.md,
    backgroundColor: 'rgba(246,239,216,.6)',
    borderWidth: 1,
    borderColor: inkAlpha(0.12),
  },
  photoCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: inkAlpha(0.25),
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoCheckboxOn: { backgroundColor: colors.ochre, borderColor: inkAlpha(0.3) },
  photoCheckmark: { fontFamily: fonts.bodyExtra, fontSize: 12, color: colors.ink },
  photoLabel: { fontFamily: fonts.bodyBold, fontSize: 12.5, color: colors.ink },
  photoHint: { fontFamily: fonts.body, fontSize: 11, lineHeight: 15, color: inkAlpha(0.6), marginTop: 2 },
  xpHint: { fontFamily: fonts.mono, fontSize: 10, lineHeight: 14, color: inkAlpha(0.5), marginTop: 10 },
  addBtn: { marginTop: 13, paddingVertical: 13, borderRadius: 999, backgroundColor: colors.ink, alignItems: 'center' },
  addBtnText: { fontFamily: fonts.bodyBold, fontSize: 13.5, color: colors.paperLight },
});
