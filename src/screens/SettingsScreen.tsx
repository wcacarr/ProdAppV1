import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import GlassPane from '../components/GlassPane';
import PressableScale from '../components/PressableScale';
import TimeSlotSheet from '../components/TimeSlotSheet';
import { colors, fonts, inkAlpha, radii } from '../theme';
import { useQuestStore } from '../state/store';
import { rankFor } from '../state/ranks';
import {
  getNotificationPermission,
  requestNotificationPermission,
} from '../notify/notifications';
import {
  MIN_WINDOW_MIN,
  allDaySlots,
  formatSlot,
  isWithinNightly,
  minutesOfDay,
} from '../state/schedule';

/** Which time is being edited, if any. */
type Editing = 'dayStart' | 'dayEnd' | 'bedtime' | 'wake' | null;

export default function SettingsScreen() {
  const musicEnabled = useQuestStore((s) => s.musicEnabled);
  const setMusicEnabled = useQuestStore((s) => s.setMusicEnabled);
  const lifetime = useQuestStore((s) => s.lifetime);
  const quests = useQuestStore((s) => s.quests);
  const dayWindow = useQuestStore((s) => s.dayWindow);
  const setDayWindow = useQuestStore((s) => s.setDayWindow);
  const bedtimeEnabled = useQuestStore((s) => s.bedtimeEnabled);
  const bedtimeStartMin = useQuestStore((s) => s.bedtimeStartMin);
  const bedtimeWakeMin = useQuestStore((s) => s.bedtimeWakeMin);
  const setBedtime = useQuestStore((s) => s.setBedtime);
  const rank = rankFor(lifetime);

  const remindersEnabled = useQuestStore((s) => s.remindersEnabled);
  const setRemindersEnabled = useQuestStore((s) => s.setRemindersEnabled);

  const [editing, setEditing] = useState<Editing>(null);
  const [notificationsGranted, setNotificationsGranted] = useState(true);

  useEffect(() => {
    getNotificationPermission().then(setNotificationsGranted).catch(() => {});
  }, [remindersEnabled]);

  // Asking only when the toggle goes on keeps the permission prompt tied to a
  // thing the user just asked for.
  const toggleReminders = useCallback(async () => {
    if (remindersEnabled) {
      setRemindersEnabled(false);
      return;
    }
    const granted = await requestNotificationPermission();
    setNotificationsGranted(granted);
    setRemindersEnabled(granted);
  }, [remindersEnabled, setRemindersEnabled]);
  const dayLength = dayWindow.endMin - dayWindow.startMin;
  const asleepNow =
    bedtimeEnabled && isWithinNightly(minutesOfDay(), bedtimeStartMin, bedtimeWakeMin);

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
        <Text style={styles.sectionLabel}>YOUR DAY</Text>
        <View style={styles.card}>
          <Text style={styles.rowTitle}>Work hours</Text>
          <Text style={styles.rowBody}>
            The stretch your quest calendar covers. Anything scheduled outside a narrowed window
            gets pulled back inside it.
          </Text>
          <View style={styles.timePair}>
            <TimeField label="STARTS" value={dayWindow.startMin} onPress={() => setEditing('dayStart')} />
            <TimeField label="ENDS" value={dayWindow.endMin} onPress={() => setEditing('dayEnd')} />
          </View>
          <Text style={styles.cardFoot}>
            {formatDuration(dayLength)} long
            {dayLength > 12 * 60 ? ' — longer than the twelve hours most people can hold' : ''}
          </Text>
        </View>

        <Text style={styles.sectionLabel}>BEDTIME</Text>
        <Toggle
          on={bedtimeEnabled}
          title="Relock everything overnight"
          body="Between these times every locked app shuts regardless of XP, and no amount of it will buy the night back."
          onToggle={() => setBedtime({ enabled: !bedtimeEnabled })}
        />
        {bedtimeEnabled && (
          <View style={[styles.card, { marginTop: 8 }]}>
            <View style={styles.timePair}>
              <TimeField label="LOCKS AT" value={bedtimeStartMin} onPress={() => setEditing('bedtime')} />
              <TimeField label="OPENS AT" value={bedtimeWakeMin} onPress={() => setEditing('wake')} />
            </View>
            <Text style={[styles.cardFoot, asleepNow && { color: colors.ochreDeep }]}>
              {asleepNow
                ? `Bedtime is on right now — locked apps stay shut until ${formatSlot(bedtimeWakeMin)}.`
                : `Everything locked will shut at ${formatSlot(bedtimeStartMin)}.`}
            </Text>
          </View>
        )}

        <Text style={styles.sectionLabel}>REMINDERS</Text>
        <Toggle
          on={remindersEnabled}
          title="Nudges and timer alerts"
          body="Tells you when a quest timer lands while you are elsewhere, and once a day if nothing has been claimed. Scheduled on this phone — nothing is sent anywhere."
          onToggle={toggleReminders}
        />
        {remindersEnabled && !notificationsGranted && (
          <View style={[styles.card, { marginTop: 8 }]}>
            <Text style={styles.cardFoot}>
              Android has not granted notification permission, so nothing will appear. Turn this off
              and on again to ask, or allow it in the phone's app settings.
            </Text>
          </View>
        )}

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

      {editing && (
        <TimeSlotSheet
          title={EDIT_TITLES[editing]}
          subtitle={EDIT_SUBTITLES[editing]}
          value={
            editing === 'dayStart'
              ? dayWindow.startMin
              : editing === 'dayEnd'
                ? dayWindow.endMin
                : editing === 'bedtime'
                  ? bedtimeStartMin
                  : bedtimeWakeMin
          }
          slots={allDaySlots()}
          onPick={(min) => {
            if (editing === 'dayStart') setDayWindow({ startMin: min });
            else if (editing === 'dayEnd') setDayWindow({ endMin: min });
            else if (editing === 'bedtime') setBedtime({ startMin: min });
            else setBedtime({ wakeMin: min });
            setEditing(null);
          }}
          onClose={() => setEditing(null)}
        />
      )}
    </GlassPane>
  );
}

