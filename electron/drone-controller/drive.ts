import { toErrorMessage } from './drone-controller-utils';
import {
  createIdleDriveState,
  getStatusSnapshot,
  publishStatus,
} from './state';
import type {
  DroneControllerContext,
  DroneDriveCommand,
  DroneDriveState,
  DroneStatus,
} from './types';

function getActiveCommands(driveState: DroneDriveState): DroneDriveCommand[] {
  return (
    Object.entries(driveState)
      .filter(([, active]) => active)
      .map(([command]) => command as DroneDriveCommand)
  );
}

function isDriveBlockedByPosture(context: DroneControllerContext) {
  return context.status.posture === 'stuck';
}

function sendDriveState(
  context: DroneControllerContext,
  driveState: DroneDriveState,
) {
  if (!context.drone) {
    throw new Error('Drone is not connected.');
  }

  const verticalDirection =
    Number(driveState.forward) - Number(driveState.backward);
  const turnDirection = Number(driveState.right) - Number(driveState.left);
  const effectiveTurnDirection = verticalDirection < 0
    ? -turnDirection
    : turnDirection;

  if (verticalDirection === 0 && turnDirection === 0) {
    // Keep sending neutral PCMD packets while connected so the session
    // stays alive even when the drone is stationary.
    context.drone.forward(0);
    return;
  }

  if (verticalDirection > 0) {
    context.drone.forward(context.driveSpeed);
  } else if (verticalDirection < 0) {
    context.drone.backward(context.driveSpeed);
  } else {
    context.drone.forward(0);
  }

  if (effectiveTurnDirection > 0) {
    context.drone.right(context.driveSpeed);
  } else if (effectiveTurnDirection < 0) {
    context.drone.left(context.driveSpeed);
  }
}

function handleDriveFailure(
  context: DroneControllerContext,
  commands: DroneDriveCommand[],
  error: unknown,
): never {
  clearDriveLoop(context);
  context.driveState = createIdleDriveState();

  const label = commands.length > 0 ? commands.join(' + ') : 'drive';

  const message = toErrorMessage(
    error,
    `Failed to send the ${label} command.`,
  );

  publishStatus(context, {
    phase: 'error',
    connected: false,
    activeCommands: [],
    lastError: message,
    lastEvent: `${label} command failed`,
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
      !context.status.connected
    ) {
      clearDriveLoop(context);
      return;
    }

    try {
      sendDriveState(context, context.driveState);
    } catch (error) {
      const activeCommands = [...context.status.activeCommands];
      const label = activeCommands.length > 0
        ? activeCommands.join(' + ')
        : 'idle keepalive';
      const message = toErrorMessage(
        error,
        `Failed to refresh the ${label} command.`,
      );

      clearDriveLoop(context);
      context.driveState = createIdleDriveState();
      publishStatus(context, {
        phase: 'error',
        connected: false,
        activeCommands: [],
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

export function startDriveLoop(context: DroneControllerContext) {
  ensureDriveLoop(context);
}

export function engageStuckDriveSafety(context: DroneControllerContext) {
  const activeCommandsBeforeStop = [...context.status.activeCommands];
  const driveStateBeforeStop = { ...context.driveState };
  context.driveState = createIdleDriveState();

  context.onDiagnosticEvent('drive.safety.stuck.engaged', {
    posture: context.status.posture,
    activeCommandsBeforeStop,
    driveStateBeforeStop,
    connected: context.status.connected,
  });

  if (!context.drone || !context.status.connected) {
    publishStatus(context, {
      activeCommands: [],
      lastError: null,
      lastEvent: 'Drone reports it is stuck; drive commands blocked',
    });
    return;
  }

  try {
    context.drone.stop();
  } catch {
    // Best effort immediate stop for old library internals.
  }

  try {
    sendDriveState(context, context.driveState);
    ensureDriveLoop(context);
  } catch {
    // If neutral keepalive fails here, the regular refresh loop/error path
    // will surface the connection problem on the next tick.
  }

  publishStatus(context, {
    activeCommands: [],
    lastError: null,
    lastEvent: 'Drone reports it is stuck; drive commands blocked',
  });
}

export async function setDriveState(
  context: DroneControllerContext,
  driveState: DroneDriveState,
): Promise<DroneStatus> {
  if (!context.drone || !context.status.connected) {
    return getStatusSnapshot(context);
  }

  const activeCommands = getActiveCommands(driveState);
  const currentCommands = context.status.activeCommands;
  const isUnchanged =
    activeCommands.length === currentCommands.length &&
    activeCommands.every((command, index) => command === currentCommands[index]);

  if (isDriveBlockedByPosture(context) && activeCommands.length > 0) {
    context.driveState = createIdleDriveState();
    context.onDiagnosticEvent('drive.command.blocked.stuck', {
      posture: context.status.posture,
      requestedCommands: activeCommands,
      requestedDriveState: { ...driveState },
      connected: context.status.connected,
    });

    try {
      sendDriveState(context, context.driveState);
      ensureDriveLoop(context);
      publishStatus(context, {
        activeCommands: [],
        lastError: null,
        lastEvent: 'Drive command ignored while drone is stuck',
      });
      return getStatusSnapshot(context);
    } catch (error) {
      const message = toErrorMessage(
        error,
        'Failed to keep the drone idle while it is stuck.',
      );

      clearDriveLoop(context);
      context.driveState = createIdleDriveState();
      publishStatus(context, {
        phase: 'error',
        connected: false,
        activeCommands: [],
        lastError: message,
        lastEvent: 'Stuck safety keepalive failed',
      });
      throw new Error(message);
    }
  }

  context.driveState = { ...driveState };

  if (activeCommands.length === 0) {
    try {
      sendDriveState(context, driveState);
      ensureDriveLoop(context);
      publishStatus(context, {
        activeCommands: [],
        lastEvent: 'Idle keepalive active',
        lastError: null,
      });
      return getStatusSnapshot(context);
    } catch (error) {
      const message = toErrorMessage(
        error,
        'Failed to send the idle keepalive command.',
      );

      clearDriveLoop(context);
      context.driveState = createIdleDriveState();
      publishStatus(context, {
        phase: 'error',
        connected: false,
        activeCommands: [],
        lastError: message,
        lastEvent: 'Idle keepalive failed',
      });
      throw new Error(message);
    }
  }

  if (isUnchanged) {
    ensureDriveLoop(context);
    return getStatusSnapshot(context);
  }

  try {
    sendDriveState(context, driveState);
    ensureDriveLoop(context);
    publishStatus(context, {
      activeCommands,
      lastError: null,
      lastEvent: `Drive command: ${activeCommands.join(' + ')} at ${context.driveSpeed}% speed`,
    });
    return getStatusSnapshot(context);
  } catch (error) {
    handleDriveFailure(context, activeCommands, error);
  }
}

export async function driveDrone(
  context: DroneControllerContext,
  command: DroneDriveCommand,
): Promise<DroneStatus> {
  return setDriveState(context, {
    forward: command === 'forward',
    backward: command === 'backward',
    left: command === 'left',
    right: command === 'right',
  });
}
