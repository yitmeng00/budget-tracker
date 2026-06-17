import { useState } from 'react';
import type { UserSettings } from '../types/index.ts';
import { DEFAULT_SETTINGS } from '../lib/settings.ts';

export function useSettings() {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);

  function update(patch: Partial<UserSettings>) {
    setSettings((prev) => ({ ...prev, ...patch }));
  }

  return { settings, update };
}
