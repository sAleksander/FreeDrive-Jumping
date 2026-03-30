export type DroneHudAlertTone = 'info' | 'warning' | 'critical';

export interface DroneHudAlert {
  message: string;
  tone: DroneHudAlertTone;
}

export function getDroneHudAlert(status: DroneStatus): DroneHudAlert | null {
  if (status.posture === 'stuck') {
    return {
      message: 'Drone stuck',
      tone: 'warning',
    };
  }

  if (status.phase === 'error') {
    return {
      message: status.lastError ? 'Connection error' : 'Drone error',
      tone: 'critical',
    };
  }

  return null;
}
