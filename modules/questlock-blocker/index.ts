import { requireOptionalNativeModule } from 'expo';

export type InstalledApp = {
  packageName: string;
  label: string;
  /** data: URI, or empty string when the icon couldn't be read. */
  icon: string;
};

export type LockState = {
  packageName: string;
  /** Epoch ms when the lock stops being freely reversible. */
  lockActiveAt: number;
  /** Epoch ms until a purchased unlock expires. */
  unlockUntil: number;
};

export type DeviceNowPlaying = {
  isPlaying: boolean;
  trackName: string;
  artistName: string;
  positionMs: number;
  durationMs: number;
  appPackage: string;
  /** "Spotify" — a fallback label when the app publishes no track metadata. */
  appName: string;
  albumArtUrl: string | null;
};

type BlockerNative = {
  isAccessibilityServiceEnabled: () => boolean;
  openAccessibilitySettings: () => void;
  openAppInfo: () => void;
  getInstalledApps: () => Promise<InstalledApp[]>;
  launchApp: (packageName: string) => boolean;
  getLockStates: () => LockState[];
  lockApp: (packageName: string) => void;
  unlockApp: (packageName: string) => void;
  grantUnlock: (packageName: string, minutes: number) => void;
  isBlockedNow: (packageName: string) => boolean;
  setBedtime: (enabled: boolean, startMin: number, wakeMin: number) => void;
  isBedtimeNow: () => boolean;
};

type MediaNative = {
  isNotificationAccessGranted: () => boolean;
  openNotificationAccessSettings: () => void;
  getNowPlaying: () => DeviceNowPlaying | null;
  seekTo: (positionMs: number) => boolean;
  play: () => boolean;
  pause: () => boolean;
  next: () => boolean;
  previous: () => boolean;
};

const blocker = requireOptionalNativeModule<BlockerNative>('QuestlockBlocker');
const media = requireOptionalNativeModule<MediaNative>('QuestlockMedia');

/** False in Expo Go, on web, and on iOS — callers should degrade, not crash. */
export const isBlockingSupported = blocker != null;
export const isMediaSupported = media != null;

/** Grace window after locking an app, during which it can still be undone freely. */
export const LOCK_GRACE_MS = 60_000;

export const isAccessibilityServiceEnabled = () => blocker?.isAccessibilityServiceEnabled() ?? false;
export const openAccessibilitySettings = () => blocker?.openAccessibilitySettings();
/** App info page — where a sideloaded build has to clear "restricted settings" first. */
export const openAppInfo = () => blocker?.openAppInfo();
export const getInstalledApps = async (): Promise<InstalledApp[]> =>
  (await blocker?.getInstalledApps()) ?? [];
export const launchApp = (packageName: string) => blocker?.launchApp(packageName) ?? false;
export const getLockStates = (): LockState[] => blocker?.getLockStates() ?? [];
export const lockApp = (packageName: string) => blocker?.lockApp(packageName);
export const unlockApp = (packageName: string) => blocker?.unlockApp(packageName);
export const grantUnlock = (packageName: string, minutes: number) =>
  blocker?.grantUnlock(packageName, minutes);
export const isBlockedNow = (packageName: string) => blocker?.isBlockedNow(packageName) ?? false;

/** Overnight relock: while it is on, locked apps ignore bought time entirely. */
export const setBedtime = (enabled: boolean, startMin: number, wakeMin: number) =>
  blocker?.setBedtime(enabled, startMin, wakeMin);
export const isBedtimeNow = () => blocker?.isBedtimeNow() ?? false;

export const isNotificationAccessGranted = () => media?.isNotificationAccessGranted() ?? false;
export const openNotificationAccessSettings = () => media?.openNotificationAccessSettings();
export const getDeviceNowPlaying = (): DeviceNowPlaying | null => media?.getNowPlaying() ?? null;
export const mediaSeekTo = (positionMs: number) => media?.seekTo(positionMs) ?? false;
export const mediaPlay = () => media?.play() ?? false;
export const mediaPause = () => media?.pause() ?? false;
export const mediaNext = () => media?.next() ?? false;
export const mediaPrevious = () => media?.previous() ?? false;
