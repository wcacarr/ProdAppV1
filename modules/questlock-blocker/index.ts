import { requireOptionalNativeModule } from 'expo';

export type InstalledApp = {
  packageName: string;
  label: string;
};

type QuestlockBlockerNativeModule = {
  isAccessibilityServiceEnabled: () => boolean;
  openAccessibilitySettings: () => void;
  getInstalledApps: () => InstalledApp[];
  getBlockedPackages: () => string[];
  setBlockedPackages: (packages: string[]) => void;
  grantUnlock: (packageName: string, minutes: number) => void;
  clearUnlock: (packageName: string) => void;
  getUnlockUntil: (packageName: string) => number;
};

const native = requireOptionalNativeModule<QuestlockBlockerNativeModule>('QuestlockBlocker');

/** False in Expo Go, on web, and on iOS — callers should degrade, not crash. */
export const isBlockingSupported = native != null;

export const isAccessibilityServiceEnabled = () => native?.isAccessibilityServiceEnabled() ?? false;
export const openAccessibilitySettings = () => native?.openAccessibilitySettings();
export const getInstalledApps = (): InstalledApp[] => native?.getInstalledApps() ?? [];
export const getBlockedPackages = (): string[] => native?.getBlockedPackages() ?? [];
export const setBlockedPackages = (packages: string[]) => native?.setBlockedPackages(packages);
export const grantUnlock = (packageName: string, minutes: number) =>
  native?.grantUnlock(packageName, minutes);
export const clearUnlock = (packageName: string) => native?.clearUnlock(packageName);
export const getUnlockUntil = (packageName: string): number => native?.getUnlockUntil(packageName) ?? 0;
