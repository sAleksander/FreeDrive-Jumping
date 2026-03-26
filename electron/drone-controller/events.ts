import { publishStatus } from './state';
import type { DroneControllerContext, NodeSumoClient } from './types';

export function attachDroneListeners(
  context: DroneControllerContext,
  drone: NodeSumoClient,
) {
  drone.on('battery', (battery: unknown) => {
    if (typeof battery === 'number') {
      publishStatus(context, {
        battery,
        lastEvent: `Battery update: ${battery}%`,
      });
    }
  });

  drone.on('batteryLow', () => {
    publishStatus(context, {
      lastEvent: 'Battery low warning',
    });
  });

  drone.on('batteryCritical', () => {
    publishStatus(context, {
      lastEvent: 'Battery critical warning',
    });
  });

  drone.on('postureStanding', () => {
    publishStatus(context, {
      posture: 'standing',
      lastEvent: 'Posture changed to standing',
    });
  });

  drone.on('postureJumper', () => {
    publishStatus(context, {
      posture: 'jumper',
      lastEvent: 'Posture changed to jumper',
    });
  });

  drone.on('postureKicker', () => {
    publishStatus(context, {
      posture: 'kicker',
      lastEvent: 'Posture changed to kicker',
    });
  });

  drone.on('postureStuck', () => {
    publishStatus(context, {
      posture: 'stuck',
      lastEvent: 'Drone reports it is stuck',
    });
  });

  drone.on('postureUnknown', () => {
    publishStatus(context, {
      posture: 'unknown',
      lastEvent: 'Drone posture is unknown',
    });
  });
}
