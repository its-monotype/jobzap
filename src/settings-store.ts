import { storage } from '#imports';
import { create } from 'zustand';
import {
  createJSONStorage,
  persist,
  type StateStorage,
} from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import type { FilterId } from './constants';
import { normalizeText } from './lib/utils';

export function isCompanyBlocked(
  companyName: string,
  blockedCompanies: readonly string[],
): boolean {
  const company = normalizeText(companyName).toLowerCase();

  return blockedCompanies.some((blockedCompany) => {
    const blocked = normalizeText(blockedCompany).toLowerCase();
    return blocked.length > 0 && company.includes(blocked);
  });
}

interface Settings {
  enabledFilters: Record<FilterId, boolean>;
  blockedCompanies: string[];
  excludedKeywords: string[];
  descriptionKeywords: string[];
  postedWithin: number | null;
  defaultToRecentSort: boolean;
}

interface SettingsStore {
  settings: Settings;
  activeFilters: Record<FilterId, boolean>;
  actions: {
    setFilterEnabled: (id: FilterId, enabled: boolean) => void;
    setFilterActive: (id: FilterId, active: boolean) => void;
    toggleFilterActive: (id: FilterId) => void;

    setBlockedCompanies: (companies: string[]) => void;
    blockCompany: (company: string) => void;
    unblockCompany: (company: string) => void;
    setExcludedKeywords: (keywords: string[]) => void;
    setDescriptionKeywords: (keywords: string[]) => void;

    setPostedWithin: (value: number | null) => void;
    setDefaultToRecentSort: (value: boolean) => void;
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
  descriptionKeywords: [],
  postedWithin: null,
  defaultToRecentSort: false,
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      settings: defaultSettings,
      activeFilters: {
        ...defaultSettings.enabledFilters,
      },
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
        blockCompany: (company) => {
          const name = normalizeText(company);
          if (!name) return;

          set((s) => ({
            settings: {
              ...s.settings,
              enabledFilters: {
                ...s.settings.enabledFilters,
                companies: true,
              },
              blockedCompanies: isCompanyBlocked(
                name,
                s.settings.blockedCompanies,
              )
                ? s.settings.blockedCompanies
                : [...s.settings.blockedCompanies, name],
            },
            activeFilters: {
              ...s.activeFilters,
              companies: true,
            },
          }));
        },
        unblockCompany: (company) => {
          const name = normalizeText(company).toLowerCase();
          if (!name) return;

          set((s) => ({
            settings: {
              ...s.settings,
              blockedCompanies: s.settings.blockedCompanies.filter(
                (blockedCompany) => {
                  const blocked = normalizeText(blockedCompany).toLowerCase();
                  return !blocked || !name.includes(blocked);
                },
              ),
            },
          }));
        },
        setExcludedKeywords: (excludedKeywords) =>
          set((s) => ({ settings: { ...s.settings, excludedKeywords } })),
        setDescriptionKeywords: (descriptionKeywords) =>
          set((s) => ({ settings: { ...s.settings, descriptionKeywords } })),

        setPostedWithin: (postedWithin) =>
          set((s) => ({ settings: { ...s.settings, postedWithin } })),
        setDefaultToRecentSort: (defaultToRecentSort) =>
          set((s) => ({ settings: { ...s.settings, defaultToRecentSort } })),
      },
    }),
    {
      name: 'jobzap',
      partialize: (state) => ({
        settings: state.settings,
        activeFilters: state.activeFilters,
      }),
      merge: (persistedState, currentState) => {
        const persisted = (persistedState ?? {}) as Partial<
          Pick<SettingsStore, 'settings' | 'activeFilters'>
        >;

        return {
          ...currentState,
          settings: {
            ...currentState.settings,
            ...persisted.settings,
            enabledFilters: {
              ...currentState.settings.enabledFilters,
              ...persisted.settings?.enabledFilters,
            },
          },
          activeFilters: {
            ...currentState.activeFilters,
            ...persisted.activeFilters,
          },
        };
      },
      storage: createJSONStorage(() => wxtStorage),
    },
  ),
);

storage.watch<string>('sync:jobzap', () => {
  void useSettingsStore.persist.rehydrate();
});

export const useActions = () => useSettingsStore((s) => s.actions);
export const useSettings = () =>
  useSettingsStore(useShallow((s) => s.settings));
export const useEnabledFilters = () =>
  useSettingsStore(useShallow((s) => s.settings.enabledFilters));
export const useActiveFilters = () =>
  useSettingsStore(useShallow((s) => s.activeFilters));
