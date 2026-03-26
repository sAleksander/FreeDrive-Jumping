import { clearDriveLoop } from './drive';
import { toErrorMessage } from './drone-controller-utils';
import {
  createIdleDriveState,
  getStatusSnapshot,
  publishStatus,
} from './state';
import type { DroneControllerContext, DroneStatus } from './types';

export async function stopDrone(
  context: DroneControllerContext,
): Promise<DroneStatus> {
  if (!context.drone || !context.status.connected) {
    return getStatusSnapshot(context);
  }

  try {
    clearDriveLoop(context);
    context.driveState = createIdleDriveState();
    context.drone.stop();
    publishStatus(context, {
      activeCommands: [],
      lastEvent: 'Stop command sent',
      lastError: null,
    });
    return getStatusSnapshot(context);
  } catch (error) {
    const message = toErrorMessage(error, 'Failed to send the stop command.');
    clearDriveLoop(context);
    context.driveState = createIdleDriveState();

    publishStatus(context, {
      phase: 'error',
      connected: false,
      activeCommands: [],
      lastError: message,
      lastEvent: 'Stop command failed',
    });
    throw new Error(message);
  }
}
