import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import GlassPane from '../components/GlassPane';
import PressableScale from '../components/PressableScale';
import { colors, fonts, inkAlpha, radii } from '../theme';
import { useQuestStore } from '../state/store';
import { rankFor } from '../state/ranks';

export default function SettingsScreen() {
  const musicEnabled = useQuestStore((s) => s.musicEnabled);
  const setMusicEnabled = useQuestStore((s) => s.setMusicEnabled);
  const lifetime = useQuestStore((s) => s.lifetime);
  const quests = useQuestStore((s) => s.quests);
  const rank = rankFor(lifetime);

  return (
    <GlassPane
      radius={radii.xl}
      intensity={35}
      tint={colors.glassPaperList}
      style={{ flex: 1, minHeight: 0 }}
      contentStyle={{ flex: 1, minHeight: 0 }}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>TASUKU</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionLabel}>SOUND</Text>
        <Toggle
          on={musicEnabled}
          title="Ambient music"
          body="Plays quietly while the app is open. Stops on its own whenever something else is playing."
          onToggle={() => setMusicEnabled(!musicEnabled)}
        />

        <Text style={styles.sectionLabel}>YOUR PROGRESS</Text>
        <View style={styles.statRow}>
          <Stat label="RANK" value={rank.name} />
          <Stat label="LIFETIME XP" value={`${lifetime}`} />
          <Stat label="QUESTS" value={`${quests.length}`} />
        </View>

        <Text style={styles.sectionLabel}>DATA</Text>
        <View style={styles.note}>
          <Text style={styles.noteTitle}>Everything is on this phone</Text>
          <Text style={styles.noteBody}>
            No account, no server. Progress and photo proof never leave the device, and nothing is
            backed up — uninstalling deletes all of it.
          </Text>
        </View>
      </ScrollView>
    </GlassPane>
  );
}

function Toggle({
  on,
  title,
  body,
  onToggle,
}: {
  on: boolean;
  title: string;
  body: string;
  onToggle: () => void;
}) {
  return (
    <PressableScale style={styles.row} onPress={onToggle} scaleTo={0.985}>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowBody}>{body}</Text>
      </View>
      <View style={[styles.switch, on && styles.switchOn]}>
        <View style={[styles.knob, on && styles.knobOn]} />
      </View>
    </PressableScale>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingTop: 12,
    paddingHorizontal: 13,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: inkAlpha(0.12),
  },
  title: { fontFamily: fonts.bodyExtra, fontSize: 16, color: colors.ink },
  subtitle: { fontFamily: fonts.brand, fontSize: 12, letterSpacing: 3, color: inkAlpha(0.45) },
  content: { padding: 13, paddingBottom: 18 },
  sectionLabel: {
    fontFamily: fonts.mono,
    fontSize: 9.5,
    letterSpacing: 1.6,
    color: inkAlpha(0.45),
    paddingHorizontal: 3,
    paddingTop: 12,
    paddingBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: radii.md,
    backgroundColor: colors.glassCard,
    borderWidth: 1,
    borderColor: inkAlpha(0.13),
  },
  rowTitle: { fontFamily: fonts.bodyBold, fontSize: 13.5, color: colors.ink },
  rowBody: { fontFamily: fonts.body, fontSize: 11.5, lineHeight: 17, color: inkAlpha(0.6), marginTop: 3 },
  switch: {
    width: 44,
    height: 26,
    borderRadius: 999,
    backgroundColor: inkAlpha(0.14),
    borderWidth: 1,
    borderColor: inkAlpha(0.18),
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  switchOn: { backgroundColor: colors.ochre },
  knob: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.paperLight,
    borderWidth: 1,
    borderColor: inkAlpha(0.18),
  },
  knobOn: { alignSelf: 'flex-end' },

  statRow: { flexDirection: 'row', gap: 8 },
  stat: {
    flex: 1,
    padding: 11,
    borderRadius: radii.md,
    backgroundColor: colors.glassCard,
    borderWidth: 1,
    borderColor: inkAlpha(0.13),
    alignItems: 'center',
  },
  statValue: { fontFamily: fonts.bodyExtra, fontSize: 15, color: colors.ochreDeep },
  statLabel: { fontFamily: fonts.mono, fontSize: 8.5, letterSpacing: 1, color: inkAlpha(0.5), marginTop: 5 },

  note: {
    padding: 12,
    borderRadius: radii.md,
    backgroundColor: colors.glassNudge,
    borderWidth: 1,
    borderColor: inkAlpha(0.12),
  },
  noteTitle: { fontFamily: fonts.bodyExtra, fontSize: 12.5, color: colors.ink },
  noteBody: { fontFamily: fonts.body, fontSize: 11.5, lineHeight: 17, color: inkAlpha(0.65), marginTop: 5 },
});
