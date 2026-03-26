import { useEffect, useRef, useState } from 'react';

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

function createIdleDriveState(): DroneDriveState {
  return {
    forward: false,
    backward: false,
    left: false,
    right: false,
  };
}

function toDriveState(heldCommands: Set<DroneDriveCommand>): DroneDriveState {
  return {
    forward: heldCommands.has('forward'),
    backward: heldCommands.has('backward'),
    left: heldCommands.has('left'),
    right: heldCommands.has('right'),
  };
}

const initialStatus: DroneStatus = {
  phase: 'idle',
  connected: false,
  battery: null,
  posture: null,
  activeCommands: [],
  lastEvent: null,
  lastError: null,
  updatedAt: null,
};

function App() {
  const runtime = window.electronAPI;
  const droneApi = runtime?.drone;
  const [status, setStatus] = useState<DroneStatus>(initialStatus);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const heldCommandsRef = useRef<Set<DroneDriveCommand>>(new Set());

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

    const syncDriveState = () =>
      runAction(() => droneApi.setDriveState(toDriveState(heldCommandsRef.current)));

    const handleKeyDown = (event: KeyboardEvent) => {
      const command = keyMap[event.key.toLowerCase()];

      if (!command) {
        return;
      }

      if (heldCommandsRef.current.has(command)) {
        event.preventDefault();
        return;
      }

      event.preventDefault();
      heldCommandsRef.current.add(command);
      void syncDriveState();
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const command = keyMap[event.key.toLowerCase()];

      if (!command) {
        return;
      }

      event.preventDefault();
      heldCommandsRef.current.delete(command);
      void syncDriveState();
    };

    const handleVisibilityOrBlur = () => {
      heldCommandsRef.current.clear();
      void runAction(() => droneApi.setDriveState(createIdleDriveState()));
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
      heldCommandsRef.current.clear();
      void droneApi.setDriveState(createIdleDriveState());
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
  const currentInput = status.activeCommands.length > 0
    ? status.activeCommands.map((command) => activeInputLabels[command]).join(' + ')
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
