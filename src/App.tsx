import { useEffect, useState } from 'react';

const checks = [
  'Join the drone Wi-Fi on this Mac',
  'Click connect and wait for ready state',
  'Confirm a battery or posture event appears',
  'Press W/A/S/D to drive and release the key to stop',
];

const keyMap: Record<string, DroneDriveCommand> = {
  w: 'forward',
  s: 'backward',
  a: 'left',
  d: 'right',
};

const initialStatus: DroneStatus = {
  phase: 'idle',
  connected: false,
  battery: null,
  posture: null,
  activeCommand: null,
  lastEvent: null,
  lastError: null,
  updatedAt: null,
};

function App() {
  const runtime = window.electronAPI;
  const droneApi = runtime?.drone;
  const [status, setStatus] = useState<DroneStatus>(initialStatus);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!droneApi) {
      return;
    }

    void droneApi.getStatus().then(setStatus);
    const unsubscribe = droneApi.onStatus(setStatus);

    return unsubscribe;
  }, [droneApi]);

  useEffect(() => {
    if (!droneApi || !status.connected) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      const command = keyMap[event.key.toLowerCase()];

      if (!command || event.repeat) {
        return;
      }

      event.preventDefault();
      void runAction(() => droneApi.drive(command));
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const command = keyMap[event.key.toLowerCase()];

      if (!command) {
        return;
      }

      event.preventDefault();
      void runAction(() => droneApi.stop());
    };

    const handleVisibilityOrBlur = () => {
      void runAction(() => droneApi.stop());
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleVisibilityOrBlur);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        handleVisibilityOrBlur();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleVisibilityOrBlur);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      void droneApi.stop();
    };
  }, [droneApi, status.connected]);

  async function runAction(action: () => Promise<DroneStatus>) {
    try {
      const nextStatus = await action();
      setStatus(nextStatus);
      setActionMessage(null);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unexpected drone action error.';
      setActionMessage(message);
    }
  }

  const statusTone = `phase-${status.phase}`;

  return (
    <main className="app-shell">
      <section className="hero-card">
        <p className="eyebrow">Connectivity Spike</p>
        <h1>FreeDrive Jumping</h1>
        <p className="intro">
          The app can now discover the drone, receive live state, and send
          fixed-speed keyboard drive commands through the Electron backend.
        </p>

        <div className="runtime-grid">
          <article>
            <span className="label">Platform</span>
            <strong>{runtime?.platform ?? 'browser preview'}</strong>
          </article>
          <article>
            <span className="label">Electron</span>
            <strong>{runtime?.versions.electron ?? 'not loaded'}</strong>
          </article>
          <article>
            <span className="label">Node</span>
            <strong>{runtime?.versions.node ?? 'not loaded'}</strong>
          </article>
          <article>
            <span className="label">Chrome</span>
            <strong>{runtime?.versions.chrome ?? 'not loaded'}</strong>
          </article>
        </div>

        <div className="action-row">
          <button
            className="primary-button"
            disabled={status.phase === 'connecting' || status.connected}
            onClick={() => void runAction(() => droneApi!.connect())}
            type="button"
          >
            {status.phase === 'connecting' ? 'Connecting...' : 'Connect'}
          </button>
          <button
            className="secondary-button"
            disabled={!status.connected && status.phase !== 'error'}
            onClick={() => void runAction(() => droneApi!.disconnect())}
            type="button"
          >
            Disconnect
          </button>
          <button
            className="danger-button"
            disabled={!status.connected}
            onClick={() => void runAction(() => droneApi!.stop())}
            type="button"
          >
            Stop
          </button>
        </div>
      </section>

      <section className="status-card">
        <h2>Drone Status</h2>
        <div className={`status-pill ${statusTone}`}>
          <span className="label">Phase</span>
          <strong>{status.phase}</strong>
        </div>

        <dl className="status-grid">
          <div>
            <dt>Connected</dt>
            <dd>{status.connected ? 'Yes' : 'No'}</dd>
          </div>
          <div>
            <dt>Battery</dt>
            <dd>{status.battery === null ? 'Waiting' : `${status.battery}%`}</dd>
          </div>
          <div>
            <dt>Posture</dt>
            <dd>{status.posture ?? 'Unknown'}</dd>
          </div>
          <div>
            <dt>Drive</dt>
            <dd>{status.activeCommand ?? 'Stopped'}</dd>
          </div>
          <div>
            <dt>Last update</dt>
            <dd>
              {status.updatedAt
                ? new Date(status.updatedAt).toLocaleTimeString()
                : 'None'}
            </dd>
          </div>
        </dl>

        <p className="message-line">
          <strong>Last event:</strong> {status.lastEvent ?? 'No events yet'}
        </p>
        <p className="message-line error-line">
          <strong>Last error:</strong> {actionMessage ?? status.lastError ?? 'None'}
        </p>

        <h2>Connectivity Checklist</h2>
        <ul className="checklist">
          {checks.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>

        <div className="keys-card">
          <span className="label">Keyboard</span>
          <div className="keys-grid">
            <kbd>W</kbd>
            <kbd>A</kbd>
            <kbd>S</kbd>
            <kbd>D</kbd>
          </div>
          <p className="hint">
            Release the key to stop. Switching tabs or blurring the window also
            sends stop automatically.
          </p>
        </div>

        <p className="hint">
          This first driving mode is intentionally conservative: one direction
          at a time, fixed speed, and explicit stop behavior.
        </p>
      </section>
    </main>
  );
}

export default App;
