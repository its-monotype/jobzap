import type { FilterId } from './constants';
import { z } from 'zod';

export const SETTINGS_SCHEMA_VERSION = 0;

export interface Settings {
  enabledFilters: Record<FilterId, boolean>;
  blockedCompanies: string[];
  excludedKeywords: string[];
  descriptionKeywords: string[];
  postedWithin: number | null;
  defaultToRecentSort: boolean;
}

export interface PersistedSettingsState {
  settings: Settings;
  activeFilters: Record<FilterId, boolean>;
}

export class UnsupportedSettingsVersionError extends Error {
  readonly version: number;

  constructor(version: number) {
    super(`Settings schema version ${version} is not supported.`);
    this.name = 'UnsupportedSettingsVersionError';
    this.version = version;
  }
}

const filterStateSchema: z.ZodType<Record<FilterId, boolean>> = z.object({
  promoted: z.boolean(),
  viewed: z.boolean(),
  dismissed: z.boolean(),
  applied: z.boolean(),
  companies: z.boolean(),
  keywords: z.boolean(),
});

const tagSchema = z.string().refine((value) => value.trim().length > 0);

const settingsSchema: z.ZodType<Settings> = z.object({
  enabledFilters: filterStateSchema,
  blockedCompanies: z.array(tagSchema),
  excludedKeywords: z.array(tagSchema),
  descriptionKeywords: z.array(tagSchema),
  postedWithin: z.int().positive().nullable(),
  defaultToRecentSort: z.boolean(),
});

const persistedSettingsStateSchema: z.ZodType<PersistedSettingsState> = z
  .object({
    settings: settingsSchema,
    activeFilters: filterStateSchema,
  })
  .refine(
    ({ settings, activeFilters }) =>
      Object.entries(activeFilters).every(
        ([id, active]) => !active || settings.enabledFilters[id as FilterId],
      ),
    { message: 'Active filters must also be enabled.' },
  );

export function parsePersistedSettingsState(
  state: unknown,
): PersistedSettingsState {
  return persistedSettingsStateSchema.parse(state);
}

export function migrateSettingsState(
  state: unknown,
  version: number,
): PersistedSettingsState {
  if (version !== SETTINGS_SCHEMA_VERSION) {
    throw new UnsupportedSettingsVersionError(version);
  }

  return parsePersistedSettingsState(state);
}
