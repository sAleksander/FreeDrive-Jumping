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
  return (['forward', 'backward', 'left', 'right'] as const)
    .filter((command) => driveState[command]);
}

function formatCommandLabel(commands: DroneDriveCommand[]) {
  return commands.length > 0 ? commands.join(' + ') : 'drive';
}

function clampDriveSpeed(speed: number) {
  if (!Number.isFinite(speed)) {
    return 40;
  }

  return Math.max(0, Math.min(100, Math.round(speed)));
}

function setDriveLoopMode(
  context: DroneControllerContext,
  nextMode: DroneControllerContext['driveLoopMode'],
) {
  if (context.driveLoopMode === nextMode) {
    return;
  }

  context.driveLoopMode = nextMode;

  if (nextMode === 'armed-forward-zero') {
    context.onDiagnosticEvent('drive.mode.armed_idle_forward_keepalive', {
      activeCommands: [...context.status.activeCommands],
      armed: context.status.armed,
      connected: context.status.connected,
      posture: context.status.posture,
    });
    return;
  }

  if (!context.status.connected || context.status.armed) {
    return;
  }

  context.onDiagnosticEvent('drive.mode.disarmed_silent', {
    activeCommands: [...context.status.activeCommands],
    armed: context.status.armed,
    connected: context.status.connected,
    posture: context.status.posture,
  });
}

function clearDriveLoopTimer(context: DroneControllerContext) {
  if (!context.driveLoop) {
    return;
  }

  clearInterval(context.driveLoop);
  context.driveLoop = null;
}

function getDesiredDriveLoopMode(
  context: DroneControllerContext,
): DroneControllerContext['driveLoopMode'] {
  if (!context.drone || !context.status.connected) {
    return 'stopped';
  }

  if (!context.status.armed) {
    return 'stopped';
  }

  return getActiveCommands(context.driveState).length > 0
    ? 'active'
    : 'armed-forward-zero';
}

function sendIdleKeepalive(context: DroneControllerContext) {
  if (!context.drone) {
    throw new Error('Drone is not connected.');
  }

  context.drone.forward(0);
}

function sendDriveCommand(
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
  const driveSpeed = clampDriveSpeed(driveState.speed);

  if (verticalDirection === 0 && turnDirection === 0) {
    sendIdleKeepalive(context);
    return;
  }

  if (verticalDirection > 0) {
    context.drone.forward(driveSpeed);
  } else if (verticalDirection < 0) {
    context.drone.backward(driveSpeed);
  } else {
    sendIdleKeepalive(context);
  }

  if (effectiveTurnDirection > 0) {
    context.drone.right(driveSpeed);
  } else if (effectiveTurnDirection < 0) {
    context.drone.left(driveSpeed);
  }
}

function handleConnectionFailure(
  context: DroneControllerContext,
  error: unknown,
  fallbackMessage: string,
  failureEvent: string,
): never {
  const message = toErrorMessage(error, fallbackMessage);

  clearDriveLoop(context);
  context.driveState = createIdleDriveState();
  publishStatus(context, {
    phase: 'error',
    connected: false,
    armed: false,
    activeCommands: [],
    lastError: message,
    lastEvent: failureEvent,
  });

  throw new Error(message);
}

