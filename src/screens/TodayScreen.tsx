import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import GlassPane from '../components/GlassPane';
import PressableScale from '../components/PressableScale';
import { colors, fonts, inkAlpha, radii, xpFor } from '../theme';
import { useQuestStore } from '../state/store';
import { fastestRemaining, questMeta } from '../state/selectors';
import { rankFor } from '../state/ranks';
import { useAppRegistry } from '../state/useAppRegistry';
import { Quest } from '../state/types';

export default function TodayScreen() {
  const quests = useQuestStore((s) => s.quests);
  const balance = useQuestStore((s) => s.balance);
  const lifetime = useQuestStore((s) => s.lifetime);
  const dayStreak = useQuestStore((s) => s.dayStreak);
  const startQuest = useQuestStore((s) => s.startQuest);
  const openSheet = useQuestStore((s) => s.openSheet);
  const flash = useQuestStore((s) => s.flash);

  const rank = rankFor(lifetime);
  const { lockedApps } = useAppRegistry();
  const lockedLabel = lockedApps[0]?.label ?? null;
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
            <Text style={styles.rankTier}>RANK {rank.tier}</Text>
            <Text style={styles.rankName}>{rank.name}</Text>
            <Text style={styles.nextLevel}>
              {rank.nextName ? `${rank.xpToNext} XP TO ${rank.nextName.toUpperCase()}` : 'TOP RANK'}
            </Text>
          </View>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${rank.pct}%` }]} />
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

          <PressableScale style={styles.addQuest} onPress={openSheet}>
            <Text style={styles.addQuestText}>+ Add a quest</Text>
          </PressableScale>

          <View style={styles.nudge}>
            <Text style={styles.nudgeTitle}>
              {remaining.length ? `${fastest?.mins ?? 0} minutes is enough` : 'Day cleared'}
            </Text>
            <Text style={styles.nudgeBody}>
              {remaining.length
                ? `"${fastest?.name}" pays +${xpFor(fastest?.mins ?? 0)} XP${
                    lockedLabel ? ` — a decent chunk of ${lockedLabel}` : ''
                  }. Start there if the big block feels heavy.`
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
      <PressableScale
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
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  summaryPad: { paddingTop: 11, paddingHorizontal: 13, paddingBottom: 10 },
  summaryRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  dayLabel: { fontFamily: fonts.mono, fontSize: 9.5, letterSpacing: 2, color: inkAlpha(0.55) },
  balance: { fontFamily: fonts.bodyExtra, fontSize: 27, color: colors.ink, marginTop: 5, letterSpacing: -0.5 },
  rankTier: { fontFamily: fonts.mono, fontSize: 8.5, letterSpacing: 1.4, color: inkAlpha(0.45) },
  rankName: { fontFamily: fonts.bodyExtra, fontSize: 13, color: colors.ochreDeep, marginTop: 3 },
  nextLevel: { fontFamily: fonts.mono, fontSize: 9.5, color: inkAlpha(0.5), marginTop: 5 },
  progressTrack: { height: 4, borderRadius: 999, backgroundColor: inkAlpha(0.12), overflow: 'hidden', marginTop: 9 },
  progressFill: { height: '100%', borderRadius: 999, backgroundColor: colors.ochre },

  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 13,
    paddingTop: 10,
    paddingBottom: 9,
    borderBottomWidth: 1,
    borderBottomColor: inkAlpha(0.12),
  },
  listTitle: { fontFamily: fonts.bodyExtra, fontSize: 14, color: colors.ink },
  listCount: { fontFamily: fonts.mono, fontSize: 10, color: inkAlpha(0.52) },
  listContent: { padding: 11, paddingTop: 10, gap: 7 },

  questRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 9,
    paddingHorizontal: 11,
    borderRadius: radii.md,
    backgroundColor: colors.glassCard,
    borderWidth: 1,
    borderColor: inkAlpha(0.13),
  },
  chip: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: inkAlpha(0.18),
  },
  chipGlyph: { fontFamily: fonts.mono, fontSize: 12, color: colors.ink },
  questName: { fontFamily: fonts.bodyBold, fontSize: 13 },
  questMeta: { fontFamily: fonts.mono, fontSize: 10, color: inkAlpha(0.52), marginTop: 3 },
  questBtn: { paddingVertical: 7, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1 },
  questBtnText: { fontFamily: fonts.bodyBold, fontSize: 11.5 },

  addQuest: {
    padding: 10,
    borderRadius: radii.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: inkAlpha(0.28),
    alignItems: 'center',
  },
  addQuestText: { fontFamily: fonts.bodyBold, fontSize: 12, color: inkAlpha(0.6) },

  nudge: {
    marginTop: 4,
    padding: 10,
    paddingHorizontal: 12,
    borderRadius: radii.md,
    backgroundColor: colors.glassNudge,
    borderWidth: 1,
    borderColor: inkAlpha(0.12),
  },
  nudgeTitle: { fontFamily: fonts.bodyExtra, fontSize: 12, color: colors.ink, marginBottom: 6 },
  nudgeBody: { fontFamily: fonts.body, fontSize: 11.5, lineHeight: 17, color: inkAlpha(0.68) },
});
