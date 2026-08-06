import {
  createSettingsBackup,
  InvalidSettingsBackupError,
  parseSettingsBackup,
} from './settings-backup';
import {
  type PersistedSettingsState,
  SETTINGS_SCHEMA_VERSION,
} from './settings-schema';
import { describe, expect, it } from 'vitest';

const state: PersistedSettingsState = {
  settings: {
    enabledFilters: {
      promoted: false,
      viewed: true,
      dismissed: false,
      applied: true,
      companies: true,
      keywords: true,
    },
    blockedCompanies: ['Acme', 'Example GmbH'],
    excludedKeywords: ['Intern', 'Junior'],
    descriptionKeywords: ['TypeScript', 'remote-first'],
    postedWithin: 180,
    defaultToRecentSort: true,
  },
  activeFilters: {
    promoted: false,
    viewed: false,
    dismissed: false,
    applied: true,
    companies: true,
    keywords: true,
  },
};

describe('settings backups', () => {
  it('round-trips the complete persisted state and its schema version', () => {
    const backup = createSettingsBackup(state);

    expect(backup).toEqual({
      state,
      version: SETTINGS_SCHEMA_VERSION,
    });
    expect(parseSettingsBackup(JSON.stringify(backup))).toEqual(state);
  });

  it('strips stale fields left by older settings schemas', () => {
    const staleState = {
      ...state,
      settings: {
        ...state.settings,
        removedSetting: ['legacy value'],
      },
    };

    const backup = createSettingsBackup(staleState);

    expect(backup.state).toEqual(state);
    expect(
      parseSettingsBackup(
        JSON.stringify({
          state: staleState,
          version: SETTINGS_SCHEMA_VERSION,
        }),
      ),
    ).toEqual(state);
  });

  it('rejects invalid JSON and unrelated JSON files', () => {
    expect(() => parseSettingsBackup('{')).toThrow(InvalidSettingsBackupError);
    expect(() => parseSettingsBackup('{"blockedCompanies":[]}')).toThrow(
      InvalidSettingsBackupError,
    );
  });

  it('rejects malformed values before they reach the settings store', () => {
    const backup = {
      ...createSettingsBackup(state),
      state: {
        ...state,
        settings: {
          ...state.settings,
          enabledFilters: {
            ...state.settings.enabledFilters,
            promoted: 'yes',
          },
        },
      },
    };

    expect(() => parseSettingsBackup(JSON.stringify(backup))).toThrow(
      InvalidSettingsBackupError,
    );
  });

  it('rejects active filters that are not enabled', () => {
    const backup = {
      ...createSettingsBackup(state),
      state: {
        ...state,
        settings: {
          ...state.settings,
          enabledFilters: {
            ...state.settings.enabledFilters,
            companies: false,
          },
        },
        activeFilters: {
          ...state.activeFilters,
          companies: true,
        },
      },
    };

    expect(() => parseSettingsBackup(JSON.stringify(backup))).toThrow(
      InvalidSettingsBackupError,
    );
  });

  it('rejects backups with an unsupported newer schema version', () => {
    const backup = {
      ...createSettingsBackup(state),
      version: SETTINGS_SCHEMA_VERSION + 1,
    };

    expect(() => parseSettingsBackup(JSON.stringify(backup))).toThrow(
      InvalidSettingsBackupError,
    );
  });
});
