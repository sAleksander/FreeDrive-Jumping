import { useCallback, useEffect, useMemo, useState } from 'react';
import { initialDroneStatus } from '../lib/status';
import type { DroneAction, DroneApi, RunDroneAction } from '../types';

interface UseDroneStatusResult {
  connectionButtonLabel: string;
  droneApiAvailable: boolean;
  runAction: RunDroneAction;
  status: DroneStatus;
  toggleConnection: () => void;
}

function getConnectionButtonLabel(status: DroneStatus): string {
  if (status.phase === 'connecting') {
    return 'Connecting...';
  }

  if (status.connected) {
    return 'Disconnect';
  }

  if (status.phase === 'error') {
    return 'Reset connection';
  }

  return 'Connect';
}

export function useDroneStatus(): UseDroneStatusResult {
  const droneApi = window.electronAPI?.drone;
  const [status, setStatus] = useState<DroneStatus>(initialDroneStatus);

  useEffect(() => {
    if (!droneApi) {
      return;
    }

    void droneApi.getStatus().then(setStatus);
    const unsubscribe = droneApi.onStatus(setStatus);

    return unsubscribe;
  }, [droneApi]);

  const runAction = useCallback<RunDroneAction>(
    async (action: DroneAction) => {
      if (!droneApi) {
        return;
      }

      try {
        const nextStatus = await action(droneApi);
        setStatus(nextStatus);
      } catch (error) {
        console.error('Drone action failed.', error);
      }
    },
    [droneApi],
  );

  const toggleConnection = useCallback(() => {
    if (!droneApi || status.phase === 'connecting') {
      return;
    }

    if (status.connected || status.phase === 'error') {
      void runAction((drone: DroneApi) => drone.disconnect());
      return;
    }

    void runAction((drone: DroneApi) => drone.connect());
  }, [droneApi, runAction, status.connected, status.phase]);

  const connectionButtonLabel = useMemo(
    () => getConnectionButtonLabel(status),
    [status],
  );

  return {
    connectionButtonLabel,
    droneApiAvailable: Boolean(droneApi),
    runAction,
    status,
    toggleConnection,
  };
}
