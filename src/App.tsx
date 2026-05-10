import { useState } from 'react';
import { getDroneHudAlert } from './features/drone/lib/hudAlert';
import { ArmingToggle } from './features/hud/components/ArmingToggle';
import { BatteryIndicator } from './features/hud/components/BatteryIndicator';
import { ConnectionToggle } from './features/hud/components/ConnectionToggle';
import { Crosshair } from './features/hud/components/Crosshair';
import { VideoDiagnostics } from './features/hud/components/VideoDiagnostics';
import { WarningLabel } from './features/hud/components/WarningLabel';
import { useDriveKeyboard } from './features/drone/hooks/useDriveKeyboard';
import { useDroneStatus } from './features/drone/hooks/useDroneStatus';
import { FpvStage } from './features/video/components/FpvStage';
import { useDroneVideo } from './features/video/hooks/useDroneVideo';
import { useRxNoiseCanvas } from './features/video/hooks/useRxNoiseCanvas';
import { DroneModelBadge } from './features/hud/components/DroneModelBadge';
import { SettingsButton } from './features/settings/components/SettingsButton';
import { SettingsModal } from './features/settings/components/SettingsModal';
import { useAppSettings } from './features/settings/hooks/useAppSettings';

function App() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const {
    loading: settingsLoading,
    saving: settingsSaving,
    settings,
    updateSetting,
  } = useAppSettings();

  const {
    connectionButtonLabel,
    droneApiAvailable,
    hasConnectedOnce,
    runAction,
    status,
    toggleArmed,
    toggleConnection,
  } = useDroneStatus();

  const { diagnostics, showVideo, videoCanvasRef } = useDroneVideo(status.connected);
  const shouldShowNoiseCanvas = (!status.connected || !showVideo) && !(settings.virtualDrone === 1 && status.connected);
  const noiseCanvasRef = useRxNoiseCanvas(shouldShowNoiseCanvas);
  const hudAlert = getDroneHudAlert(status, hasConnectedOnce);

  useDriveKeyboard(status.connected, status.armed, runAction, {
    sneak: settings.sneakSpeed,
    regular: settings.regularSpeed,
    run: settings.runSpeed,
  });

  return (
    <FpvStage
      noiseCanvasRef={noiseCanvasRef}
      showNoise={shouldShowNoiseCanvas}
      showVideo={showVideo}
      videoCanvasRef={videoCanvasRef}
    >
      {settings.showVideoDiagnostics === 1 && <VideoDiagnostics diagnostics={diagnostics} />}
      <ArmingToggle
        armed={status.armed}
        disabled={!status.connected}
        onToggle={toggleArmed}
      />
      <WarningLabel alert={hudAlert} />
      <Crosshair />
      <ConnectionToggle
        disabled={!droneApiAvailable || status.phase === 'connecting'}
        label={connectionButtonLabel}
        onToggle={toggleConnection}
      />
      <BatteryIndicator battery={status.battery} connected={status.connected} />
      <DroneModelBadge connected={status.connected} model={status.model} />
      <SettingsButton open={settingsOpen} onToggle={() => setSettingsOpen(v => !v)} />
      <SettingsModal
        disabled={settingsLoading || settingsSaving}
        open={settingsOpen}
        settings={settings}
        onClose={() => setSettingsOpen(false)}
        onUpdate={updateSetting}
      />
    </FpvStage>
  );
}

export default App;
