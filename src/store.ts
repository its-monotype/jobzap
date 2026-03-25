import { storage } from '#imports';
import { create } from 'zustand';
import {
  createJSONStorage,
  persist,
  type StateStorage,
} from 'zustand/middleware';
import { useShallow } from 'zustand/shallow';
import type { FilterId } from './constants';

interface Settings {
  enabledFilters: Record<FilterId, boolean>;
  blockedCompanies: string[];
  excludedKeywords: string[];
  postedWithin: number | null;
  defaultToRecentSort: boolean;
}

interface AppStore {
  settings: Settings;
  activeFilters: Record<FilterId, boolean>;
  filterCounts: Partial<Record<FilterId, number>>;
  visibleCompanies: string[];
  isAiSearchPage: boolean;
  actions: {
    setFilterEnabled: (id: FilterId, enabled: boolean) => void;
    setFilterActive: (id: FilterId, active: boolean) => void;
    toggleFilterActive: (id: FilterId) => void;

    setBlockedCompanies: (companies: string[]) => void;
    setExcludedKeywords: (keywords: string[]) => void;

    setPostedWithin: (value: number | null) => void;
    setDefaultToRecentSort: (value: boolean) => void;

    setFilterCounts: (counts: Partial<Record<FilterId, number>>) => void;

    setVisibleCompanies: (companies: string[]) => void;
    setIsAiSearchPage: (value: boolean) => void;
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

const defaultSettings: Settings = {
  enabledFilters: {
    promoted: false,
    viewed: false,
    dismissed: false,
    applied: false,
    companies: false,
    keywords: false,
  },
  blockedCompanies: [],
  excludedKeywords: [],
  postedWithin: null,
  defaultToRecentSort: false,
};

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      settings: defaultSettings,
      activeFilters: {
        ...defaultSettings.enabledFilters,
      },
      filterCounts: {},
      visibleCompanies: [],
      isAiSearchPage: false,
      actions: {
        setFilterEnabled: (id, enabled) =>
          set((s) => ({
            settings: {
              ...s.settings,
              enabledFilters: {
                ...s.settings.enabledFilters,
                [id]: enabled,
              },
            },
            activeFilters: {
              ...s.activeFilters,
              [id]: enabled,
            },
          })),
        setFilterActive: (id, active) =>
          set((s) => ({
            activeFilters: {
              ...s.activeFilters,
              [id]: active,
            },
          })),
        toggleFilterActive: (id) =>
          set((s) => ({
            activeFilters: {
              ...s.activeFilters,
              [id]: !s.activeFilters[id],
            },
          })),

        setBlockedCompanies: (blockedCompanies) =>
          set((s) => ({ settings: { ...s.settings, blockedCompanies } })),
        setExcludedKeywords: (excludedKeywords) =>
          set((s) => ({ settings: { ...s.settings, excludedKeywords } })),

        setPostedWithin: (postedWithin) =>
          set((s) => ({ settings: { ...s.settings, postedWithin } })),
        setDefaultToRecentSort: (defaultToRecentSort) =>
          set((s) => ({ settings: { ...s.settings, defaultToRecentSort } })),

        setFilterCounts: (counts) => set({ filterCounts: counts }),

        setVisibleCompanies: (visibleCompanies) => set({ visibleCompanies }),
        setIsAiSearchPage: (isAiSearchPage) => set({ isAiSearchPage }),
      },
    }),
    {
      name: 'jobzap',
      partialize: (state) => ({
        settings: state.settings,
        activeFilters: state.activeFilters,
      }),
      storage: createJSONStorage(() => wxtStorage),
    },
  ),
);

storage.watch<string>('sync:jobzap', () => {
  void useAppStore.persist.rehydrate();
});

export const useActions = () => useAppStore((s) => s.actions);
export const useSettings = () => useAppStore(useShallow((s) => s.settings));
export const useEnabledFilters = () =>
  useAppStore(useShallow((s) => s.settings.enabledFilters));
export const useActiveFilters = () =>
  useAppStore(useShallow((s) => s.activeFilters));
export const useFilterCounts = () =>
  useAppStore(useShallow((s) => s.filterCounts));
export const useVisibleCompanies = () =>
  useAppStore(useShallow((s) => s.visibleCompanies));
export const useIsAiSearchPage = () => useAppStore((s) => s.isAiSearchPage);
