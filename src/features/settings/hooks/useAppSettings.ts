import { useCallback, useEffect, useState } from 'react';

const defaultSettings: AppSettings = {
  armOnStartup: 1,
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

  const setSneakSpeed = useCallback(async (v: number) => {
    if (!settingsApi) return;
    setSaving(true);
    try {
      setSettings(await settingsApi.update({ sneakSpeed: v }));
    } finally {
      setSaving(false);
    }
  }, [settingsApi]);

  const setRegularSpeed = useCallback(async (v: number) => {
    if (!settingsApi) return;
    setSaving(true);
    try {
      setSettings(await settingsApi.update({ regularSpeed: v }));
    } finally {
      setSaving(false);
    }
  }, [settingsApi]);

  const setRunSpeed = useCallback(async (v: number) => {
    if (!settingsApi) return;
    setSaving(true);
    try {
      setSettings(await settingsApi.update({ runSpeed: v }));
    } finally {
      setSaving(false);
    }
  }, [settingsApi]);

  return {
    loading,
    saving,
    settings,
    setArmOnStartup,
    setSneakSpeed,
    setRegularSpeed,
    setRunSpeed,
  };
}
