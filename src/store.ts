import { storage } from '#imports';
import { create } from 'zustand';
import {
  createJSONStorage,
  persist,
  type StateStorage,
} from 'zustand/middleware';
import { useShallow } from 'zustand/shallow';

export interface FilterSettings {
  hideViewed: boolean;
  hideApplied: boolean;
  hideDismissed: boolean;
  hiddenCompanies: string[];
}

export interface FilterCounts {
  viewed: number;
  applied: number;
  dismissed: number;
}

interface AppStore {
  settings: FilterSettings;
  counts: FilterCounts;
  updateSettings: (partial: Partial<FilterSettings>) => void;
  setCounts: (counts: FilterCounts) => void;
}

const wxtStorage: StateStorage = {
  getItem: async (name): Promise<string | null> => {
    return await storage.getItem<string>(`sync:${name}`);
  },
  setItem: async (name, value): Promise<void> => {
    await storage.setItem(`sync:${name}`, value);
  },
  removeItem: async (name): Promise<void> => {
    await storage.removeItem(`sync:${name}`);
  },
};

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      settings: {
        hideViewed: true,
        hideApplied: true,
        hideDismissed: true,
        hiddenCompanies: [],
      },
      counts: { viewed: 0, applied: 0, dismissed: 0 },
      updateSettings: (partial) =>
        set((s) => ({ settings: { ...s.settings, ...partial } })),
      setCounts: (counts) => set({ counts }),
    }),
    {
      name: 'jobzap',
      partialize: (state) => ({ settings: state.settings }),
      storage: createJSONStorage(() => wxtStorage),
    },
  ),
);

export const useSettings = () => useAppStore(useShallow((s) => s.settings));
export const useCounts = () => useAppStore(useShallow((s) => s.counts));
export const useUpdateSettings = () => useAppStore((s) => s.updateSettings);
export const useSetCounts = () => useAppStore((s) => s.setCounts);
