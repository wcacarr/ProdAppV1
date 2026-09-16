import React, { useCallback, useEffect, useState } from 'react';
import { AppState, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import GlassPane from '../components/GlassPane';
import { colors, fonts, inkAlpha, radii } from '../theme';
import {
  InstalledApp,
  getBlockedPackages,
  getInstalledApps,
  getUnlockUntil,
  grantUnlock,
  isAccessibilityServiceEnabled,
  isBlockingSupported,
  openAccessibilitySettings,
  setBlockedPackages,
} from '../../modules/questlock-blocker';

export default function LockSetupScreen() {
  const [enabled, setEnabled] = useState(false);
  const [apps, setApps] = useState<InstalledApp[]>([]);
  const [blocked, setBlocked] = useState<string[]>([]);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => {
    setEnabled(isAccessibilityServiceEnabled());
    setBlocked(getBlockedPackages());
  }, []);

  useEffect(() => {
    setApps(getInstalledApps());
    refresh();
    // Permission is granted in system Settings, so re-check on return.
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const toggle = (packageName: string) => {
    const next = blocked.includes(packageName)
      ? blocked.filter((p) => p !== packageName)
      : [...blocked, packageName];
    setBlockedPackages(next);
    setBlocked(next);
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
    <GlassPane
      radius={radii.xl}
      intensity={35}
      style={{ flex: 1, minHeight: 0 }}
      contentStyle={{ flex: 1, minHeight: 0 }}
    >
      <View style={styles.header}>
        <Text style={styles.title}>App locking</Text>
        <Text style={styles.subtitle}>SPIKE · VERIFY BLOCKING WORKS</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.permRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.permTitle}>{enabled ? 'Enforcement is on' : 'Enforcement is off'}</Text>
            <Text style={styles.permBody}>
              {enabled
                ? 'Opening a locked app should bounce you home.'
                : 'Questlock needs accessibility access to notice which app opened.'}
            </Text>
          </View>
          {!enabled && (
            <Pressable style={styles.permBtn} onPress={openAccessibilitySettings}>
              <Text style={styles.permBtnText}>Turn on</Text>
            </Pressable>
          )}
        </View>

        <Text style={styles.sectionLabel}>PICK APPS TO LOCK</Text>
        {apps.map((app) => {
          const on = blocked.includes(app.packageName);
          const until = on ? getUnlockUntil(app.packageName) : 0;
          const secsLeft = Math.max(0, Math.round((until - Date.now()) / 1000));
          return (
            <View key={app.packageName} style={styles.appRow}>
              <Pressable style={{ flex: 1 }} onPress={() => toggle(app.packageName)}>
                <Text style={styles.appLabel} numberOfLines={1}>
                  {app.label}
                </Text>
                <Text style={styles.appPkg} numberOfLines={1}>
                  {secsLeft > 0 ? `UNLOCKED · ${secsLeft}s LEFT` : app.packageName}
                </Text>
              </Pressable>
              {on && (
                <Pressable
                  style={styles.unlockBtn}
                  onPress={() => {
                    grantUnlock(app.packageName, 1);
                    setTick((n) => n + 1);
                  }}
                >
                  <Text style={styles.unlockBtnText}>+1 min</Text>
                </Pressable>
              )}
              <Pressable
                style={[styles.checkbox, on && styles.checkboxOn]}
                onPress={() => toggle(app.packageName)}
              >
                {on && <Text style={styles.checkmark}>{'✓'}</Text>}
              </Pressable>
            </View>
          );
        })}
        {apps.length === 0 && <Text style={styles.body}>No launchable apps found.</Text>}
      </ScrollView>
    </GlassPane>
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
    gap: 10,
    padding: 11,
    paddingHorizontal: 12,
    borderRadius: radii.md,
    backgroundColor: colors.glassCard,
    borderWidth: 1,
    borderColor: inkAlpha(0.13),
  },
  appLabel: { fontFamily: fonts.bodyBold, fontSize: 13.5, color: colors.ink },
  appPkg: { fontFamily: fonts.mono, fontSize: 9.5, color: inkAlpha(0.52), marginTop: 3 },
  unlockBtn: {
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: inkAlpha(0.2),
  },
  unlockBtnText: { fontFamily: fonts.bodyBold, fontSize: 11, color: inkAlpha(0.7) },
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
