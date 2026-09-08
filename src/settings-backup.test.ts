import { describe, expect, it } from 'vitest';
import {
  createSettingsBackup,
  InvalidSettingsBackupError,
  parseSettingsBackup,
} from './settings-backup';
import {
  type PersistedSettingsState,
  SETTINGS_SCHEMA_VERSION,
} from './settings-schema';

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
  it('preserves settings through export and import', () => {
    const backup = createSettingsBackup(state);

    expect(backup).toEqual({
      state,
      version: SETTINGS_SCHEMA_VERSION,
    });
    expect(parseSettingsBackup(JSON.stringify(backup))).toEqual(state);
  });

  it('imports a legacy settings backup', () => {
    const legacyBackup = {
      state: {
        ...state,
        settings: {
          ...state.settings,
          postedWithin: 180,
        },
      },
      version: 0,
    };

    expect(parseSettingsBackup(JSON.stringify(legacyBackup))).toEqual(state);
  });

  it('rejects invalid backup files', () => {
    expect(() => parseSettingsBackup('{')).toThrow(InvalidSettingsBackupError);
    expect(() => parseSettingsBackup('{"blockedCompanies":[]}')).toThrow(
      InvalidSettingsBackupError,
    );
  });

  it('rejects malformed setting values', () => {
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

  it('rejects backups from future schema versions', () => {
    const backup = {
      ...createSettingsBackup(state),
      version: SETTINGS_SCHEMA_VERSION + 1,
    };

    expect(() => parseSettingsBackup(JSON.stringify(backup))).toThrow(
      InvalidSettingsBackupError,
    );
  });

  it.for([
    'blockedCompanies',
    'excludedKeywords',
    'descriptionKeywords',
  ] as const)(
    'normalizes and deduplicates imported %s, preserving first spelling and order',
    (field) => {
      const backup = {
        version: SETTINGS_SCHEMA_VERSION,
        state: {
          ...state,
          settings: {
            ...state.settings,
            [field]: [
              '  Acme   Corp ',
              'acme corp',
              'Beta',
              'Beta',
              'ACME CORP',
            ],
          },
        },
      };
      expect(
        parseSettingsBackup(JSON.stringify(backup)).settings[field],
      ).toEqual(['Acme Corp', 'Beta']);
    },
  );
});
