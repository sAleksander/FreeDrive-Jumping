const DEFAULT_DRIVE_SPEED = 40;
const SLOW_DRIVE_SPEED = 10;
const BOOST_DRIVE_SPEED = 80;

const keyMap: Record<string, DroneDriveCommand> = {
  ArrowUp: 'forward',
  ArrowDown: 'backward',
  ArrowLeft: 'left',
  ArrowRight: 'right',
};

export function getDriveCommandForKey(key: string): DroneDriveCommand | null {
  return keyMap[key] ?? null;
}

export function createIdleDriveState(): DroneDriveState {
  return {
    forward: false,
    backward: false,
    left: false,
    right: false,
    speed: DEFAULT_DRIVE_SPEED,
  };
}

export function getDriveSpeedFromModifiers(modifiers: {
  slow: boolean;
  shift: boolean;
}): number {
  if (modifiers.shift) {
    return BOOST_DRIVE_SPEED;
  }

  if (modifiers.slow) {
    return SLOW_DRIVE_SPEED;
  }

  return DEFAULT_DRIVE_SPEED;
}

export function toDriveState(
  heldCommands: Set<DroneDriveCommand>,
  speed: number,
): DroneDriveState {
  return {
    forward: heldCommands.has('forward'),
    backward: heldCommands.has('backward'),
    left: heldCommands.has('left'),
    right: heldCommands.has('right'),
    speed,
  };
}
