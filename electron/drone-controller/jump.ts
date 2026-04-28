import { toErrorMessage } from './drone-controller-utils';
import { getStatusSnapshot, publishStatus } from './state';
import type { DroneControllerContext, DroneJumpType, DroneStatus } from './types';

export async function jumpDrone(
  context: DroneControllerContext,
  type: DroneJumpType,
): Promise<DroneStatus> {
  if (!context.drone || !context.status.connected) {
    return getStatusSnapshot(context);
  }

  try {
    if (type === 'long') {
      context.drone.animationsLongJump();
    } else {
      context.drone.animationsHighJump();
    }

    publishStatus(context, {
      lastEvent: `Jump: ${type}`,
      lastError: null,
    });

    return getStatusSnapshot(context);
  } catch (error) {
    const message = toErrorMessage(error, 'Failed to send jump command.');

    publishStatus(context, {
      lastError: message,
      lastEvent: 'Jump command failed',
    });

    throw new Error(message);
  }
}
