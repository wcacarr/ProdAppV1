import React, { useMemo, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, { Easing, FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PressableScale from './PressableScale';
import { colors, fonts, inkAlpha, radii, xpFor } from '../theme';
import { useQuestStore } from '../state/store';
import { DURATION_CHOICES } from '../state/data';
import { formatSlot, slotChoices } from '../state/schedule';
import { Quest } from '../state/types';

const SLOT_CHIP_W = 84;

export default function EditQuestSheet({ quest }: { quest: Quest }) {
  const insets = useSafeAreaInsets();
  const close = useQuestStore((s) => s.closeQuestEditor);
  const updateQuest = useQuestStore((s) => s.updateQuest);
  const deleteQuest = useQuestStore((s) => s.deleteQuest);
  const dayWindow = useQuestStore((s) => s.dayWindow);
  const slots = useMemo(() => slotChoices(dayWindow), [dayWindow]);

  const [name, setName] = useState(quest.name);
  const [mins, setMins] = useState(quest.mins);
  const [startMin, setStartMin] = useState(quest.startMin);
  const [needsPhoto, setNeedsPhoto] = useState(quest.needsPhoto);
  const [repeat, setRepeat] = useState(quest.repeat);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Open the strip on the slot the quest is already in, not at 7am.
  const slotScrollRef = useRef<ScrollView>(null);
  const showCurrentSlot = () => {
    const index = Math.max(0, slots.indexOf(quest.startMin));
    slotScrollRef.current?.scrollTo({ x: Math.max(0, (index - 1) * SLOT_CHIP_W), animated: false });
  };

  const dismiss = () => {
    Keyboard.dismiss();
    close();
  };

  const save = () => {
    const trimmed = name.trim();
    Keyboard.dismiss();
    updateQuest(quest.id, {
      name: trimmed || quest.name,
      glyph: (trimmed || quest.name)[0].toUpperCase(),
      mins,
      startMin,
      needsPhoto,
      repeat,
    });
  };

  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(140)} style={StyleSheet.absoluteFill}>
        <Pressable style={[StyleSheet.absoluteFill, styles.backdrop]} onPress={dismiss} />
      </Animated.View>

      {/* Android resizes the window for the keyboard already; padding on top
          of that shunts the sheet off the screen. */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.outer}
        pointerEvents="box-none"
      >
        <Animated.View
          entering={SlideInDown.duration(240).easing(Easing.out(Easing.cubic))}
          exiting={SlideOutDown.duration(180).easing(Easing.in(Easing.cubic))}
          style={[styles.sheet, { marginBottom: 8 + insets.bottom }]}
        >
          <BlurView intensity={50} tint="light" style={StyleSheet.absoluteFill} />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.glassSheet }]} />

          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <View style={styles.handle} />
            <Text style={styles.title}>Edit quest</Text>

            <Text style={styles.label}>NAME</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="What is it?"
              placeholderTextColor={inkAlpha(0.4)}
              style={styles.input}
            />

            <Text style={styles.label}>HOW LONG</Text>
            <View style={styles.durationRow}>
              {DURATION_CHOICES.map((m) => {
                const on = mins === m;
                return (
                  <Pressable
                    key={m}
                    style={[styles.durationBtn, on && styles.durationBtnOn]}
                    onPress={() => setMins(m)}
                  >
                    <Text style={styles.durationText}>{m}m</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.label}>WHEN</Text>
            <ScrollView
              ref={slotScrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              onLayout={showCurrentSlot}
              contentContainerStyle={styles.slotStrip}
            >
              {slots.map((slot) => {
                const on = slot === startMin;
                return (
                  <Pressable
                    key={slot}
                    style={[styles.slotChip, on && styles.slotChipOn]}
                    onPress={() => setStartMin(slot)}
                  >
                    <Text style={[styles.slotChipText, on && styles.slotChipTextOn]}>
                      {formatSlot(slot)}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Pressable style={styles.toggleRow} onPress={() => setRepeat(!repeat)}>
              <View style={[styles.checkbox, repeat && styles.checkboxOn]}>
                {repeat && <Text style={styles.checkmark}>{'✓'}</Text>}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.toggleLabel}>Every day</Text>
                <Text style={styles.toggleHint}>
                  {repeat
                    ? 'Comes back unticked tomorrow — part of the routine.'
                    : 'A one-off. It leaves the calendar when the day rolls over.'}
                </Text>
              </View>
            </Pressable>

            <Pressable style={styles.toggleRow} onPress={() => setNeedsPhoto(!needsPhoto)}>
              <View style={[styles.checkbox, needsPhoto && styles.checkboxOn]}>
                {needsPhoto && <Text style={styles.checkmark}>{'✓'}</Text>}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.toggleLabel}>Photo to finish</Text>
                <Text style={styles.toggleHint}>You'll have to show the finished job to claim the XP.</Text>
              </View>
            </Pressable>

            <Text style={styles.summary}>
              {formatSlot(startMin)} · {mins} MIN PAYS +{xpFor(mins)} XP
            </Text>

            <PressableScale style={styles.saveBtn} onPress={save}>
              <Text style={styles.saveText}>Save changes</Text>
            </PressableScale>

            <PressableScale
              style={[styles.deleteBtn, confirmDelete && styles.deleteBtnArmed]}
              onPress={() => (confirmDelete ? deleteQuest(quest.id) : setConfirmDelete(true))}
              scaleTo={0.97}
            >
              <Text style={[styles.deleteText, confirmDelete && styles.deleteTextArmed]}>
                {confirmDelete ? 'Tap again to delete' : 'Delete quest'}
              </Text>
            </PressableScale>
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: colors.overlay },
  outer: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    margin: 8,
    borderRadius: radii.xxl,
    borderWidth: 1,
    borderColor: inkAlpha(0.2),
    overflow: 'hidden',
    maxHeight: '86%',
  },
  content: { paddingTop: 14, paddingHorizontal: 16, paddingBottom: 18 },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 999,
    backgroundColor: inkAlpha(0.2),
    alignSelf: 'center',
    marginBottom: 13,
  },
  title: { fontFamily: fonts.bodyExtra, fontSize: 17, color: colors.ink },
  label: {
    fontFamily: fonts.mono,
    fontSize: 9.5,
    letterSpacing: 1.6,
    color: inkAlpha(0.45),
    marginTop: 15,
    marginBottom: 8,
  },
  input: {
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
  durationRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  durationBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 11,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: inkAlpha(0.16),
    backgroundColor: 'rgba(255,252,242,.8)',
  },
  durationBtnOn: { backgroundColor: colors.ochre, borderColor: 'rgba(34,32,27,0.3)' },
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

  toggleRow: {
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
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: inkAlpha(0.25),
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: { backgroundColor: colors.ochre, borderColor: inkAlpha(0.3) },
  checkmark: { fontFamily: fonts.bodyExtra, fontSize: 12, color: colors.ink },
  toggleLabel: { fontFamily: fonts.bodyBold, fontSize: 12.5, color: colors.ink },
  toggleHint: { fontFamily: fonts.body, fontSize: 11, lineHeight: 15, color: inkAlpha(0.6), marginTop: 2 },

  summary: { fontFamily: fonts.mono, fontSize: 10, color: inkAlpha(0.5), marginTop: 14 },
  saveBtn: {
    marginTop: 12,
    paddingVertical: 13,
    borderRadius: 999,
    backgroundColor: colors.ink,
    alignItems: 'center',
  },
  saveText: { fontFamily: fonts.bodyBold, fontSize: 13.5, color: colors.paperLight },
  deleteBtn: {
    marginTop: 9,
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: inkAlpha(0.18),
  },
  deleteBtnArmed: { borderColor: 'rgba(150,54,38,0.6)', backgroundColor: 'rgba(150,54,38,0.1)' },
  deleteText: { fontFamily: fonts.bodySemi, fontSize: 12.5, color: inkAlpha(0.55) },
  deleteTextArmed: { fontFamily: fonts.bodyBold, color: '#963626' },
});
