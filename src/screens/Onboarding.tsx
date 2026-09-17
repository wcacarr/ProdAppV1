import React, { useCallback, useEffect, useState } from 'react';
import { AppState, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInRight } from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import NatureBackground from '../components/NatureBackground';
import GlassPane from '../components/GlassPane';
import PressableScale from '../components/PressableScale';
import ScheduleTutorial from '../components/ScheduleTutorial';
import { colors, fonts, inkAlpha, radii } from '../theme';
import { useQuestStore } from '../state/store';
import {
  isAccessibilityServiceEnabled,
  isBlockingSupported,
  isNotificationAccessGranted,
  openAccessibilitySettings,
  openAppInfo,
  openNotificationAccessSettings,
} from '../../modules/questlock-blocker';

type Step = 'privacy' | 'permissions' | 'tutorial';

export default function Onboarding({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState<Step>('privacy');
  const dayWindow = useQuestStore((s) => s.dayWindow);

  return (
    <View style={styles.root}>
      <NatureBackground />
      <View style={styles.center}>
        {step === 'privacy' && <PrivacyStep onNext={() => setStep('permissions')} />}
        {step === 'permissions' && <PermissionsStep onNext={() => setStep('tutorial')} />}
        {step === 'tutorial' && (
          // The tutorial is taller than a phone, so this card scrolls.
          <Card scroll>
            <ScheduleTutorial window={dayWindow} onDone={onDone} onSkip={onDone} />
          </Card>
        )}
      </View>
    </View>
  );
}

function Card({ children, scroll = false }: { children: React.ReactNode; scroll?: boolean }) {
  return (
    <Animated.View
      entering={SlideInRight.duration(280)}
      exiting={FadeOut.duration(160)}
      style={[styles.cardWrap, scroll && styles.cardWrapScroll]}
    >
      <GlassPane
        radius={radii.xxl}
        intensity={45}
        style={scroll ? styles.paneScroll : undefined}
        contentStyle={scroll ? styles.paneScroll : styles.card}
      >
        {scroll ? (
          <ScrollView contentContainerStyle={styles.card} showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
        ) : (
          children
        )}
      </GlassPane>
    </Animated.View>
  );
}

function PrivacyStep({ onNext }: { onNext: () => void }) {
  return (
    <Card>
      <Text style={styles.kicker}>BEFORE YOU START</Text>
      <Text style={styles.title}>Everything stays on this phone</Text>
      <ScrollView style={{ maxHeight: 280 }}>
        <Text style={styles.body}>
          Tasuku has no account and no server. Your quests, XP and locked apps live only in this
          app's local storage on this device.
        </Text>
        <Text style={styles.body}>
          Photos you take to prove a task are the important one: they are never uploaded, never
          leave the phone, and nobody — including us — can see them.
        </Text>
        <Text style={styles.bodyDim}>
          The flip side is that nothing is backed up. Uninstalling the app, or clearing its data,
          deletes all of it permanently.
        </Text>
      </ScrollView>
      <PressableScale style={styles.primaryBtn} onPress={onNext}>
        <Text style={styles.primaryText}>I understand</Text>
      </PressableScale>
    </Card>
  );
}

function PermissionsStep({ onNext }: { onNext: () => void }) {
  const [accessibility, setAccessibility] = useState(false);
  const [notifications, setNotifications] = useState(false);
  const [camera, setCamera] = useState(false);

  const refresh = useCallback(() => {
    setAccessibility(isAccessibilityServiceEnabled());
    setNotifications(isNotificationAccessGranted());
    ImagePicker.getCameraPermissionsAsync()
      .then((r) => setCamera(r.granted))
      .catch(() => {});
  }, []);

  useEffect(() => {
    refresh();
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  return (
    <Card>
      <Text style={styles.kicker}>PERMISSIONS</Text>
      <Text style={styles.title}>Three things to allow</Text>
      <Text style={styles.bodyDim}>
        Each one opens Android's settings. Come back here and it ticks itself off.
      </Text>

      <PermissionRow
        granted={accessibility}
        name="App locking"
        why="Lets Tasuku notice when a locked app opens and send you home."
        onPress={openAccessibilitySettings}
        escapeHatch={{ label: 'Greyed out?', onPress: openAppInfo }}
        escapeHint="Android blocks this for apps installed outside the Play Store. Open App info → ⋮ (top right) → Allow restricted settings, then come back."
      />
      <PermissionRow
        granted={notifications}
        name="Media controls"
        why="Lets the dock see and control whatever is playing."
        onPress={openNotificationAccessSettings}
      />
      <PermissionRow
        granted={camera}
        name="Camera"
        why="Only used for photo proof on tasks you mark as needing it."
        onPress={() => ImagePicker.requestCameraPermissionsAsync().then(refresh).catch(() => {})}
      />

      <PressableScale style={styles.primaryBtn} onPress={onNext}>
        <Text style={styles.primaryText}>
          {accessibility && notifications && camera ? 'All set' : 'Continue'}
        </Text>
      </PressableScale>
      {!isBlockingSupported && (
        <Text style={styles.bodyDim}>Running without the native module — permissions are skipped.</Text>
      )}
    </Card>
  );
}

function PermissionRow({
  granted,
  name,
  why,
  onPress,
  escapeHatch,
  escapeHint,
}: {
  granted: boolean;
  name: string;
  why: string;
  onPress: () => void;
  /** Secondary route for when Android won't let the main one through. */
  escapeHatch?: { label: string; onPress: () => void };
  escapeHint?: string;
}) {
  const [showHint, setShowHint] = useState(false);

  return (
    <View style={styles.permRow}>
      <View style={styles.permRowTop}>
        <View style={[styles.tick, granted && styles.tickOn]}>
          {granted && <Text style={styles.tickMark}>{'✓'}</Text>}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.permName}>{name}</Text>
          <Text style={styles.permWhy}>{why}</Text>
        </View>
        {!granted && (
          <PressableScale style={styles.allowBtn} onPress={onPress}>
            <Text style={styles.allowText}>Allow</Text>
          </PressableScale>
        )}
      </View>

      {!granted && escapeHatch && (
        <PressableScale style={styles.escape} onPress={() => setShowHint((v) => !v)} scaleTo={0.98}>
          <Text style={styles.escapeText}>{escapeHatch.label}</Text>
        </PressableScale>
      )}
      {!granted && escapeHatch && showHint && (
        <Animated.View entering={FadeIn.duration(180)} style={styles.escapePanel}>
          <Text style={styles.escapeHint}>{escapeHint}</Text>
          <PressableScale style={styles.escapeBtn} onPress={escapeHatch.onPress}>
            <Text style={styles.escapeBtnText}>Open App info</Text>
          </PressableScale>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.paperLight },
  center: { flex: 1, justifyContent: 'center', padding: 16 },
  cardWrap: { width: '100%' },
  cardWrapScroll: { width: '100%', flexShrink: 1, minHeight: 0 },
  paneScroll: { flexShrink: 1, minHeight: 0 },
  card: { padding: 20 },
  kicker: { fontFamily: fonts.mono, fontSize: 9.5, letterSpacing: 1.8, color: inkAlpha(0.5) },
  title: { fontFamily: fonts.bodyExtra, fontSize: 21, color: colors.ink, marginTop: 8, marginBottom: 10 },
  body: { fontFamily: fonts.body, fontSize: 13.5, lineHeight: 21, color: inkAlpha(0.72), marginBottom: 10 },
  bodyDim: { fontFamily: fonts.body, fontSize: 12, lineHeight: 18, color: inkAlpha(0.55), marginBottom: 6 },

  permRow: {
    marginTop: 10,
    padding: 11,
    borderRadius: radii.md,
    backgroundColor: colors.glassCard,
    borderWidth: 1,
    borderColor: inkAlpha(0.13),
  },
  permRowTop: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  escape: { paddingTop: 9, paddingBottom: 2 },
  escapeText: {
    fontFamily: fonts.bodySemi,
    fontSize: 11.5,
    color: colors.ochreDeep,
    textDecorationLine: 'underline',
  },
  escapePanel: {
    marginTop: 8,
    padding: 11,
    borderRadius: radii.sm,
    backgroundColor: colors.glassNudge,
    borderWidth: 1,
    borderColor: inkAlpha(0.12),
  },
  escapeHint: { fontFamily: fonts.body, fontSize: 11.5, lineHeight: 17, color: inkAlpha(0.68) },
  escapeBtn: {
    marginTop: 10,
    paddingVertical: 9,
    borderRadius: 999,
    alignItems: 'center',
    backgroundColor: 'rgba(255,252,242,.85)',
    borderWidth: 1,
    borderColor: inkAlpha(0.18),
  },
  escapeBtnText: { fontFamily: fonts.bodyBold, fontSize: 11.5, color: colors.ink },
  tick: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: inkAlpha(0.25),
    alignItems: 'center',
    justifyContent: 'center',
  },
  tickOn: { backgroundColor: colors.ochre, borderColor: inkAlpha(0.3) },
  tickMark: { fontFamily: fonts.bodyExtra, fontSize: 12, color: colors.ink },
  permName: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.ink },
  permWhy: { fontFamily: fonts.body, fontSize: 11.5, lineHeight: 16, color: inkAlpha(0.6), marginTop: 2 },
  allowBtn: { paddingVertical: 8, paddingHorizontal: 13, borderRadius: 999, backgroundColor: colors.ochre },
  allowText: { fontFamily: fonts.bodyBold, fontSize: 11.5, color: colors.ink },

  primaryBtn: {
    marginTop: 18,
    paddingVertical: 13,
    borderRadius: 999,
    backgroundColor: colors.ochre,
    alignItems: 'center',
  },
  primaryBtnOff: { backgroundColor: 'transparent', borderWidth: 1, borderColor: inkAlpha(0.18) },
  primaryText: { fontFamily: fonts.bodyBold, fontSize: 13.5, color: colors.ink },
  skip: { paddingVertical: 10, alignItems: 'center' },
  skipText: { fontFamily: fonts.bodySemi, fontSize: 12, color: inkAlpha(0.5) },
});
