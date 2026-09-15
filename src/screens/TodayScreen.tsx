import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import GlassPane from '../components/GlassPane';
import { colors, fonts, inkAlpha, radii, xpFor } from '../theme';
import { useQuestStore } from '../state/store';
import { fastestRemaining, levelInfo, questMeta } from '../state/selectors';
import { Quest } from '../state/types';

export default function TodayScreen() {
  const quests = useQuestStore((s) => s.quests);
  const balance = useQuestStore((s) => s.balance);
  const lifetime = useQuestStore((s) => s.lifetime);
  const dayStreak = useQuestStore((s) => s.dayStreak);
  const startQuest = useQuestStore((s) => s.startQuest);
  const openSheet = useQuestStore((s) => s.openSheet);
  const flash = useQuestStore((s) => s.flash);

  const { level, nextLevelXp, pct } = levelInfo(lifetime);
  const remaining = quests.filter((q) => !q.done);
  const fastest = fastestRemaining(quests);
  const doneCount = quests.filter((q) => q.done).length;

  return (
    <>
      <GlassPane
        radius={radii.xl}
        intensity={35}
        tint={colors.glassPaperToday}
        contentStyle={styles.summaryPad}
      >
        <View style={styles.summaryRow}>
          <View>
            <Text style={styles.dayLabel}>TUESDAY · DAY {dayStreak}</Text>
            <Text style={styles.balance}>{balance} XP</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.level}>Level {level}</Text>
            <Text style={styles.nextLevel}>{nextLevelXp} XP TO LVL {level + 1}</Text>
          </View>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${pct}%` }]} />
        </View>
      </GlassPane>

      <GlassPane
        radius={radii.xl}
        intensity={35}
        tint={colors.glassPaperList}
        style={{ flex: 1, minHeight: 0 }}
        contentStyle={{ flex: 1, minHeight: 0 }}
      >
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Today's quests</Text>
          <Text style={styles.listCount}>
            {doneCount}/{quests.length} DONE
          </Text>
        </View>
        <ScrollView contentContainerStyle={styles.listContent}>
          {quests.map((q) => (
            <QuestRow key={q.id} quest={q} onStart={() => startQuest(q.id)} onClaimed={() => flash('Already claimed today.')} />
          ))}

          <Pressable style={styles.addQuest} onPress={openSheet}>
            <Text style={styles.addQuestText}>+ Add a quest</Text>
          </Pressable>

          <View style={styles.nudge}>
            <Text style={styles.nudgeTitle}>
              {remaining.length ? `${fastest?.mins ?? 0} minutes is enough` : 'Day cleared'}
            </Text>
            <Text style={styles.nudgeBody}>
              {remaining.length
                ? `"${fastest?.name}" pays +${xpFor(fastest?.mins ?? 0)} XP — over half an hour of Tubely. Start there if the big block feels heavy.`
                : "Everything on today's list is claimed. Spend what you earned, or add one more if you are on a roll."}
            </Text>
          </View>
        </ScrollView>
      </GlassPane>
    </>
  );
}

function QuestRow({ quest, onStart, onClaimed }: { quest: Quest; onStart: () => void; onClaimed: () => void }) {
  const done = quest.done;
  return (
    <View style={styles.questRow}>
      <View style={[styles.chip, { backgroundColor: done ? inkAlpha(0.06) : 'rgba(246,239,216,.8)' }]}>
        <Text style={styles.chipGlyph}>{quest.glyph}</Text>
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          style={[
            styles.questName,
            { color: done ? inkAlpha(0.42) : colors.ink, textDecorationLine: done ? 'line-through' : 'none' },
          ]}
        >
          {quest.name}
        </Text>
        <Text style={styles.questMeta}>{questMeta(quest)}</Text>
      </View>
      <Pressable
        onPress={done ? onClaimed : onStart}
        style={[
          styles.questBtn,
          {
            backgroundColor: done ? 'transparent' : colors.ochre,
            borderColor: done ? inkAlpha(0.16) : inkAlpha(0.25),
          },
        ]}
      >
        <Text style={[styles.questBtnText, { color: done ? inkAlpha(0.42) : colors.ink }]}>
          {done ? 'Claimed' : 'Start'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  summaryPad: { paddingTop: 13, paddingHorizontal: 15, paddingBottom: 12 },
  summaryRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  dayLabel: { fontFamily: fonts.mono, fontSize: 9.5, letterSpacing: 2, color: inkAlpha(0.55) },
  balance: { fontFamily: fonts.bodyExtra, fontSize: 33, color: colors.ink, marginTop: 7, letterSpacing: -0.6 },
  level: { fontFamily: fonts.bodyBold, fontSize: 11.5, color: inkAlpha(0.72) },
  nextLevel: { fontFamily: fonts.mono, fontSize: 9.5, color: inkAlpha(0.5), marginTop: 6 },
  progressTrack: { height: 5, borderRadius: 999, backgroundColor: inkAlpha(0.12), overflow: 'hidden', marginTop: 11 },
  progressFill: { height: '100%', borderRadius: 999, backgroundColor: colors.ochre },

  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: inkAlpha(0.12),
  },
  listTitle: { fontFamily: fonts.bodyExtra, fontSize: 15, color: colors.ink },
  listCount: { fontFamily: fonts.mono, fontSize: 10, color: inkAlpha(0.52) },
  listContent: { padding: 13, paddingTop: 11, gap: 8 },

  questRow: {
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
  chip: {
    width: 31,
    height: 31,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: inkAlpha(0.18),
  },
  chipGlyph: { fontFamily: fonts.mono, fontSize: 12, color: colors.ink },
  questName: { fontFamily: fonts.bodyBold, fontSize: 13.5 },
  questMeta: { fontFamily: fonts.mono, fontSize: 10, color: inkAlpha(0.52), marginTop: 3 },
  questBtn: { paddingVertical: 8, paddingHorizontal: 13, borderRadius: 999, borderWidth: 1 },
  questBtnText: { fontFamily: fonts.bodyBold, fontSize: 12 },

  addQuest: {
    padding: 11,
    borderRadius: radii.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: inkAlpha(0.28),
    alignItems: 'center',
  },
  addQuestText: { fontFamily: fonts.bodyBold, fontSize: 12.5, color: inkAlpha(0.6) },

  nudge: {
    marginTop: 6,
    padding: 12,
    paddingHorizontal: 13,
    borderRadius: radii.md,
    backgroundColor: colors.glassNudge,
    borderWidth: 1,
    borderColor: inkAlpha(0.12),
  },
  nudgeTitle: { fontFamily: fonts.bodyExtra, fontSize: 12.5, color: colors.ink, marginBottom: 6 },
  nudgeBody: { fontFamily: fonts.body, fontSize: 12, lineHeight: 18, color: inkAlpha(0.68) },
});
