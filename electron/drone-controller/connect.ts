import { toErrorMessage } from './drone-controller-utils';
import { detectDroneModel } from './detect';
import { startDriveLoop } from './drive';
import { attachDroneListeners } from './events';
import {
  createIdleDriveState,
  getStatusSnapshot,
  publishStatus,
} from './state';
import { teardownDrone } from './teardown';
import {
  attachVideoListeners,
  startVideoPipeline,
} from './video';
import { VirtualDroneAdapter } from './virtual-drone';
import type {
  DroneControllerContext,
  DroneStatus,
  NodeSumoModule,
} from './types';

const sumo = require('node-sumo') as NodeSumoModule;

export async function connectDrone(
  context: DroneControllerContext,
  useVirtual = false,
): Promise<DroneStatus> {
  if (context.status.phase === 'connecting' || context.status.connected) {
    return getStatusSnapshot(context);
  }

  teardownDrone(context);
  context.driveState = createIdleDriveState();

  const drone = useVirtual ? new VirtualDroneAdapter() : sumo.createClient();
  context.drone = drone;
  attachDroneListeners(context, drone);
  attachVideoListeners(context, drone);

  publishStatus(context, {
    phase: 'connecting',
    connected: false,
    armed: false,
    battery: null,
    posture: null,
    model: 'unknown',
    activeCommands: [],
    lastError: null,
    lastEvent: 'Starting discovery handshake',
  });

  try {
    await new Promise<void>((resolve, reject) => {
      let settled = false;

      const finish = (callback: () => void) => {
        if (settled) {
          return;
        }

        settled = true;
        clearTimeout(timeoutId);
        callback();
      };

      const timeoutId = setTimeout(() => {
        finish(() => {
          reject(
            new Error(
              'Connection timed out after 10 seconds. Verify the Mac is joined to the drone Wi-Fi and no other controller is active.',
            ),
          );
        });
      }, 10_000);

      drone.once('ready', () => {
        finish(() => {
          publishStatus(context, {
            phase: 'connected',
            connected: true,
            armed: false,
            lastError: null,
            lastEvent: 'Drone ready for commands',
          });
          startDriveLoop(context);

          if (useVirtual) {
            // Virtual drone has no UDP socket — model stays 'unknown', no video pipeline.
          } else {
            startVideoPipeline(context);
            detectDroneModel(drone, (model) => {
              publishStatus(context, { model });
            });
          }

          resolve();
        });
      });

      drone.connect((error) => {
        if (error) {
          finish(() => {
            reject(
              new Error(
                toErrorMessage(
                  error,
                  'The drone rejected the discovery handshake.',
                ),
              ),
            );
          });
        }
      });
    });

    return getStatusSnapshot(context);
  } catch (error) {
    const message = toErrorMessage(error, 'Unable to connect to the drone.');

    teardownDrone(context);
    publishStatus(context, {
      phase: 'error',
      connected: false,
      armed: false,
      battery: null,
      posture: null,
      model: 'unknown',
      activeCommands: [],
      lastError: message,
      lastEvent: 'Connection failed',
    });

    throw new Error(message);
  }
}
