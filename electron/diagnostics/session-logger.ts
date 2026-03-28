import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { app } from 'electron';

interface LogEntry {
  timestamp: string;
  event: string;
  data?: unknown;
}

export interface ExportedLog {
  path: string;
}

async function createUniqueFilePath(filePath: string) {
  const parsed = path.parse(filePath);

  for (let attempt = 0; attempt < 100; attempt += 1) {
    const suffix = attempt === 0 ? '' : `-${attempt}`;
    const candidate = path.join(parsed.dir, `${parsed.name}${suffix}${parsed.ext}`);

    try {
      await fs.access(candidate);
    } catch {
      return candidate;
    }
  }

  throw new Error('Unable to create a unique export path for the diagnostics log.');
}

export class SessionLogger {
  private readonly sessionId = new Date().toISOString().replace(/[:.]/g, '-');
  private logFilePath: string | null = null;
  private writeChain = Promise.resolve();

  async initialize() {
    const logDirectory = path.join(app.getPath('userData'), 'diagnostics');
    await fs.mkdir(logDirectory, { recursive: true });

    this.logFilePath = path.join(
      logDirectory,
      `freedrive-jumping-${this.sessionId}.jsonl`,
    );

    await fs.writeFile(this.logFilePath, '', 'utf8');
    this.log('session.started', {
      logFilePath: this.logFilePath,
      platform: process.platform,
      versions: {
        chrome: process.versions.chrome,
        electron: process.versions.electron,
        node: process.versions.node,
      },
      host: {
        arch: process.arch,
        cpuCount: os.cpus().length,
        totalMemoryBytes: os.totalmem(),
      },
    });
  }

  log(event: string, data?: unknown) {
    if (!this.logFilePath) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      event,
      data,
    };

    const line = `${JSON.stringify(entry)}\n`;
    this.writeChain = this.writeChain
      .then(() => fs.appendFile(this.logFilePath!, line, 'utf8'))
      .catch((error) => {
        console.error('Failed to write diagnostics log entry.', error);
      });
  }

  async exportCurrentLog(): Promise<ExportedLog> {
    if (!this.logFilePath) {
      throw new Error('Diagnostics logger is not initialized yet.');
    }

    await this.writeChain;

    const downloadsDirectory = app.getPath('downloads');
    const exportPath = await createUniqueFilePath(
      path.join(downloadsDirectory, path.basename(this.logFilePath)),
    );

    await fs.copyFile(this.logFilePath, exportPath);

    this.log('session.exported', {
      exportPath,
    });

    return {
      path: exportPath,
    };
  }

  async shutdown() {
    if (!this.logFilePath) {
      return;
    }

    this.log('session.ended');
    await this.writeChain;
  }
}
