import { ipcMain } from 'electron';
import { getDb } from '../db/database';
import type { AppSettings } from '../../renderer/types';

const DEFAULT_SETTINGS: AppSettings = {
  activeProvider: 'codex',
};

export function registerSettingsIpc(): void {
  ipcMain.handle('settings:get', () => {
    const db = getDb();
    const rows = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[];

    const settings: AppSettings = { ...DEFAULT_SETTINGS };
    for (const row of rows) {
      if (row.key === 'activeProvider') {
        settings.activeProvider = 'codex';
      }
    }

    return settings;
  });

  ipcMain.handle('settings:save', (_event, settings: AppSettings) => {
    const db = getDb();
    const upsert = db.prepare(
      'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
    );

    upsert.run('activeProvider', settings.activeProvider);
  });
}
