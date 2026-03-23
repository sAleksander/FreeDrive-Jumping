import { useEffect, useState } from 'react';

const checks = [
  'Join the drone Wi-Fi on this Mac',
  'Click connect and wait for ready state',
  'Confirm a battery or posture event appears',
  'Use stop before moving on to driving work',
];

const initialStatus: DroneStatus = {
  phase: 'idle',
  connected: false,
  battery: null,
  posture: null,
  lastEvent: null,
  lastError: null,
  updatedAt: null,
};

function App() {
  const runtime = window.electronAPI;
  const [status, setStatus] = useState<DroneStatus>(initialStatus);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!runtime?.drone) {
      return;
    }

    void runtime.drone.getStatus().then(setStatus);
    const unsubscribe = runtime.drone.onStatus(setStatus);

    return unsubscribe;
  }, [runtime]);

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
          This build only proves the desktop app can discover a Jumping drone,
          receive status events, and send a safe stop command through the
          Electron backend.
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
            onClick={() => void runAction(() => runtime!.drone.connect())}
            type="button"
          >
            {status.phase === 'connecting' ? 'Connecting...' : 'Connect'}
          </button>
          <button
            className="secondary-button"
            disabled={!status.connected && status.phase !== 'error'}
            onClick={() => void runAction(() => runtime!.drone.disconnect())}
            type="button"
          >
            Disconnect
          </button>
          <button
            className="danger-button"
            disabled={!status.connected}
            onClick={() => void runAction(() => runtime!.drone.stop())}
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

        <p className="hint">
          The next milestone after this spike is keyboard driving through the
          same backend bridge. Video comes later.
        </p>
      </section>
    </main>
  );
}

export default App;
