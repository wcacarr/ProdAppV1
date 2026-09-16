import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import GlassPane from '../components/GlassPane';
import { colors, fonts, inkAlpha, radii } from '../theme';
import { useQuestStore } from '../state/store';
import { FREE_APPS, TILE_BG } from '../state/data';
import { FreeApp, LockedApp } from '../state/types';

export default function AppsScreen() {
  const apps = useQuestStore((s) => s.apps);
  const openBlock = useQuestStore((s) => s.openBlock);
  const flash = useQuestStore((s) => s.flash);

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
          <Text style={styles.searchText}>Search apps</Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionLabel}>LOCKED · EARN TO ENTER</Text>
        <View style={styles.grid}>
          {apps.map((a) => (
            <LockedTile
              key={a.id}
              app={a}
              onPress={() =>
                a.until
                  ? flash(`${a.name} open · ${a.until >= 600 ? 'rest of the day' : a.until + ' min left'}`)
                  : openBlock(a.id)
              }
            />
          ))}
        </View>

        <Text style={[styles.sectionLabel, { paddingTop: 20 }]}>ALWAYS OPEN</Text>
        <View style={styles.grid}>
          {FREE_APPS.map((a) => (
            <FreeTile key={a.name} app={a} onPress={() => flash(`${a.name} is always open.`)} />
          ))}
        </View>
      </ScrollView>
    </GlassPane>
  );
}

function LockedTile({ app, onPress }: { app: LockedApp; onPress: () => void }) {
  const unlocked = app.until > 0;
  const badge = unlocked ? (app.until >= 600 ? 'day' : `${app.until}m`) : '✕';
  return (
    <Pressable style={styles.tileWrap} onPress={onPress}>
      <View
        style={[
          styles.tile,
          {
            backgroundColor: unlocked ? TILE_BG[app.id] ?? colors.paperCard : inkAlpha(0.07),
            opacity: unlocked ? 1 : 0.55,
          },
        ]}
      >
        <Text style={[styles.tileInitial, { color: unlocked ? colors.ink : inkAlpha(0.5) }]}>{app.initial}</Text>
        <View
          style={[
            styles.badge,
            { backgroundColor: unlocked ? colors.ochre : 'rgba(253,248,232,.9)' },
          ]}
        >
          <Text style={[styles.badgeText, { color: unlocked ? colors.ink : inkAlpha(0.55) }]}>{badge}</Text>
        </View>
      </View>
      <Text style={[styles.tileName, { color: unlocked ? colors.ink : inkAlpha(0.5) }]}>{app.name}</Text>
    </Pressable>
  );
}

function FreeTile({ app, onPress }: { app: FreeApp; onPress: () => void }) {
  return (
    <Pressable style={styles.tileWrap} onPress={onPress}>
      <View style={[styles.tile, { backgroundColor: 'rgba(246,239,216,.75)' }]}>
        <Text style={styles.tileInitial}>{app.initial}</Text>
      </View>
      <Text style={styles.tileName}>{app.name}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  searchWrap: { padding: 12, paddingHorizontal: 13, paddingBottom: 10 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingVertical: 9,
    paddingHorizontal: 13,
    borderRadius: 12,
    backgroundColor: 'rgba(246,239,216,.66)',
    borderWidth: 1,
    borderColor: inkAlpha(0.14),
  },
  searchDot: { width: 12, height: 12, borderRadius: 6, borderWidth: 1.5, borderColor: inkAlpha(0.45) },
  searchText: { fontFamily: fonts.bodyMedium, fontSize: 12.5, color: inkAlpha(0.5) },
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
  },
  tileInitial: { fontFamily: fonts.bodyExtra, fontSize: 18, color: colors.ink },
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
});