function syncDriveLoop(context: DroneControllerContext) {
  const nextMode = getDesiredDriveLoopMode(context);

  if (nextMode === 'stopped') {
    clearDriveLoopTimer(context);
    setDriveLoopMode(context, 'stopped');
    return;
  }

  if (context.driveLoop && context.driveLoopMode === nextMode) {
    return;
  }

  clearDriveLoopTimer(context);
  setDriveLoopMode(context, nextMode);
  context.driveLoop = setInterval(() => {
    if (!context.drone || !context.status.connected) {
      clearDriveLoop(context);
      return;
    }

    try {
      if (context.driveLoopMode === 'armed-forward-zero') {
        sendIdleKeepalive(context);
        return;
      }

      sendDriveCommand(context, context.driveState);
    } catch (error) {
      const loopLabel = context.driveLoopMode === 'armed-forward-zero'
        ? 'the armed idle forward(0) keepalive'
        : `the ${formatCommandLabel(getActiveCommands(context.driveState))} command`;
      const failureEvent = context.driveLoopMode === 'armed-forward-zero'
        ? 'Armed idle keepalive failed'
        : 'Drive refresh failed';

      handleConnectionFailure(
        context,
        error,
        `Failed to refresh ${loopLabel}.`,
        failureEvent,
      );
    }
  }, context.driveRefreshIntervalMs);
}

async function setIdleState(
  context: DroneControllerContext,
  lastEvent: string,
): Promise<DroneStatus> {
  if (!context.drone || !context.status.connected) {
    return getStatusSnapshot(context);
  }

  context.driveState = createIdleDriveState();

  try {
    context.drone.stop();
    syncDriveLoop(context);
    publishStatus(context, {
      activeCommands: [],
      lastError: null,
      lastEvent,
    });
    return getStatusSnapshot(context);
  } catch (error) {
    handleConnectionFailure(
      context,
      error,
      'Failed to stop the drone.',
      'Stop command failed',
    );
  }
}

export function clearDriveLoop(context: DroneControllerContext) {
  clearDriveLoopTimer(context);
  context.driveLoopMode = 'stopped';
}

export function startDriveLoop(context: DroneControllerContext) {
  syncDriveLoop(context);
}

export async function setArmedState(
  context: DroneControllerContext,
  armed: boolean,
): Promise<DroneStatus> {
  if (!context.drone || !context.status.connected) {
    return getStatusSnapshot(context);
  }

  if (context.status.armed === armed) {
    syncDriveLoop(context);
    return getStatusSnapshot(context);
  }

  context.driveState = createIdleDriveState();

  try {
    if (!armed) {
      context.drone.stop();
    }

    publishStatus(context, {
      armed,
      activeCommands: [],
      lastError: null,
      lastEvent: armed ? 'Drone armed' : 'Drone disarmed',
    });
    context.onDiagnosticEvent(armed ? 'drone.armed' : 'drone.disarmed', {
      connected: context.status.connected,
      posture: context.status.posture,
    });
    syncDriveLoop(context);
    return getStatusSnapshot(context);
  } catch (error) {
    handleConnectionFailure(
      context,
      error,
      `Failed to ${armed ? 'arm' : 'disarm'} the drone.`,
      armed ? 'Arm command failed' : 'Disarm command failed',
    );
  }
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

  if (!context.status.armed) {
    context.driveState = createIdleDriveState();

    if (activeCommands.length > 0) {
      context.onDiagnosticEvent('drive.command.blocked.disarmed', {
        connected: context.status.connected,
        posture: context.status.posture,
        requestedCommands: activeCommands,
        requestedDriveState: { ...driveState },
      });
    }

    syncDriveLoop(context);
    return getStatusSnapshot(context);
  }

  context.driveState = { ...driveState };

  if (activeCommands.length === 0) {
    return setIdleState(context, 'Drive stopped');
  }

  if (isUnchanged) {
    syncDriveLoop(context);
    return getStatusSnapshot(context);
  }

  try {
    sendDriveCommand(context, driveState);
    syncDriveLoop(context);
    publishStatus(context, {
      activeCommands,
      lastError: null,
      lastEvent: `Drive command: ${activeCommands.join(' + ')} at ${clampDriveSpeed(driveState.speed)}% speed`,
    });
    return getStatusSnapshot(context);
  } catch (error) {
    const label = formatCommandLabel(activeCommands);
    handleConnectionFailure(
      context,
      error,
      `Failed to send the ${label} command.`,
      `${label} command failed`,
    );
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
    speed: 40,
  });
}
