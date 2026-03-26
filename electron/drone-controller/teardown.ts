import { clearDriveLoop } from './drive';
import {
  closeUdpSocket,
  destroyNetSocket,
} from './drone-controller-utils';
import type { DroneControllerContext } from './types';

export function teardownDrone(context: DroneControllerContext) {
  clearDriveLoop(context);

  if (!context.drone) {
    return;
  }

  const drone = context.drone;
  context.drone = null;

  try {
    drone.removeAllListeners();
  } catch {
    // Best effort cleanup for old library internals.
  }

  try {
    drone.disconnect();
  } catch {
    // Best effort cleanup for old library internals.
  }

  closeUdpSocket(drone._d2cServer);
  closeUdpSocket(drone._c2dClient);
  destroyNetSocket(drone._discoveryClient);
}
