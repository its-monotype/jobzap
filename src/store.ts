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
  enabledFilters: Record<FilterId, boolean>;
  blockedCompanies: string[];
  excludedKeywords: string[];
  postedWithin: number | null;
  defaultToMostRecent: boolean;
}

interface AppStore {
  settings: Settings;
  toggledFilters: Record<FilterId, boolean>;
  filterCounts: Partial<Record<FilterId, number>>;
  actions: {
    setFilterEnabled: (id: FilterId, enabled: boolean) => void;
    toggleFilter: (id: FilterId) => void;

    setBlockedCompanies: (companies: string[]) => void;
    setExcludedKeywords: (keywords: string[]) => void;

    setPostedWithin: (value: number | null) => void;
    setDefaultToMostRecent: (value: boolean) => void;

    setFilterCounts: (counts: Partial<Record<FilterId, number>>) => void;
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
  defaultToMostRecent: false,
};

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      settings: defaultSettings,
      toggledFilters: {
        ...defaultSettings.enabledFilters,
      },
      filterCounts: {},
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
            toggledFilters: {
              ...s.toggledFilters,
              [id]: enabled,
            },
          })),
        toggleFilter: (id) =>
          set((s) => ({
            toggledFilters: {
              ...s.toggledFilters,
              [id]: !s.toggledFilters[id],
            },
          })),

        setBlockedCompanies: (blockedCompanies) =>
          set((s) => ({ settings: { ...s.settings, blockedCompanies } })),
        setExcludedKeywords: (excludedKeywords) =>
          set((s) => ({ settings: { ...s.settings, excludedKeywords } })),

        setPostedWithin: (postedWithin) =>
          set((s) => ({ settings: { ...s.settings, postedWithin } })),
        setDefaultToMostRecent: (defaultToMostRecent) =>
          set((s) => ({ settings: { ...s.settings, defaultToMostRecent } })),

        setFilterCounts: (counts) =>
          set((s) => ({ filterCounts: { ...s.filterCounts, ...counts } })),
      },
    }),
    {
      name: 'jobzap',
      partialize: (state) => ({
        settings: state.settings,
        toggledFilters: state.toggledFilters,
      }),
      storage: createJSONStorage(() => wxtStorage),
    },
  ),
);

export const useSettings = () => useAppStore(useShallow((s) => s.settings));
export const useEnabledFilters = () =>
  useAppStore(useShallow((s) => s.settings.enabledFilters));
export const useToggledFilters = () =>
  useAppStore(useShallow((s) => s.toggledFilters));
export const useFilterCounts = () =>
  useAppStore(useShallow((s) => s.filterCounts));
export const useActions = () => useAppStore((s) => s.actions);
