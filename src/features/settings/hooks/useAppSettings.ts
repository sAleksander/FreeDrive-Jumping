import { useCallback, useEffect, useState } from 'react';

const defaultSettings: AppSettings = {
  armOnStartup: 1,
  virtualDrone: 0,
  sneakSpeed: 10,
  regularSpeed: 40,
  runSpeed: 80,
};

export function useAppSettings() {
  const settingsApi = window.electronAPI?.settings;
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!settingsApi) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    void settingsApi.get().then((nextSettings) => {
      if (cancelled) {
        return;
      }

      setSettings(nextSettings);
      setLoading(false);
    }).catch(() => {
      if (!cancelled) {
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [settingsApi]);

  const updateSetting = useCallback(async (patch: Partial<AppSettings>) => {
    if (!settingsApi) {
      return;
    }

    setSaving(true);

    try {
      setSettings(await settingsApi.update(patch));
    } finally {
      setSaving(false);
    }
  }, [settingsApi]);

  return {
    loading,
    saving,
    settings,
    updateSetting,
  };
}
