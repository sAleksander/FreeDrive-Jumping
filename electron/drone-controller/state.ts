import type {
  DroneControllerContext,
  DroneDriveState,
  DroneStatus,
} from './types';

export function createIdleDriveState(): DroneDriveState {
  return {
    forward: false,
    backward: false,
    left: false,
    right: false,
  };
}

export function createInitialStatus(): DroneStatus {
  return {
    phase: 'idle',
    connected: false,
    battery: null,
    posture: null,
    activeCommands: [],
    lastEvent: null,
    lastError: null,
    updatedAt: null,
  };
}

export function getStatusSnapshot(
  context: Pick<DroneControllerContext, 'status'>,
): DroneStatus {
  return { ...context.status };
}

export function publishStatus(
  context: DroneControllerContext,
  patch: Partial<DroneStatus>,
) {
  context.status = {
    ...context.status,
    ...patch,
    updatedAt: new Date().toISOString(),
  };

  context.onStatusChange(getStatusSnapshot(context));
}
