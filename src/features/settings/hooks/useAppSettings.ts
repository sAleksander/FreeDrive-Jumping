import { useCallback, useEffect, useState } from 'react';

const defaultSettings: AppSettings = {
  armOnStartup: 1,
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

  const setArmOnStartup = useCallback(async (enabled: boolean) => {
    if (!settingsApi) {
      return;
    }

    setSaving(true);

    try {
      const nextSettings = await settingsApi.update({
        armOnStartup: enabled ? 1 : 0,
      });
      setSettings(nextSettings);
    } finally {
      setSaving(false);
    }
  }, [settingsApi]);

  return {
    loading,
    saving,
    settings,
    setArmOnStartup,
  };
}
