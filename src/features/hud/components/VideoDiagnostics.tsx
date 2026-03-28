import { useState } from 'react';
import type { VideoDiagnostics as VideoDiagnosticsData } from '../../video/hooks/useDroneVideo';
import styles from './VideoDiagnostics.module.css';

interface VideoDiagnosticsProps {
  diagnostics: VideoDiagnosticsData;
}

function formatLastFrameAge(lastFrameAgeMs: number | null) {
  if (lastFrameAgeMs === null) {
    return '--';
  }

  return `${Math.round(lastFrameAgeMs)} ms`;
}

export function VideoDiagnostics({
  diagnostics,
}: VideoDiagnosticsProps) {
  const diagnosticsApi = window.electronAPI?.diagnostics;
  const [exportState, setExportState] = useState<string>('Idle');

  const handleExportLog = async () => {
    if (!diagnosticsApi) {
      setExportState('Unavailable');
      return;
    }

    setExportState('Exporting...');

    try {
      const exportedLog = await diagnosticsApi.exportLog();
      const fileName =
        exportedLog.path.split('/')[exportedLog.path.split('/').length - 1] ??
        exportedLog.path;
      setExportState(`Saved ${fileName}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Export failed';
      setExportState(message);
    }
  };

  return (
    <section className={styles.panel}>
      <div className={styles.header}>
        <p className={styles.eyebrow}>Video</p>
        <button
          className={styles.exportButton}
          onClick={() => void handleExportLog()}
          type="button"
        >
          Export log
        </button>
      </div>
      <dl className={styles.grid}>
        <div>
          <dt>State</dt>
          <dd>{diagnostics.streamState}</dd>
        </div>
        <div>
          <dt>RX FPS</dt>
          <dd>{diagnostics.sourceFps}</dd>
        </div>
        <div>
          <dt>IPC FPS</dt>
          <dd>{diagnostics.deliveredFps}</dd>
        </div>
        <div>
          <dt>Draw FPS</dt>
          <dd>{diagnostics.renderedFps}</dd>
        </div>
        <div>
          <dt>Restarts</dt>
          <dd>{diagnostics.restartCount}</dd>
        </div>
        <div>
          <dt>Last Frame</dt>
          <dd>{formatLastFrameAge(diagnostics.lastFrameAgeMs)}</dd>
        </div>
      </dl>
      <p className={styles.exportState}>{exportState}</p>
    </section>
  );
}
