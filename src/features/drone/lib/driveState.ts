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
    speed: 40,
  };
}

export function getDriveSpeedFromModifiers(
  modifiers: { slow: boolean; shift: boolean },
  speeds: { sneak: number; regular: number; run: number },
): number {
  if (modifiers.shift) return speeds.run;
  if (modifiers.slow) return speeds.sneak;
  return speeds.regular;
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
