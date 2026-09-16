import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import * as ImagePicker from 'expo-image-picker';
import { colors, fonts, inkAlpha, radii } from '../theme';
import { useQuestStore } from '../state/store';

// Proof-of-completion, the way returning a scooter works: the quest doesn't
// pay out until there's a photo of the finished thing.
export default function PhotoProofPrompt() {
  const quests = useQuestStore((s) => s.quests);
  const awaitingPhotoId = useQuestStore((s) => s.awaitingPhotoId);
  const submitPhoto = useQuestStore((s) => s.submitPhoto);
  const cancelPhoto = useQuestStore((s) => s.cancelPhoto);
  const flash = useQuestStore((s) => s.flash);
  const [busy, setBusy] = useState(false);

  const quest = quests.find((q) => q.id === awaitingPhotoId);
  if (!quest) return null;

  const takePhoto = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        flash('Camera access is needed to prove that one.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({ quality: 0.5 });
      if (result.canceled || !result.assets?.length) return;
      submitPhoto(result.assets[0].uri);
    } catch {
      flash("Couldn't open the camera.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={StyleSheet.absoluteFill}>
      <View style={[StyleSheet.absoluteFill, styles.backdrop]} />
      <View style={styles.center}>
        <View style={styles.card}>
          <BlurView intensity={50} tint="light" style={StyleSheet.absoluteFill} />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.glassSheet }]} />
          <View style={styles.cardContent}>
            <Text style={styles.label}>TIME'S UP</Text>
            <Text style={styles.title}>Show it's done</Text>
            <Text style={styles.body}>
              "{quest.name}" pays out once you've photographed the finished job.
            </Text>
            <Pressable style={styles.primaryBtn} onPress={takePhoto}>
              <Text style={styles.primaryBtnText}>{busy ? 'Opening camera…' : 'Take the photo'}</Text>
            </Pressable>
            <Pressable style={styles.secondaryBtn} onPress={cancelPhoto}>
              <Text style={styles.secondaryBtnText}>Not done yet</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: colors.overlay },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  card: {
    width: '100%',
    maxWidth: 320,
    borderRadius: radii.xxl,
    borderWidth: 1,
    borderColor: inkAlpha(0.2),
    overflow: 'hidden',
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
  cardContent: { padding: 20 },
  label: { fontFamily: fonts.mono, fontSize: 9.5, letterSpacing: 1.8, color: inkAlpha(0.52) },
  title: { fontFamily: fonts.bodyExtra, fontSize: 21, color: colors.ink, marginTop: 8 },
  body: { fontFamily: fonts.body, fontSize: 13, lineHeight: 20, color: inkAlpha(0.65), marginTop: 8 },
  primaryBtn: {
    marginTop: 18,
    paddingVertical: 13,
    borderRadius: 999,
    backgroundColor: colors.ochre,
    alignItems: 'center',
  },
  primaryBtnText: { fontFamily: fonts.bodyBold, fontSize: 13.5, color: colors.ink },
  secondaryBtn: { marginTop: 8, paddingVertical: 11, alignItems: 'center' },
  secondaryBtnText: { fontFamily: fonts.bodyBold, fontSize: 12.5, color: inkAlpha(0.6) },
});
