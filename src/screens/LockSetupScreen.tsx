import React, { useCallback, useEffect, useState } from 'react';
import { AppState, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import GlassPane from '../components/GlassPane';
import UnlockChallenge from '../components/UnlockChallenge';
import { colors, fonts, inkAlpha, radii } from '../theme';
import { useQuestStore } from '../state/store';
import { AppEntry, useAppRegistry } from '../state/useAppRegistry';
import {
  isAccessibilityServiceEnabled,
  isBlockingSupported,
  isNotificationAccessGranted,
  lockApp,
  openAccessibilitySettings,
  openNotificationAccessSettings,
  unlockApp,
} from '../../modules/questlock-blocker';

export default function LockSetupScreen() {
  const flash = useQuestStore((s) => s.flash);
  const { entries, loading, refreshLocks } = useAppRegistry();
  const [enforcementOn, setEnforcementOn] = useState(false);
  const [mediaOn, setMediaOn] = useState(false);
  const [challenge, setChallenge] = useState<AppEntry | null>(null);

  const refreshPermissions = useCallback(() => {
    setEnforcementOn(isAccessibilityServiceEnabled());
    setMediaOn(isNotificationAccessGranted());
  }, []);

  useEffect(() => {
    refreshPermissions();
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') refreshPermissions();
    });
    return () => sub.remove();
  }, [refreshPermissions]);

  const toggle = (entry: AppEntry) => {
    if (!entry.locked) {
      lockApp(entry.packageName);
      refreshLocks();
      flash(`${entry.label} locks in 1 minute.`);
      return;
    }
    if (entry.inGrace) {
      unlockApp(entry.packageName);
      refreshLocks();
      return;
    }
    setChallenge(entry);
  };

  if (!isBlockingSupported) {
    return (
      <GlassPane radius={radii.xl} intensity={35} style={{ flex: 1 }} contentStyle={styles.pad}>
        <Text style={styles.title}>App locking needs a dev build</Text>
        <Text style={styles.body}>
          The native module isn't present here. Run{'\n'}
          <Text style={styles.mono}>npx expo run:android</Text>
          {'\n'}on a real device to test blocking.
        </Text>
      </GlassPane>
    );
  }

  return (
    <>
      <GlassPane
        radius={radii.xl}
        intensity={35}
        style={{ flex: 1, minHeight: 0 }}
        contentStyle={{ flex: 1, minHeight: 0 }}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Locked apps</Text>
          <Text style={styles.subtitle}>ONE MINUTE TO CHANGE YOUR MIND</Text>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <PermissionRow
            on={enforcementOn}
            title={enforcementOn ? 'Enforcement is on' : 'Enforcement is off'}
            body={
              enforcementOn
                ? 'Opening a locked app sends you home.'
                : 'Questlock needs accessibility access to notice which app opened.'
            }
            onPress={openAccessibilitySettings}
          />
          <PermissionRow
            on={mediaOn}
            title={mediaOn ? 'Media controls are on' : 'Media controls are off'}
            body={
              mediaOn
                ? 'The dock can control whatever is playing.'
                : 'Notification access lets the dock see Audible, Spotify and the rest.'
            }
            onPress={openNotificationAccessSettings}
          />

          <Text style={styles.sectionLabel}>PICK APPS TO LOCK</Text>
          {loading && <Text style={styles.body}>Loading your apps…</Text>}
          {entries.map((entry) => (
            <AppRow key={entry.packageName} entry={entry} onToggle={() => toggle(entry)} />
          ))}
        </ScrollView>
      </GlassPane>

      {challenge && (
        <UnlockChallenge
          appLabel={challenge.label}
          onPass={() => {
            unlockApp(challenge.packageName);
            refreshLocks();
            setChallenge(null);
            flash(`${challenge.label} unlocked.`);
          }}
          onCancel={() => setChallenge(null)}
        />
      )}
    </>
  );
}

