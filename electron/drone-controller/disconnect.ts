import { clearDriveLoop } from './drive';
import {
  createIdleDriveState,
  createInitialStatus,
  getStatusSnapshot,
  publishStatus,
} from './state';
import { teardownDrone } from './teardown';
import type { DroneControllerContext, DroneStatus } from './types';

export async function disconnectDrone(
  context: DroneControllerContext,
): Promise<DroneStatus> {
  if (context.drone) {
    try {
      clearDriveLoop(context);
      context.drone.stop();
    } catch {
      // Ignore stop failures during disconnect.
    }
  }

  teardownDrone(context);
  context.driveState = createIdleDriveState();
  publishStatus(context, {
    ...createInitialStatus(),
    lastEvent: 'Disconnected',
  });

  return getStatusSnapshot(context);
}
