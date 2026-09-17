import React, { useCallback, useEffect, useState } from 'react';
import { AppState, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInRight } from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import NatureBackground from '../components/NatureBackground';
import GlassPane from '../components/GlassPane';
import PressableScale from '../components/PressableScale';
import SwipeToDelete from '../components/SwipeToDelete';
import { colors, fonts, inkAlpha, radii } from '../theme';
import {
  isAccessibilityServiceEnabled,
  isBlockingSupported,
  isNotificationAccessGranted,
  openAccessibilitySettings,
  openNotificationAccessSettings,
} from '../../modules/questlock-blocker';

type Step = 'privacy' | 'permissions' | 'tutorial';

export default function Onboarding({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState<Step>('privacy');

  return (
    <View style={styles.root}>
      <NatureBackground />
      <View style={styles.center}>
        {step === 'privacy' && <PrivacyStep onNext={() => setStep('permissions')} />}
        {step === 'permissions' && <PermissionsStep onNext={() => setStep('tutorial')} />}
        {step === 'tutorial' && <TutorialStep onDone={onDone} />}
      </View>
    </View>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <Animated.View entering={SlideInRight.duration(280)} exiting={FadeOut.duration(160)} style={styles.cardWrap}>
      <GlassPane radius={radii.xxl} intensity={45} contentStyle={styles.card}>
        {children}
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
}: {
  granted: boolean;
  name: string;
  why: string;
  onPress: () => void;
}) {
  return (
    <View style={styles.permRow}>
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
  );
}

// Learning by doing: each gesture has to actually be performed to move on.
function TutorialStep({ onDone }: { onDone: () => void }) {
  const [swiped, setSwiped] = useState(false);
  const [tapped, setTapped] = useState(false);
  const done = swiped && tapped;

  return (
    <Card>
      <Text style={styles.kicker}>TRY IT</Text>
      <Text style={styles.title}>Two gestures worth knowing</Text>

      <Text style={styles.stepLabel}>{swiped ? '✓  Nicely done' : '1 · Swipe the row left to bin it'}</Text>
      {!swiped ? (
        <SwipeToDelete onDelete={() => setSwiped(true)}>
          <View style={styles.demoRow}>
            <View style={styles.demoChip}>
              <Text style={styles.demoGlyph}>D</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.demoName}>Practice quest</Text>
              <Text style={styles.demoMeta}>SWIPE ME LEFT</Text>
            </View>
          </View>
        </SwipeToDelete>
      ) : (
        <Animated.View entering={FadeIn.duration(200)} style={styles.demoDone}>
          <Text style={styles.demoDoneText}>That is how you remove a quest.</Text>
        </Animated.View>
      )}

      <Text style={styles.stepLabel}>{tapped ? '✓  Found it' : '2 · Tap the XP box for a surprise'}</Text>
      <PressableScale style={styles.demoXp} onPress={() => setTapped(true)} scaleTo={0.94}>
        <Text style={styles.demoXpText}>145 XP</Text>
        <Text style={styles.demoXpSub}>{tapped ? 'Tap it on the real one too' : 'TAP ME'}</Text>
      </PressableScale>

      <PressableScale
        style={[styles.primaryBtn, !done && styles.primaryBtnOff]}
        onPress={() => done && onDone()}
      >
        <Text style={[styles.primaryText, !done && { color: inkAlpha(0.45) }]}>
          {done ? 'Start' : 'Try both to continue'}
        </Text>
      </PressableScale>
      <PressableScale style={styles.skip} onPress={onDone} scaleTo={0.97}>
        <Text style={styles.skipText}>Skip</Text>
      </PressableScale>
    </Card>
  );
}

const styles = StyleSheet.create({
  root: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.paperLight },
  center: { flex: 1, justifyContent: 'center', padding: 16 },
  cardWrap: { width: '100%' },
  card: { padding: 20 },
  kicker: { fontFamily: fonts.mono, fontSize: 9.5, letterSpacing: 1.8, color: inkAlpha(0.5) },
  title: { fontFamily: fonts.bodyExtra, fontSize: 21, color: colors.ink, marginTop: 8, marginBottom: 10 },
  body: { fontFamily: fonts.body, fontSize: 13.5, lineHeight: 21, color: inkAlpha(0.72), marginBottom: 10 },
  bodyDim: { fontFamily: fonts.body, fontSize: 12, lineHeight: 18, color: inkAlpha(0.55), marginBottom: 6 },

  permRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    marginTop: 10,
    padding: 11,
    borderRadius: radii.md,
    backgroundColor: colors.glassCard,
    borderWidth: 1,
    borderColor: inkAlpha(0.13),
  },
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

  stepLabel: { fontFamily: fonts.bodyBold, fontSize: 12.5, color: inkAlpha(0.7), marginTop: 16, marginBottom: 8 },
  demoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: radii.md,
    backgroundColor: colors.glassCard,
    borderWidth: 1,
    borderColor: inkAlpha(0.13),
  },
  demoChip: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(246,239,216,.8)',
    borderWidth: 1,
    borderColor: inkAlpha(0.18),
  },
  demoGlyph: { fontFamily: fonts.mono, fontSize: 12, color: colors.ink },
  demoName: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.ink },
  demoMeta: { fontFamily: fonts.mono, fontSize: 9.5, color: inkAlpha(0.52), marginTop: 3 },
  demoDone: {
    padding: 12,
    borderRadius: radii.md,
    backgroundColor: colors.glassNudge,
    borderWidth: 1,
    borderColor: inkAlpha(0.12),
  },
  demoDoneText: { fontFamily: fonts.body, fontSize: 12.5, color: inkAlpha(0.65) },
  demoXp: {
    padding: 12,
    borderRadius: radii.md,
    backgroundColor: colors.glassNudge,
    borderWidth: 1,
    borderColor: inkAlpha(0.12),
  },
  demoXpText: { fontFamily: fonts.bodyExtra, fontSize: 22, color: colors.ink },
  demoXpSub: { fontFamily: fonts.mono, fontSize: 9.5, color: inkAlpha(0.5), marginTop: 4 },

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
