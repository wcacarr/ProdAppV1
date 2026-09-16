import React, { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import GlassPane from '../components/GlassPane';
import { colors, fonts, inkAlpha, radii } from '../theme';
import { useQuestStore } from '../state/store';
import { AppEntry, useAppRegistry } from '../state/useAppRegistry';
import { launchApp } from '../../modules/questlock-blocker';
import { isBlockingSupported } from '../../modules/questlock-blocker';

export default function AppsScreen() {
  const openBlock = useQuestStore((s) => s.openBlock);
  const flash = useQuestStore((s) => s.flash);
  const { lockedApps, openApps, isOpenNow, loading } = useAppRegistry();
  const [query, setQuery] = useState('');

  const match = (e: AppEntry) => e.label.toLowerCase().includes(query.trim().toLowerCase());
  const locked = useMemo(() => lockedApps.filter(match), [lockedApps, query]);
  const open = useMemo(() => openApps.filter(match), [openApps, query]);

  const onPress = (entry: AppEntry) => {
    if (isOpenNow(entry)) {
      launchApp(entry.packageName);
      return;
    }
    openBlock(entry.packageName);
  };

  return (
    <GlassPane
      radius={radii.xl}
      intensity={38}
      tint={colors.glassPaperApps}
      style={{ flex: 1, minHeight: 0 }}
      contentStyle={{ flex: 1, minHeight: 0 }}
    >
      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <View style={styles.searchDot} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search apps"
            placeholderTextColor={inkAlpha(0.45)}
            style={styles.searchInput}
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {!isBlockingSupported && (
          <Text style={styles.empty}>App list needs a dev build — run npx expo run:android.</Text>
        )}
        {isBlockingSupported && loading && <Text style={styles.empty}>Loading your apps…</Text>}

        {locked.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>LOCKED · EARN TO ENTER</Text>
            <View style={styles.grid}>
              {locked.map((entry) => (
                <AppTile key={entry.packageName} entry={entry} openNow={isOpenNow(entry)} onPress={() => onPress(entry)} />
              ))}
            </View>
          </>
        )}

        {open.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, locked.length > 0 && { paddingTop: 20 }]}>ALWAYS OPEN</Text>
            <View style={styles.grid}>
              {open.map((entry) => (
                <AppTile key={entry.packageName} entry={entry} openNow onPress={() => onPress(entry)} />
              ))}
            </View>
          </>
        )}

        {isBlockingSupported && !loading && locked.length === 0 && open.length === 0 && (
          <Text style={styles.empty} onPress={() => flash('Nothing matched that search.')}>
            No apps matched.
          </Text>
        )}
      </ScrollView>
    </GlassPane>
  );
}

function AppTile({
  entry,
  openNow,
  onPress,
}: {
  entry: AppEntry;
  openNow: boolean;
  onPress: () => void;
}) {
  const minsLeft = entry.unlockedUntil
    ? Math.max(0, Math.ceil((entry.unlockedUntil - Date.now()) / 60000))
    : 0;
  const badge = entry.locked
    ? minsLeft > 0
      ? minsLeft >= 600
        ? 'day'
        : `${minsLeft}m`
      : '✕'
    : null;

  return (
    <Pressable style={styles.tileWrap} onPress={onPress}>
      <View style={[styles.tile, !openNow && styles.tileLocked]}>
        {entry.icon ? (
          <Image source={{ uri: entry.icon }} style={styles.icon} />
        ) : (
          <Text style={styles.fallbackInitial}>{entry.label.slice(0, 1).toUpperCase()}</Text>
        )}
        {badge && (
          <View style={[styles.badge, { backgroundColor: minsLeft > 0 ? colors.ochre : 'rgba(253,248,232,.92)' }]}>
            <Text style={[styles.badgeText, { color: minsLeft > 0 ? colors.ink : inkAlpha(0.55) }]}>{badge}</Text>
          </View>
        )}
      </View>
      <Text style={[styles.tileName, !openNow && { color: inkAlpha(0.5) }]} numberOfLines={1}>
        {entry.label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  searchWrap: { padding: 12, paddingHorizontal: 13, paddingBottom: 10 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingVertical: 4,
    paddingHorizontal: 13,
    borderRadius: 12,
    backgroundColor: 'rgba(246,239,216,.66)',
    borderWidth: 1,
    borderColor: inkAlpha(0.14),
  },
  searchDot: { width: 12, height: 12, borderRadius: 6, borderWidth: 1.5, borderColor: inkAlpha(0.45) },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
    fontFamily: fonts.bodyMedium,
    fontSize: 12.5,
    color: colors.ink,
  },
  content: { paddingHorizontal: 13, paddingTop: 2, paddingBottom: 14 },
  sectionLabel: {
    fontFamily: fonts.mono,
    fontSize: 9.5,
    letterSpacing: 1.6,
    color: inkAlpha(0.45),
    paddingVertical: 6,
    paddingHorizontal: 3,
    paddingBottom: 10,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 13 },
  tileWrap: { width: '25%', alignItems: 'center', gap: 6 },
  tile: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: inkAlpha(0.16),
    backgroundColor: 'rgba(246,239,216,.75)',
    overflow: 'visible',
  },
  tileLocked: { opacity: 0.45 },
  icon: { width: 42, height: 42, borderRadius: 10 },
  fallbackInitial: { fontFamily: fonts.bodyExtra, fontSize: 18, color: colors.ink },
  badge: {
    position: 'absolute',
    right: -3,
    bottom: -3,
    minWidth: 15,
    height: 15,
    paddingHorizontal: 4,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: inkAlpha(0.18),
  },
  badgeText: { fontFamily: fonts.mono, fontSize: 8.5 },
  tileName: { fontFamily: fonts.bodySemi, fontSize: 10.5, textAlign: 'center', color: colors.ink },
  empty: {
    fontFamily: fonts.body,
    fontSize: 12.5,
    lineHeight: 18,
    color: inkAlpha(0.55),
    textAlign: 'center',
    paddingVertical: 24,
  },
});