function PermissionRow({
  on,
  title,
  body,
  onPress,
}: {
  on: boolean;
  title: string;
  body: string;
  onPress: () => void;
}) {
  return (
    <View style={styles.permRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.permTitle}>{title}</Text>
        <Text style={styles.permBody}>{body}</Text>
      </View>
      {!on && (
        <Pressable style={styles.permBtn} onPress={onPress}>
          <Text style={styles.permBtnText}>Turn on</Text>
        </Pressable>
      )}
    </View>
  );
}

function AppRow({ entry, onToggle }: { entry: AppEntry; onToggle: () => void }) {
  const graceLeft = entry.inGrace ? Math.max(0, Math.ceil((entry.lockActiveAt - Date.now()) / 1000)) : 0;

  const status = !entry.locked
    ? entry.packageName
    : entry.inGrace
      ? `LOCKS IN ${graceLeft}s · TAP TO UNDO`
      : 'LOCKED · TYPING TEST TO REMOVE';

  return (
    <Pressable style={styles.appRow} onPress={onToggle}>
      {entry.icon ? (
        <Image source={{ uri: entry.icon }} style={styles.appIcon} />
      ) : (
        <View style={styles.appIcon} />
      )}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.appLabel} numberOfLines={1}>
          {entry.label}
        </Text>
        <Text style={[styles.appPkg, entry.locked && { color: colors.ochreDeep }]} numberOfLines={1}>
          {status}
        </Text>
      </View>
      <View style={[styles.checkbox, entry.locked && styles.checkboxOn]}>
        {entry.locked && <Text style={styles.checkmark}>{'✓'}</Text>}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pad: { padding: 20, gap: 10 },
  header: {
    paddingTop: 14,
    paddingHorizontal: 15,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: inkAlpha(0.12),
  },
  title: { fontFamily: fonts.bodyExtra, fontSize: 17, color: colors.ink },
  subtitle: { fontFamily: fonts.mono, fontSize: 9.5, letterSpacing: 1.4, color: inkAlpha(0.52), marginTop: 6 },
  body: { fontFamily: fonts.body, fontSize: 13, lineHeight: 20, color: inkAlpha(0.65) },
  mono: { fontFamily: fonts.mono, fontSize: 12, color: colors.ink },
  content: { padding: 13, gap: 8 },
  permRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    padding: 12,
    borderRadius: radii.md,
    backgroundColor: colors.glassNudge,
    borderWidth: 1,
    borderColor: inkAlpha(0.12),
  },
  permTitle: { fontFamily: fonts.bodyExtra, fontSize: 12.5, color: colors.ink },
  permBody: { fontFamily: fonts.body, fontSize: 12, lineHeight: 17, color: inkAlpha(0.68), marginTop: 4 },
  permBtn: { paddingVertical: 9, paddingHorizontal: 13, borderRadius: 999, backgroundColor: colors.ochre },
  permBtnText: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.ink },
  sectionLabel: {
    fontFamily: fonts.mono,
    fontSize: 9.5,
    letterSpacing: 1.6,
    color: inkAlpha(0.45),
    paddingHorizontal: 3,
    paddingTop: 8,
  },
  appRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    padding: 11,
    paddingHorizontal: 12,
    borderRadius: radii.md,
    backgroundColor: colors.glassCard,
    borderWidth: 1,
    borderColor: inkAlpha(0.13),
  },
  appIcon: { width: 34, height: 34, borderRadius: 9, backgroundColor: 'rgba(246,239,216,.8)' },
  appLabel: { fontFamily: fonts.bodyBold, fontSize: 13.5, color: colors.ink },
  appPkg: { fontFamily: fonts.mono, fontSize: 9.5, color: inkAlpha(0.52), marginTop: 3 },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: inkAlpha(0.25),
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: { backgroundColor: colors.ochre, borderColor: inkAlpha(0.3) },
  checkmark: { fontFamily: fonts.bodyExtra, fontSize: 14, color: colors.ink },
});
