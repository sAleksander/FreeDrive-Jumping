import { BatteryIndicator } from './features/hud/components/BatteryIndicator';
import { ConnectionToggle } from './features/hud/components/ConnectionToggle';
import { Crosshair } from './features/hud/components/Crosshair';
import { useDriveKeyboard } from './features/drone/hooks/useDriveKeyboard';
import { useDroneStatus } from './features/drone/hooks/useDroneStatus';
import { FpvStage } from './features/video/components/FpvStage';
import { useRxNoiseCanvas } from './features/video/hooks/useRxNoiseCanvas';

function App() {
  const {
    connectionButtonLabel,
    droneApiAvailable,
    runAction,
    status,
    toggleConnection,
  } = useDroneStatus();

  const hasVideoFeed = false;
  const shouldShowNoiseCanvas = !status.connected || !hasVideoFeed;
  const noiseCanvasRef = useRxNoiseCanvas(shouldShowNoiseCanvas);

  useDriveKeyboard(status.connected, runAction);

  return (
    <FpvStage noiseCanvasRef={noiseCanvasRef}>
      <Crosshair />
      <ConnectionToggle
        disabled={!droneApiAvailable || status.phase === 'connecting'}
        label={connectionButtonLabel}
        onToggle={toggleConnection}
      />
      <BatteryIndicator battery={status.battery} connected={status.connected} />
    </FpvStage>
  );
}

export default App;
