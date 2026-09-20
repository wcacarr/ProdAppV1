import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

/**
 * Local notifications only — no server, nothing leaves the phone, in keeping
 * with what the privacy card promises.
 *
 * Everything is scheduled while the app is open. There is no background task
 * deciding what to send later: each time the app is used we cancel the pending
 * reminders and lay down the next ones from current state. That keeps the
 * reminders honest (they cannot fire about a quest you already finished) and
 * avoids asking Android for background execution it would rather not give.
 */

const QUEST_END_ID = 'tasuku-quest-end';
const DAILY_ID = 'tasuku-daily-nudge';
const AWAY_ID = 'tasuku-been-away';

const CHANNEL_ID = 'tasuku-reminders';

/** How long a silence counts as "been away". */
const AWAY_DAYS = 3;

export const isNotificationsSupported = Platform.OS !== 'web';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

let channelReady = false;

async function ensureChannel() {
  if (Platform.OS !== 'android' || channelReady) return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Reminders',
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: 'default',
    vibrationPattern: [0, 200],
    lightColor: '#E9A400',
  });
  channelReady = true;
}

export async function getNotificationPermission(): Promise<boolean> {
  if (!isNotificationsSupported) return false;
  try {
    const { granted } = await Notifications.getPermissionsAsync();
    return granted;
  } catch {
    return false;
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNotificationsSupported) return false;
  try {
    await ensureChannel();
    const { granted } = await Notifications.requestPermissionsAsync();
    return granted;
  } catch {
    return false;
  }
}

async function put(
  identifier: string,
  title: string,
  body: string,
  date: Date
): Promise<void> {
  if (!isNotificationsSupported) return;
  // A time already gone would fire immediately, which is worse than silence.
  if (date.getTime() <= Date.now() + 1000) return;
  try {
    await ensureChannel();
    await Notifications.scheduleNotificationAsync({
      identifier,
      content: {
        title,
        body,
        ...(Platform.OS === 'android' ? { channelId: CHANNEL_ID } : null),
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date },
    });
  } catch {
    // A denied permission or a locked-down OEM should never break the app.
  }
}

async function drop(identifier: string): Promise<void> {
  if (!isNotificationsSupported) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(identifier);
  } catch {
    // Nothing scheduled under that id; fine.
  }
}

/** Fires when a running quest's timer lands, so leaving the app to take a call
 *  does not mean losing track of it. */
export async function scheduleQuestEnd(questName: string, endAt: number) {
  await drop(QUEST_END_ID);
  await put(
    QUEST_END_ID,
    'Time is up',
    `"${questName}" is done — come and claim the XP.`,
    new Date(endAt)
  );
}

export async function cancelQuestEnd() {
  await drop(QUEST_END_ID);
}

type ReminderState = {
  enabled: boolean;
  /** Something is still unfinished today. */
  hasUnfinished: boolean;
  /** Minutes from midnight to nudge at — the start of the work day. */
  nudgeMin: number;
  /** Suppressed while the overnight relock is in force. */
  bedtimeStartMin: number | null;
};

/**
 * Lays down the next daily nudge and the next "been away" prompt, replacing
 * whatever was pending. Safe to call on every foreground.
 */
export async function rescheduleReminders(state: ReminderState) {
  await drop(DAILY_ID);
  await drop(AWAY_ID);
  if (!state.enabled || !isNotificationsSupported) return;

  if (state.hasUnfinished) {
    await put(
      DAILY_ID,
      'One small thing',
      'Nothing claimed yet today. The shortest quest on your list still counts.',
      nextOccurrence(state.nudgeMin, state.bedtimeStartMin)
    );
  }

  const away = new Date();
  away.setDate(away.getDate() + AWAY_DAYS);
  away.setHours(Math.floor(state.nudgeMin / 60), state.nudgeMin % 60, 0, 0);
  await put(
    AWAY_ID,
    'Still here when you are',
    'It has been a few days. One ten-minute quest is a perfectly good start.',
    away
  );
}

export async function cancelReminders() {
  await drop(DAILY_ID);
  await drop(AWAY_ID);
  await cancelWaterReminders();
}

const WATER_PREFIX = 'tasuku-water-';
/** More glasses than anyone should schedule; used to clear stale ids. */
const MAX_WATER_SLOTS = 16;

async function cancelWaterReminders() {
  for (let i = 0; i < MAX_WATER_SLOTS; i++) {
    await drop(`${WATER_PREFIX}${i}`);
  }
}

/**
 * One nudge per glass, at the times the schedule puts them. Glasses already
 * ticked off today are skipped, so finishing early buys silence rather than a
 * reminder for something done.
 */
export async function scheduleWaterReminders(
  times: number[],
  quests: { kind?: string; startMin: number; done: boolean }[]
) {
  await cancelWaterReminders();
  if (!times.length || !isNotificationsSupported) return;

  const doneAt = new Set(
    quests.filter((q) => q.kind === 'water' && q.done).map((q) => q.startMin)
  );

  for (let i = 0; i < times.length; i++) {
    const minute = times[i];
    if (doneAt.has(minute)) continue;
    const at = new Date();
    at.setHours(Math.floor(minute / 60), minute % 60, 0, 0);
    await put(
      `${WATER_PREFIX}${i}`,
      'Water',
      `Glass ${i + 1} of ${times.length}. Go and get one.`,
      at
    );
  }
}

/**
 * Clears the badge and anything still sitting in the shade. Android keeps the
 * count on the launcher icon until something actively dismisses it, so opening
 * the app is the natural moment.
 */
export async function clearDeliveredNotifications() {
  if (!isNotificationsSupported) return;
  try {
    await Notifications.dismissAllNotificationsAsync();
    await Notifications.setBadgeCountAsync(0);
  } catch {
    // Nothing to clear, or the launcher does not support badges.
  }
}

/**
 * The next time today's clock passes `minute`, or tomorrow if it already has.
 * Nudging during bedtime would be the opposite of the point, so a nudge that
 * would land after lights-out waits for the next day.
 */
function nextOccurrence(minute: number, bedtimeStartMin: number | null): Date {
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const at = new Date(now);
  at.setHours(Math.floor(minute / 60), minute % 60, 0, 0);

  const pastAlready = nowMin >= minute;
  const afterBedtime = bedtimeStartMin != null && minute >= bedtimeStartMin;
  if (pastAlready || afterBedtime) at.setDate(at.getDate() + 1);
  return at;
}
