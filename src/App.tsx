import { useEffect, useRef, useState } from 'react';

const keyMap: Record<string, DroneDriveCommand> = {
  w: 'forward',
  s: 'backward',
  a: 'left',
  d: 'right',
};

const noiseFrameIntervalMs = 90;
const noiseScaleDivisor = 4;

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
  const heldCommandsRef = useRef<Set<DroneDriveCommand>>(new Set());
  const noiseCanvasRef = useRef<HTMLCanvasElement | null>(null);

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

  const hasVideoFeed = false;
  const shouldShowNoiseCanvas = !status.connected || !hasVideoFeed;

  useEffect(() => {
    const canvas = noiseCanvasRef.current;

    if (!canvas || !shouldShowNoiseCanvas) {
      return;
    }

    const context = canvas.getContext('2d', { alpha: false });

    if (!context) {
      return;
    }

    let frameId = 0;
    let timeoutId: number | null = null;
    let imageData = context.createImageData(1, 1);

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      const sourceWidth = parent?.clientWidth ?? window.innerWidth;
      const sourceHeight = parent?.clientHeight ?? window.innerHeight;
      const width = Math.max(240, Math.floor(sourceWidth / noiseScaleDivisor));
      const height = Math.max(135, Math.floor(sourceHeight / noiseScaleDivisor));

      canvas.width = width;
      canvas.height = height;
      imageData = context.createImageData(width, height);
    };

    const renderNoise = () => {
      const { data } = imageData;

      for (let index = 0; index < data.length; index += 4) {
        const value = Math.random() > 0.985
          ? 255
          : Math.max(0, Math.min(255, 96 + Math.floor((Math.random() - 0.5) * 180)));

        data[index] = value;
        data[index + 1] = value;
        data[index + 2] = value;
        data[index + 3] = 255;
      }

      context.putImageData(imageData, 0, 0);
      context.fillStyle = 'rgba(255, 255, 255, 0.16)';

      const glitchBandCount = 2 + Math.floor(Math.random() * 4);

      for (let bandIndex = 0; bandIndex < glitchBandCount; bandIndex += 1) {
        const bandY = Math.floor(Math.random() * canvas.height);
        const bandHeight = 1 + Math.floor(Math.random() * 4);

        context.fillRect(0, bandY, canvas.width, bandHeight);
      }

      timeoutId = window.setTimeout(() => {
        frameId = window.requestAnimationFrame(renderNoise);
      }, noiseFrameIntervalMs);
    };

    resizeCanvas();
    renderNoise();
    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);

      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }

      window.cancelAnimationFrame(frameId);
    };
  }, [shouldShowNoiseCanvas]);

  async function runAction(action: () => Promise<DroneStatus>) {
    try {
      const nextStatus = await action();
      setStatus(nextStatus);
    } catch (error) {
      console.error('Drone action failed.', error);
    }
  }

  const connectionButtonLabel = status.phase === 'connecting'
    ? 'Connecting...'
    : status.connected
      ? 'Disconnect'
      : status.phase === 'error'
        ? 'Reset connection'
        : 'Connect';
  const batteryValue = status.connected && status.battery !== null
    ? Math.max(0, Math.min(100, status.battery))
    : null;
  const batteryLabel = batteryValue === null ? '-//-' : `${batteryValue}%`;

  const handleConnectionToggle = () => {
    if (!droneApi || status.phase === 'connecting') {
      return;
    }

    if (status.connected || status.phase === 'error') {
      void runAction(() => droneApi.disconnect());
      return;
    }

    void runAction(() => droneApi.connect());
  };

  return (
    <main className="fpv-app">
      <section className="fpv-stage" aria-label="Drone camera view placeholder">
        <canvas
          aria-hidden="true"
          className="fpv-stage__noise"
          ref={noiseCanvasRef}
        />
        <div aria-hidden="true" className="fpv-stage__scanlines" />
        <div aria-hidden="true" className="fpv-stage__vignette" />

        <div aria-hidden="true" className="hud-crosshair">
          <span className="hud-crosshair__corner hud-crosshair__corner--top-left" />
          <span className="hud-crosshair__corner hud-crosshair__corner--top-right" />
          <span className="hud-crosshair__corner hud-crosshair__corner--bottom-left" />
          <span className="hud-crosshair__corner hud-crosshair__corner--bottom-right" />
          <span className="hud-crosshair__ring" />
          <span className="hud-crosshair__dot" />
        </div>

        <div className="top-control">
          <button
            className="control-button control-button--primary"
            disabled={!droneApi || status.phase === 'connecting'}
            onClick={handleConnectionToggle}
            type="button"
          >
            {connectionButtonLabel}
          </button>
        </div>

        <div
          className={`battery-indicator${batteryValue === null ? ' battery-indicator--offline' : ''}`}
        >
          <div aria-hidden="true" className="battery-indicator__icon">
            <span
              className="battery-indicator__fill"
              style={{ width: `${batteryValue ?? 0}%` }}
            />
          </div>
          <span className="battery-indicator__value">{batteryLabel}</span>
        </div>
      </section>
    </main>
  );
}

export default App;
