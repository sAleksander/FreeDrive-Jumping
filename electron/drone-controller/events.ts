import { engageStuckDriveSafety } from './drive';
import { publishStatus } from './state';
import type { DroneControllerContext, DronePosture, NodeSumoClient } from './types';

function publishPostureEvent(
  context: DroneControllerContext,
  posture: DronePosture,
  lastEvent: string,
) {
  const previousPosture = context.status.posture;

  publishStatus(context, {
    posture,
    lastEvent,
  });

  context.onDiagnosticEvent('drone.posture.event', {
    previousPosture,
    nextPosture: posture,
    activeCommands: [...context.status.activeCommands],
    driveState: { ...context.driveState },
    connected: context.status.connected,
  });

  if (previousPosture === 'stuck' && posture !== 'stuck') {
    context.onDiagnosticEvent('drive.safety.stuck.cleared', {
      nextPosture: posture,
      connected: context.status.connected,
    });
  }
}

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
    publishPostureEvent(context, 'standing', 'Posture changed to standing');
  });

  drone.on('postureJumper', () => {
    publishPostureEvent(context, 'jumper', 'Posture changed to jumper');
  });

  drone.on('postureKicker', () => {
    publishPostureEvent(context, 'kicker', 'Posture changed to kicker');
  });

  drone.on('postureStuck', () => {
    publishPostureEvent(context, 'stuck', 'Drone reports it is stuck');
    engageStuckDriveSafety(context);
  });

  drone.on('postureUnknown', () => {
    publishPostureEvent(context, 'unknown', 'Drone posture is unknown');
  });
}
