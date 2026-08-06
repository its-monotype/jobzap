import {
  migrateSettingsState,
  parsePersistedSettingsState,
  type PersistedSettingsState,
  SETTINGS_SCHEMA_VERSION,
  UnsupportedSettingsVersionError,
} from './settings-schema';
import { z } from 'zod';

export class InvalidSettingsBackupError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidSettingsBackupError';
  }
}

const settingsBackupSchema = z.strictObject({
  state: z.unknown(),
  version: z.int().nonnegative(),
});

export function createSettingsBackup(state: PersistedSettingsState) {
  return {
    state: parsePersistedSettingsState(state),
    version: SETTINGS_SCHEMA_VERSION,
  };
}

export function parseSettingsBackup(text: string): PersistedSettingsState {
  let parsed: unknown;

  try {
    parsed = JSON.parse(text);
  } catch {
    throw new InvalidSettingsBackupError('This file is not valid JSON.');
  }

  const result = settingsBackupSchema.safeParse(parsed);

  if (!result.success) {
    throw new InvalidSettingsBackupError(
      'This file does not contain valid JobZap settings.',
    );
  }

  try {
    return migrateSettingsState(result.data.state, result.data.version);
  } catch (error) {
    if (error instanceof UnsupportedSettingsVersionError) {
      throw new InvalidSettingsBackupError(
        `Backup version ${error.version} is not supported.`,
      );
    }

    if (error instanceof z.ZodError) {
      throw new InvalidSettingsBackupError(
        'This file does not contain valid JobZap settings.',
      );
    }

    throw error;
  }
}
