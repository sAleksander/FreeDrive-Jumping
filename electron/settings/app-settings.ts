import fs from 'node:fs/promises';
import path from 'node:path';

export interface AppSettings {
  armOnStartup: 0 | 1;
}

const defaultSettings: AppSettings = {
  armOnStartup: 1,
};

function normalizeSettings(value: unknown): AppSettings {
  if (!value || typeof value !== 'object') {
    return { ...defaultSettings };
  }

  const armOnStartup = 'armOnStartup' in value && value.armOnStartup === 0
    ? 0
    : 1;

  return {
    armOnStartup,
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
