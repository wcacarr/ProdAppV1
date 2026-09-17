import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import GlassPane from '../components/GlassPane';
import PressableScale from '../components/PressableScale';
import SwipeToDelete from '../components/SwipeToDelete';
import DraggableList from '../components/DraggableList';
import TimeSlotSheet from '../components/TimeSlotSheet';
import { colors, fonts, inkAlpha, radii, xpFor } from '../theme';
import { useQuestStore } from '../state/store';
import { fastestRemaining, questReward } from '../state/selectors';
import { rankFor } from '../state/ranks';
import { useAppRegistry } from '../state/useAppRegistry';
import { Quest } from '../state/types';
import { bookedMinutes, formatSlot, formatSlotShort, overlaps, sortedByStart } from '../state/schedule';

// Rows have to be a uniform height for the drag maths to work.
const ROW_CONTENT_H = 56;
const ROW_GAP = 7;
const ROW_H = ROW_CONTENT_H + ROW_GAP;

export default function TodayScreen() {
  const quests = useQuestStore((s) => s.quests);
  const balance = useQuestStore((s) => s.balance);
  const lifetime = useQuestStore((s) => s.lifetime);
  const dayStreak = useQuestStore((s) => s.dayStreak);
  const startQuest = useQuestStore((s) => s.startQuest);
  const openSheet = useQuestStore((s) => s.openSheet);
  const deleteQuest = useQuestStore((s) => s.deleteQuest);
  const reorderQuests = useQuestStore((s) => s.reorderQuests);
  const editingTimeId = useQuestStore((s) => s.editingTimeId);
  const openTimeEditor = useQuestStore((s) => s.openTimeEditor);
  const closeTimeEditor = useQuestStore((s) => s.closeTimeEditor);
  const setQuestStart = useQuestStore((s) => s.setQuestStart);
  const flash = useQuestStore((s) => s.flash);

  // Easter egg: tap the XP box and the whole thing rolls over.
  const spin = useSharedValue(0);
  // A flip rather than a Z-spin: a pane this wide sweeps off-screen when it
  // rotates in-plane, and gets clipped at the top of the phone.
  const spinStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 900 },
      { rotateY: `${spin.value}deg` },
      { scale: 1 - 0.06 * Math.sin((spin.value / 360) * Math.PI) },
    ],
  }));
  const doSpin = () => {
    spin.value = withSequence(
      withTiming(360, { duration: 700 }),
      withTiming(0, { duration: 0 })
    );
  };

  const rank = rankFor(lifetime);
  const { lockedApps } = useAppRegistry();
  const lockedLabel = lockedApps[0]?.label ?? null;
  const schedule = useMemo(() => sortedByStart(quests), [quests]);
  const remaining = quests.filter((q) => !q.done);
  const fastest = fastestRemaining(quests);
  const doneCount = quests.filter((q) => q.done).length;
  const booked = bookedMinutes(quests);
  const editing = quests.find((q) => q.id === editingTimeId) ?? null;

  return (
    <>
      <Animated.View style={spinStyle}>
      <Pressable onPress={doSpin}>
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
      </Pressable>
      </Animated.View>

      <GlassPane
        radius={radii.xl}
        intensity={35}
        tint={colors.glassPaperList}
        style={{ flex: 1, minHeight: 0 }}
        contentStyle={{ flex: 1, minHeight: 0 }}
      >
        <View style={styles.listHeader}>
          <View style={styles.listHeaderRow}>
            <Text style={styles.listTitle}>Today's quests</Text>
            <Text style={styles.listCount}>
              {doneCount}/{quests.length} DONE
            </Text>
          </View>
          <Text style={styles.listSubtitle}>
            7AM – 7PM · {formatDuration(booked)} BOOKED
            {quests.length > 1 ? ' · HOLD TO MOVE' : ''}
          </Text>
        </View>
        <ScrollView contentContainerStyle={styles.listContent}>
          <DraggableList
            data={schedule}
            rowHeight={ROW_H}
            keyExtractor={(q) => q.id}
            onReorder={reorderQuests}
            onLiftStart={() => flash('Drag to move it through the day.')}
            renderItem={(q) => (
              <SwipeToDelete onDelete={() => deleteQuest(q.id)}>
                <QuestRow
                  quest={q}
                  clashes={overlaps(q, quests)}
                  onStart={() => startQuest(q.id)}
                  onEditTime={() => openTimeEditor(q.id)}
                  onClaimed={() => flash('Already claimed today.')}
                />
              </SwipeToDelete>
            )}
          />

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

      {editing && (
        <TimeSlotSheet
          title={editing.name}
          subtitle={`${editing.mins} MIN · CURRENTLY ${formatSlot(editing.startMin).toUpperCase()}`}
          value={editing.startMin}
          onPick={(startMin) => setQuestStart(editing.id, startMin)}
          onClose={closeTimeEditor}
        />
      )}
    </>
  );
}

