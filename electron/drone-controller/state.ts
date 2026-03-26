import type { DroneControllerContext, DroneStatus } from './types';

export function createInitialStatus(): DroneStatus {
  return {
    phase: 'idle',
    connected: false,
    battery: null,
    posture: null,
    activeCommand: null,
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
