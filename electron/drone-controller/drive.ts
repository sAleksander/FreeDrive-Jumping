import { toErrorMessage } from './drone-controller-utils';
import { getStatusSnapshot, publishStatus } from './state';
import type {
  DroneControllerContext,
  DroneDriveCommand,
  DroneStatus,
} from './types';

function sendDriveCommand(
  context: DroneControllerContext,
  command: DroneDriveCommand,
) {
  if (!context.drone) {
    throw new Error('Drone is not connected.');
  }

  context.drone[command](context.driveSpeed);
}

function handleDriveFailure(
  context: DroneControllerContext,
  command: DroneDriveCommand,
  error: unknown,
): never {
  clearDriveLoop(context);

  const message = toErrorMessage(
    error,
    `Failed to send the ${command} command.`,
  );

  publishStatus(context, {
    phase: 'error',
    connected: false,
    activeCommand: null,
    lastError: message,
    lastEvent: `${command} command failed`,
  });

  throw new Error(message);
}

function ensureDriveLoop(context: DroneControllerContext) {
  if (context.driveLoop) {
    return;
  }

  context.driveLoop = setInterval(() => {
    if (
      !context.drone ||
      !context.status.connected ||
      !context.status.activeCommand
    ) {
      clearDriveLoop(context);
      return;
    }

    try {
      sendDriveCommand(context, context.status.activeCommand);
    } catch (error) {
      const message = toErrorMessage(
        error,
        `Failed to refresh the ${context.status.activeCommand} command.`,
      );

      clearDriveLoop(context);
      publishStatus(context, {
        phase: 'error',
        connected: false,
        activeCommand: null,
        lastError: message,
        lastEvent: 'Drive refresh failed',
      });
    }
  }, context.driveRefreshIntervalMs);
}

export function clearDriveLoop(context: DroneControllerContext) {
  if (!context.driveLoop) {
    return;
  }

  clearInterval(context.driveLoop);
  context.driveLoop = null;
}

export async function driveDrone(
  context: DroneControllerContext,
  command: DroneDriveCommand,
): Promise<DroneStatus> {
  if (!context.drone || !context.status.connected) {
    return getStatusSnapshot(context);
  }

  if (context.status.activeCommand === command) {
    ensureDriveLoop(context);
    return getStatusSnapshot(context);
  }

  try {
    sendDriveCommand(context, command);
    ensureDriveLoop(context);
    publishStatus(context, {
      activeCommand: command,
      lastError: null,
      lastEvent: `Drive command: ${command} at ${context.driveSpeed}% speed`,
    });
    return getStatusSnapshot(context);
  } catch (error) {
    handleDriveFailure(context, command, error);
  }
}
