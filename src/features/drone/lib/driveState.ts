const keyMap: Record<string, DroneDriveCommand> = {
  w: 'forward',
  s: 'backward',
  a: 'left',
  d: 'right',
};

export function getDriveCommandForKey(key: string): DroneDriveCommand | null {
  return keyMap[key.toLowerCase()] ?? null;
}

export function createIdleDriveState(): DroneDriveState {
  return {
    forward: false,
    backward: false,
    left: false,
    right: false,
  };
}

export function toDriveState(
  heldCommands: Set<DroneDriveCommand>,
): DroneDriveState {
  return {
    forward: heldCommands.has('forward'),
    backward: heldCommands.has('backward'),
    left: heldCommands.has('left'),
    right: heldCommands.has('right'),
  };
}
