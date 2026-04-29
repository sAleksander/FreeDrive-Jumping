import fs from 'node:fs/promises';
import path from 'node:path';

export interface AppSettings {
  armOnStartup: 0 | 1;
  virtualDrone: 0 | 1;
  sneakSpeed: number;
  regularSpeed: number;
  runSpeed: number;
}

const defaultSettings: AppSettings = {
  armOnStartup: 1,
  virtualDrone: 0,
  sneakSpeed: 10,
  regularSpeed: 40,
  runSpeed: 80,
};

function clampSpeed(v: unknown, fallback: number): number {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(100, Math.round(n / 5) * 5));
}

function normalizeSettings(value: unknown): AppSettings {
  if (!value || typeof value !== 'object') {
    return { ...defaultSettings };
  }

  const raw = value as Record<string, unknown>;
  const armOnStartup = raw.armOnStartup === 0 ? 0 : 1;
  const virtualDrone = raw.virtualDrone === 1 ? 1 : 0;

  return {
    armOnStartup,
    virtualDrone,
    sneakSpeed: clampSpeed(raw.sneakSpeed, defaultSettings.sneakSpeed),
    regularSpeed: clampSpeed(raw.regularSpeed, defaultSettings.regularSpeed),
    runSpeed: clampSpeed(raw.runSpeed, defaultSettings.runSpeed),
  };
}

export class AppSettingsStore {
  private settings: AppSettings = { ...defaultSettings };

  constructor(
    private readonly filePath = path.join(process.cwd(), 'settings.json'),
  ) {}

  async initialize() {
    try {
      const rawSettings = await fs.readFile(this.filePath, 'utf8');
      this.settings = normalizeSettings(JSON.parse(rawSettings));
    } catch {
      this.settings = { ...defaultSettings };
    }

    await this.persist();
  }

  getSettings(): AppSettings {
    return { ...this.settings };
  }

  async updateSettings(patch: Partial<AppSettings>): Promise<AppSettings> {
    this.settings = normalizeSettings({
      ...this.settings,
      ...patch,
    });
    await this.persist();
    return this.getSettings();
  }

  private async persist() {
    await fs.writeFile(
      this.filePath,
      `${JSON.stringify(this.settings, null, 2)}\n`,
      'utf8',
    );
  }
}
