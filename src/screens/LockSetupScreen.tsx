import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AppState,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
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
  openAppInfo,
  openNotificationAccessSettings,
  unlockApp,
} from '../../modules/questlock-blocker';

export default function LockSetupScreen() {
  const flash = useQuestStore((s) => s.flash);
  const { entries, loading, refreshLocks } = useAppRegistry();
  const [enforcementOn, setEnforcementOn] = useState(false);
  const [mediaOn, setMediaOn] = useState(false);
  const [challenge, setChallenge] = useState<AppEntry | null>(null);
  const [query, setQuery] = useState('');

  // Locked apps stay pinned to the top: they are the ones you came to change,
  // and on a phone with a hundred apps they would otherwise be lost in the As.
  const shown = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const matches = needle
      ? entries.filter(
          (e) =>
            e.label.toLowerCase().includes(needle) ||
            e.packageName.toLowerCase().includes(needle)
        )
      : entries;
    return [...matches].sort((a, b) => Number(b.locked) - Number(a.locked));
  }, [entries, query]);

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
                : "Tap Turn on, then find Tasuku in the list and switch it on. On Samsung it's under Installed apps. Come back here and this ticks itself."
            }
            onPress={openAccessibilitySettings}
            escapeLabel="Greyed out in settings?"
            escapeHint={
              "Android greys this out for apps installed outside the Play Store. Open App info → ⋮ (top right) → Allow restricted settings, then try again."
            }
            onEscape={openAppInfo}
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
          <View style={styles.searchWrap}>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search your apps"
              placeholderTextColor={inkAlpha(0.4)}
              autoCorrect={false}
              autoCapitalize="none"
              style={styles.search}
            />
            {query.length > 0 && (
              <Pressable style={styles.searchClear} onPress={() => setQuery('')} hitSlop={8}>
                <Text style={styles.searchClearText}>{'✕'}</Text>
              </Pressable>
            )}
          </View>

          {loading && <Text style={styles.body}>Loading your apps…</Text>}
          {!loading && shown.length === 0 && (
            <Text style={styles.body}>Nothing matches "{query.trim()}".</Text>
          )}
          {shown.map((entry) => (
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
  escapeLabel,
  escapeHint,
  onEscape,
}: {
  on: boolean;
  title: string;
  body: string;
  onPress: () => void;
  /** Secondary route for when Android won't let the main one through. */
  escapeLabel?: string;
  escapeHint?: string;
  onEscape?: () => void;
}) {
  const [showHint, setShowHint] = useState(false);

  return (
    <View style={styles.permRow}>
      <View style={styles.permRowTop}>
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

      {!on && onEscape && (
        <Pressable style={styles.escape} onPress={() => setShowHint((v) => !v)}>
          <Text style={styles.escapeText}>{escapeLabel}</Text>
        </Pressable>
      )}
      {!on && onEscape && showHint && (
        <View style={styles.escapePanel}>
          <Text style={styles.escapeHint}>{escapeHint}</Text>
          <Pressable style={styles.escapeBtn} onPress={onEscape}>
            <Text style={styles.escapeBtnText}>Open App info</Text>
          </Pressable>
        </View>
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
    padding: 12,
    borderRadius: radii.md,
    backgroundColor: colors.glassNudge,
    borderWidth: 1,
    borderColor: inkAlpha(0.12),
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
    backgroundColor: 'rgba(255,252,242,.7)',
    borderWidth: 1,
    borderColor: inkAlpha(0.12),
  },
  escapeHint: { fontFamily: fonts.body, fontSize: 11.5, lineHeight: 17, color: inkAlpha(0.68) },
  escapeBtn: {
    marginTop: 10,
    paddingVertical: 9,
    borderRadius: 999,
    alignItems: 'center',
    backgroundColor: 'rgba(255,252,242,.9)',
    borderWidth: 1,
    borderColor: inkAlpha(0.18),
  },
  escapeBtnText: { fontFamily: fonts.bodyBold, fontSize: 11.5, color: colors.ink },
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
  searchWrap: { justifyContent: 'center' },
  search: {
    paddingVertical: 11,
    paddingLeft: 13,
    paddingRight: 36,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: inkAlpha(0.16),
    backgroundColor: 'rgba(255,252,242,.85)',
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    color: colors.ink,
  },
  searchClear: { position: 'absolute', right: 12 },
  searchClearText: { fontFamily: fonts.bodyBold, fontSize: 13, color: inkAlpha(0.45) },

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
