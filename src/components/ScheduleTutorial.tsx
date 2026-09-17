import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';
import DraggableList from './DraggableList';
import PressableScale from './PressableScale';
import SwipeToDelete from './SwipeToDelete';
import TimeSlotSheet from './TimeSlotSheet';
import { colors, fonts, inkAlpha, radii } from '../theme';
import { DayWindow, formatSlotShort, slotChoices, windowLabel } from '../state/schedule';

const ROW_CONTENT_H = 50;
const ROW_H = ROW_CONTENT_H + 7;

type DemoQuest = { id: number; name: string; mins: number; startMin: number };

type Lesson = 'add' | 'time' | 'move' | 'bin';

const LESSONS: { key: Lesson; todo: string; done: string }[] = [
  { key: 'add', todo: 'Add a quest to the day', done: 'Added' },
  { key: 'time', todo: 'Tap a time to move it to another slot', done: 'Rescheduled' },
  { key: 'move', todo: 'Hold a row and drag it past another', done: 'Reordered' },
  { key: 'bin', todo: 'Swipe a row left to bin it', done: 'Binned' },
];

/**
 * A working miniature of the Today calendar. Every lesson has to actually be
 * performed on it — reading about a long-press teaches nobody a long-press.
 */
export default function ScheduleTutorial({
  window: dayWindow,
  onDone,
  onSkip,
}: {
  window: DayWindow;
  onDone: () => void;
  onSkip: () => void;
}) {
  const [quests, setQuests] = useState<DemoQuest[]>([
    { id: 1, name: 'Make the bed', mins: 5, startMin: dayWindow.startMin },
    { id: 2, name: 'Breakfast', mins: 30, startMin: dayWindow.startMin + 60 },
  ]);
  const [learned, setLearned] = useState<Record<Lesson, boolean>>({
    add: false,
    time: false,
    move: false,
    bin: false,
  });
  const [editingId, setEditingId] = useState<number | null>(null);

  const slots = useMemo(() => slotChoices(dayWindow), [dayWindow]);
  const ordered = useMemo(() => [...quests].sort((a, b) => a.startMin - b.startMin), [quests]);
  const editing = quests.find((q) => q.id === editingId) ?? null;
  const allDone = LESSONS.every((l) => learned[l.key]);

  const tick = (key: Lesson) => setLearned((prev) => ({ ...prev, [key]: true }));

  const add = () => {
    const latest = quests.reduce((acc, q) => Math.max(acc, q.startMin + q.mins), dayWindow.startMin);
    const startMin = Math.min(dayWindow.endMin, Math.ceil(latest / 15) * 15);
    setQuests((prev) => [...prev, { id: Date.now(), name: 'Meeting at work', mins: 40, startMin }]);
    tick('add');
  };

  const reschedule = (id: number, startMin: number) => {
    setQuests((prev) => prev.map((q) => (q.id === id ? { ...q, startMin } : q)));
    setEditingId(null);
    tick('time');
  };

  // Same rule as the real list: the slots stay put and the quests trade places.
  const reorder = (from: number, to: number) => {
    if (from === to) return;
    const times = ordered.map((q) => q.startMin);
    const moved = ordered.slice();
    const [item] = moved.splice(from, 1);
    moved.splice(to, 0, item);
    const next = new Map(moved.map((q, i) => [q.id, times[i]]));
    setQuests((prev) => prev.map((q) => (next.has(q.id) ? { ...q, startMin: next.get(q.id)! } : q)));
    tick('move');
  };

  const bin = (id: number) => {
    setQuests((prev) => prev.filter((q) => q.id !== id));
    tick('bin');
  };

  return (
    <>
      <Text style={styles.kicker}>TRY IT</Text>
      <Text style={styles.title}>Your day is a calendar</Text>
      <Text style={styles.intro}>
        This is a real one — do each thing below on it and nothing here is left to guess.
      </Text>

      <View style={styles.board}>
        <Text style={styles.boardLabel}>{windowLabel(dayWindow)}</Text>
        <DraggableList
          data={ordered}
          rowHeight={ROW_H}
          keyExtractor={(q) => q.id}
          onReorder={reorder}
          renderItem={(q) => (
            <SwipeToDelete onDelete={() => bin(q.id)}>
              <View style={styles.row}>
                <Pressable style={styles.timeCol} onPress={() => setEditingId(q.id)} hitSlop={6}>
                  <Text style={styles.timeText}>{formatSlotShort(q.startMin)}</Text>
                  <Text style={styles.timeMins}>{q.mins}m</Text>
                </Pressable>
                <View style={styles.rule} />
                <Text style={styles.rowName} numberOfLines={1}>
                  {q.name}
                </Text>
              </View>
            </SwipeToDelete>
          )}
        />
        {quests.length === 0 && <Text style={styles.empty}>Nothing left. Add one back.</Text>}
        <PressableScale style={styles.addRow} onPress={add}>
          <Text style={styles.addText}>+ Add a quest</Text>
        </PressableScale>
      </View>

      <View style={styles.checklist}>
        {LESSONS.map((lesson, i) => {
          const done = learned[lesson.key];
          return (
            <Animated.View key={lesson.key} layout={LinearTransition.duration(180)} style={styles.check}>
              <View style={[styles.tick, done && styles.tickOn]}>
                {done ? <Text style={styles.tickMark}>{'✓'}</Text> : <Text style={styles.tickNum}>{i + 1}</Text>}
              </View>
              <Text style={[styles.checkText, done && styles.checkTextDone]}>
                {done ? lesson.done : lesson.todo}
              </Text>
            </Animated.View>
          );
        })}
      </View>

      <Animated.View entering={FadeIn.duration(200)} style={styles.settingsNote}>
        <Text style={styles.settingsTitle}>Your hours are yours</Text>
        <Text style={styles.settingsBody}>
          The day runs {windowLabel(dayWindow).toLowerCase()} by default. Change it — and set a
          bedtime that relocks everything overnight — under the gear icon, in Settings.
        </Text>
      </Animated.View>

      <PressableScale
        style={[styles.primaryBtn, !allDone && styles.primaryBtnOff]}
        onPress={() => allDone && onDone()}
      >
        <Text style={[styles.primaryText, !allDone && { color: inkAlpha(0.45) }]}>
          {allDone ? 'Start' : 'Try all four to continue'}
        </Text>
      </PressableScale>
      <PressableScale style={styles.skip} onPress={onSkip} scaleTo={0.97}>
        <Text style={styles.skipText}>Skip</Text>
      </PressableScale>

      {editing && (
        <TimeSlotSheet
          title={editing.name}
          subtitle={`${editing.mins} MIN · PICK A NEW SLOT`}
          value={editing.startMin}
          slots={slots}
          onPick={(startMin) => reschedule(editing.id, startMin)}
          onClose={() => setEditingId(null)}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  kicker: { fontFamily: fonts.mono, fontSize: 9.5, letterSpacing: 1.8, color: inkAlpha(0.5) },
  title: { fontFamily: fonts.bodyExtra, fontSize: 21, color: colors.ink, marginTop: 8 },
  intro: { fontFamily: fonts.body, fontSize: 12.5, lineHeight: 18, color: inkAlpha(0.6), marginTop: 6 },

  board: {
    marginTop: 14,
    padding: 9,
    borderRadius: radii.lg,
    backgroundColor: colors.glassNudge,
    borderWidth: 1,
    borderColor: inkAlpha(0.12),
  },
  boardLabel: {
    fontFamily: fonts.mono,
    fontSize: 8.5,
    letterSpacing: 1.4,
    color: inkAlpha(0.42),
    paddingHorizontal: 3,
    paddingBottom: 8,
  },
  row: {
    height: ROW_CONTENT_H,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingLeft: 7,
    paddingRight: 11,
    borderRadius: radii.md,
    backgroundColor: colors.glassCard,
    borderWidth: 1,
    borderColor: inkAlpha(0.13),
  },
  timeCol: { width: 42, alignItems: 'center' },
  timeText: { fontFamily: fonts.bodyBold, fontSize: 11.5, color: colors.ink },
  timeMins: { fontFamily: fonts.mono, fontSize: 8.5, color: inkAlpha(0.45), marginTop: 2 },
  rule: { width: 1, alignSelf: 'stretch', marginVertical: 9, backgroundColor: inkAlpha(0.12) },
  rowName: { flex: 1, fontFamily: fonts.bodyBold, fontSize: 12.5, color: colors.ink },
  empty: {
    fontFamily: fonts.body,
    fontSize: 11.5,
    color: inkAlpha(0.5),
    textAlign: 'center',
    paddingVertical: 10,
  },
  addRow: {
    padding: 9,
    borderRadius: radii.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: inkAlpha(0.28),
    alignItems: 'center',
  },
  addText: { fontFamily: fonts.bodyBold, fontSize: 11.5, color: inkAlpha(0.6) },

  checklist: { marginTop: 13, gap: 7 },
  check: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  tick: {
    width: 20,
    height: 20,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: inkAlpha(0.22),
    alignItems: 'center',
    justifyContent: 'center',
  },
  tickOn: { backgroundColor: colors.ochre, borderColor: inkAlpha(0.3) },
  tickMark: { fontFamily: fonts.bodyExtra, fontSize: 11, color: colors.ink },
  tickNum: { fontFamily: fonts.mono, fontSize: 10, color: inkAlpha(0.5) },
  checkText: { flex: 1, fontFamily: fonts.bodySemi, fontSize: 12, color: inkAlpha(0.7) },
  checkTextDone: { color: inkAlpha(0.42), textDecorationLine: 'line-through' },

  settingsNote: {
    marginTop: 14,
    padding: 11,
    borderRadius: radii.md,
    backgroundColor: 'rgba(246,239,216,.75)',
    borderWidth: 1,
    borderColor: inkAlpha(0.14),
  },
  settingsTitle: { fontFamily: fonts.bodyExtra, fontSize: 12, color: colors.ink },
  settingsBody: { fontFamily: fonts.body, fontSize: 11.5, lineHeight: 17, color: inkAlpha(0.68), marginTop: 4 },

  primaryBtn: {
    marginTop: 16,
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
