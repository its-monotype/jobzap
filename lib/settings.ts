import { browser } from 'wxt/browser';

export type Settings = {
  enabled: boolean;
  hideViewed: boolean;
  hideApplied: boolean;
  hideDismissed: boolean;
  companyBlocklist: string; // newline separated
};

export const DEFAULT_SETTINGS: Settings = {
  enabled: true,
  hideViewed: false,
  hideApplied: false,
  hideDismissed: false,
  companyBlocklist: '',
};

export async function getSettings(): Promise<Settings> {
  const res = await browser.storage.sync.get(DEFAULT_SETTINGS);
  return res as Settings;
}

export async function saveSettings(patch: Partial<Settings>) {
  const current = await getSettings();
  await browser.storage.sync.set({ ...current, ...patch });
}
