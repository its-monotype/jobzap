import { storage } from '#imports';
import { create } from 'zustand';
import {
  createJSONStorage,
  persist,
  type StateStorage,
} from 'zustand/middleware';
import { useShallow } from 'zustand/shallow';
import { FilterId } from './constants';

interface Settings {
  filters: Partial<Record<FilterId, boolean>>;
  blockedCompanies: string[];
  excludedKeywords: string[];
  postedWithin: number | null;
  defaultToMostRecent: boolean;
}

interface AppStore {
  settings: Settings;
  activeFilters: Record<FilterId, boolean>;
  counts: Partial<Record<FilterId, number>>;
  actions: {
    toggleFilter: (id: FilterId) => void;
    toggleActive: (id: FilterId) => void;
    blockCompany: (company: string) => void;
    unblockCompany: (company: string) => void;
    addKeyword: (keyword: string) => void;
    removeKeyword: (keyword: string) => void;
    updateSettings: (partial: Partial<Settings>) => void;
    setCounts: (counts: Partial<Record<FilterId, number>>) => void;
  };
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
        filters: {},
        blockedCompanies: [],
        excludedKeywords: [],
        postedWithin: null,
        defaultToMostRecent: false,
      },
      activeFilters: {
        promoted: true,
        viewed: true,
        dismissed: true,
        applied: true,
        companies: true,
        keywords: true,
      },
      counts: {},
      actions: {
        toggleFilter: (id) =>
          set((s) => ({
            settings: {
              ...s.settings,
              filters: { ...s.settings.filters, [id]: !s.settings.filters[id] },
            },
          })),
        toggleActive: (id) =>
          set((s) => ({
            activeFilters: {
              ...s.activeFilters,
              [id]: !s.activeFilters[id],
            },
          })),
        blockCompany: (company) =>
          set((s) => ({
            settings: {
              ...s.settings,
              blockedCompanies: [...s.settings.blockedCompanies, company],
            },
          })),
        unblockCompany: (company) =>
          set((s) => ({
            settings: {
              ...s.settings,
              blockedCompanies: s.settings.blockedCompanies.filter(
                (c) => c !== company,
              ),
            },
          })),
        addKeyword: (keyword) =>
          set((s) => ({
            settings: {
              ...s.settings,
              excludedKeywords: [...s.settings.excludedKeywords, keyword],
            },
          })),
        removeKeyword: (keyword) =>
          set((s) => ({
            settings: {
              ...s.settings,
              excludedKeywords: s.settings.excludedKeywords.filter(
                (k) => k !== keyword,
              ),
            },
          })),
        updateSettings: (partial) =>
          set((s) => ({ settings: { ...s.settings, ...partial } })),
        setCounts: (counts) =>
          set((s) => ({ counts: { ...s.counts, ...counts } })),
      },
    }),
    {
      name: 'jobzap',
      partialize: (state) => ({ settings: state.settings }),
      storage: createJSONStorage(() => wxtStorage),
    },
  ),
);

export const useSettings = () => useAppStore(useShallow((s) => s.settings));
export const useActiveFilters = () =>
  useAppStore(useShallow((s) => s.activeFilters));
export const useCounts = () => useAppStore(useShallow((s) => s.counts));
export const useActions = () => useAppStore((s) => s.actions);
