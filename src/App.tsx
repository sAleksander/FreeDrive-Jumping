import { BatteryIndicator } from './features/hud/components/BatteryIndicator';
import { ConnectionToggle } from './features/hud/components/ConnectionToggle';
import { Crosshair } from './features/hud/components/Crosshair';
import { VideoDiagnostics } from './features/hud/components/VideoDiagnostics';
import { useDriveKeyboard } from './features/drone/hooks/useDriveKeyboard';
import { useDroneStatus } from './features/drone/hooks/useDroneStatus';
import { FpvStage } from './features/video/components/FpvStage';
import { useDroneVideo } from './features/video/hooks/useDroneVideo';
import { useRxNoiseCanvas } from './features/video/hooks/useRxNoiseCanvas';

function App() {
  const {
    connectionButtonLabel,
    droneApiAvailable,
    runAction,
    status,
    toggleConnection,
  } = useDroneStatus();

  const { diagnostics, showVideo, videoCanvasRef } = useDroneVideo(status.connected);
  const shouldShowNoiseCanvas = !status.connected || !showVideo;
  const noiseCanvasRef = useRxNoiseCanvas(shouldShowNoiseCanvas);

  useDriveKeyboard(status.connected, runAction);

  return (
    <FpvStage
      noiseCanvasRef={noiseCanvasRef}
      showNoise={shouldShowNoiseCanvas}
      showVideo={showVideo}
      videoCanvasRef={videoCanvasRef}
    >
      <VideoDiagnostics diagnostics={diagnostics} />
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