function QuestRow({
  quest,
  clashes,
  onStart,
  onEditTime,
  onClaimed,
}: {
  quest: Quest;
  clashes: boolean;
  onStart: () => void;
  onEditTime: () => void;
  onClaimed: () => void;
}) {
  const done = quest.done;
  return (
    <View style={styles.questRow}>
      <Pressable style={styles.timeCol} onPress={onEditTime} hitSlop={6}>
        <Text style={[styles.timeText, done && { color: inkAlpha(0.35) }]}>
          {formatSlotShort(quest.startMin)}
        </Text>
        <Text style={styles.timeMins}>{quest.mins}m</Text>
      </Pressable>

      <View style={styles.timeRule} />

      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          numberOfLines={1}
          style={[
            styles.questName,
            { color: done ? inkAlpha(0.42) : colors.ink, textDecorationLine: done ? 'line-through' : 'none' },
          ]}
        >
          {quest.name}
        </Text>
        <Text style={[styles.questMeta, clashes && !done && { color: colors.ochreDeep }]} numberOfLines={1}>
          {clashes && !done ? `OVERLAPS · ${questReward(quest)}` : questReward(quest)}
        </Text>
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

function formatDuration(mins: number) {
  if (mins < 60) return `${mins}M`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}H ${m}M` : `${h}H`;
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
    paddingHorizontal: 13,
    paddingTop: 10,
    paddingBottom: 9,
    borderBottomWidth: 1,
    borderBottomColor: inkAlpha(0.12),
  },
  listHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  listTitle: { fontFamily: fonts.bodyExtra, fontSize: 14, color: colors.ink },
  listCount: { fontFamily: fonts.mono, fontSize: 10, color: inkAlpha(0.52) },
  listSubtitle: { fontFamily: fonts.mono, fontSize: 9, letterSpacing: 1.3, color: inkAlpha(0.45), marginTop: 5 },
  listContent: { padding: 11, paddingTop: 10 },

  questRow: {
    height: ROW_CONTENT_H,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingRight: 11,
    paddingLeft: 8,
    borderRadius: radii.md,
    backgroundColor: colors.glassCard,
    borderWidth: 1,
    borderColor: inkAlpha(0.13),
  },
  timeCol: { width: 46, alignItems: 'center' },
  timeText: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.ink },
  timeMins: { fontFamily: fonts.mono, fontSize: 9, color: inkAlpha(0.45), marginTop: 2 },
  timeRule: { width: 1, alignSelf: 'stretch', marginVertical: 10, backgroundColor: inkAlpha(0.12) },
  questName: { fontFamily: fonts.bodyBold, fontSize: 13 },
  questMeta: { fontFamily: fonts.mono, fontSize: 10, color: inkAlpha(0.52), marginTop: 3 },
  questBtn: { paddingVertical: 7, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1 },
  questBtnText: { fontFamily: fonts.bodyBold, fontSize: 11.5 },

  addQuest: {
    marginTop: 4,
    padding: 10,
    borderRadius: radii.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: inkAlpha(0.28),
    alignItems: 'center',
  },
  addQuestText: { fontFamily: fonts.bodyBold, fontSize: 12, color: inkAlpha(0.6) },

  nudge: {
    marginTop: 11,
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
