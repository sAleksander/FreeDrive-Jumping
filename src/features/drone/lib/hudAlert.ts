export type DroneHudAlertTone = 'info' | 'warning' | 'critical';

export interface DroneHudAlert {
  message: string;
  tone: DroneHudAlertTone;
}

export function getDroneHudAlert(
  status: DroneStatus,
  hasConnectedOnce: boolean,
): DroneHudAlert | null {
  if (status.connected && status.battery !== null) {
    if (status.battery <= 10) {
      return {
        message: 'Battery Critical!',
        tone: 'critical',
      };
    }

    if (status.battery <= 20) {
      return {
        message: 'Low Battery',
        tone: 'warning',
      };
    }
  }

  if (status.phase === 'connecting') {
    return null;
  }

  if (status.phase === 'error') {
    return {
      message: hasConnectedOnce
        ? 'Drone connection lost'
        : 'Connect to your Parrot Jumping drone',
      tone: 'info',
    };
  }

  if (!status.connected) {
    return {
      message: 'Connect to your Parrot Jumping drone',
      tone: 'info',
    };
  }

  if (status.posture === 'stuck') {
    return {
      message: 'Drone stuck',
      tone: 'warning',
    };
  }

  return null;
}
