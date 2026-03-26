import { useEffect, useState } from 'react';

const keyMap: Record<string, DroneDriveCommand> = {
  w: 'forward',
  s: 'backward',
  a: 'left',
  d: 'right',
};

const activeInputLabels: Record<DroneDriveCommand, string> = {
  forward: '"W"',
  backward: '"S"',
  left: '"A"',
  right: '"D"',
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

  const batteryLabel = status.battery === null ? 'Unknown' : `${status.battery}%`;
  const currentInput = status.activeCommand
    ? activeInputLabels[status.activeCommand]
    : 'None';
  const lastError = actionMessage ?? status.lastError ?? 'None';

  return (
    <main>
      <section className="status-view">
        <p>Connected: {status.connected ? 'Yes' : 'No'}</p>
        <p>Battery: {batteryLabel}</p>
        <p>Current input: {currentInput}</p>
        <p>Drive mode: Hold key to keep moving</p>
        <p className="status-gap" />
        <p>Last error: {lastError}</p>
      </section>

      <section className="controls">
        <button
          disabled={status.phase === 'connecting' || status.connected}
          onClick={() => void runAction(() => droneApi!.connect())}
          type="button"
        >
          Connect
        </button>
        <button
          disabled={!status.connected && status.phase !== 'error'}
          onClick={() => void runAction(() => droneApi!.disconnect())}
          type="button"
        >
          Disconnect
        </button>
        <button
          disabled={!status.connected}
          onClick={() => void runAction(() => droneApi!.stop())}
          type="button"
        >
          Stop
        </button>
      </section>
    </main>
  );
}

export default App;