const EDIT_TITLES: Record<Exclude<Editing, null>, string> = {
  dayStart: 'Day starts at',
  dayEnd: 'Day ends at',
  bedtime: 'Lock everything at',
  wake: 'Open again at',
};

const EDIT_SUBTITLES: Record<Exclude<Editing, null>, string> = {
  dayStart: 'THE FIRST SLOT ON YOUR CALENDAR',
  dayEnd: `THE LAST SLOT · AT LEAST ${MIN_WINDOW_MIN} MIN AFTER THE START`,
  bedtime: 'WHEN THE NIGHT SHUTS EVERYTHING',
  wake: 'WHEN BOUGHT TIME WORKS AGAIN',
};

function TimeField({
  label,
  value,
  onPress,
}: {
  label: string;
  value: number;
  onPress: () => void;
}) {
  return (
    <PressableScale style={styles.timeField} onPress={onPress} scaleTo={0.97}>
      <Text style={styles.timeFieldLabel}>{label}</Text>
      <Text style={styles.timeFieldValue}>{formatSlot(value)}</Text>
    </PressableScale>
  );
}

function formatDuration(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (!h) return `${m} min`;
  return m ? `${h}h ${m}m` : `${h} hours`;
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
  card: {
    padding: 12,
    borderRadius: radii.md,
    backgroundColor: colors.glassCard,
    borderWidth: 1,
    borderColor: inkAlpha(0.13),
  },
  cardFoot: { fontFamily: fonts.mono, fontSize: 9.5, lineHeight: 15, color: inkAlpha(0.5), marginTop: 10 },
  timePair: { flexDirection: 'row', gap: 8, marginTop: 11 },
  timeField: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: radii.sm,
    backgroundColor: 'rgba(255,252,242,.85)',
    borderWidth: 1,
    borderColor: inkAlpha(0.16),
  },
  timeFieldLabel: { fontFamily: fonts.mono, fontSize: 8.5, letterSpacing: 1.2, color: inkAlpha(0.45) },
  timeFieldValue: { fontFamily: fonts.bodyExtra, fontSize: 15, color: colors.ink, marginTop: 4 },

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
