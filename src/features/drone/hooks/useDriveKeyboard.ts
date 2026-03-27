import { useEffect, useRef } from 'react';
import {
  createIdleDriveState,
  getDriveCommandForKey,
  toDriveState,
} from '../lib/driveState';
import type { RunDroneAction } from '../types';

export function useDriveKeyboard(
  connected: boolean,
  runAction: RunDroneAction,
) {
  const heldCommandsRef = useRef<Set<DroneDriveCommand>>(new Set());

  useEffect(() => {
    if (!connected) {
      return;
    }

    const syncDriveState = () =>
      runAction((drone) => drone.setDriveState(toDriveState(heldCommandsRef.current)));

    const clearDriveState = () => {
      heldCommandsRef.current.clear();
      void runAction((drone) => drone.setDriveState(createIdleDriveState()));
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const command = getDriveCommandForKey(event.key);

      if (!command) {
        return;
      }

      if (heldCommandsRef.current.has(command)) {
        event.preventDefault();
        return;
      }

      event.preventDefault();
      heldCommandsRef.current.add(command);
      void syncDriveState();
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const command = getDriveCommandForKey(event.key);

      if (!command) {
        return;
      }

      event.preventDefault();
      heldCommandsRef.current.delete(command);
      void syncDriveState();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        clearDriveState();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', clearDriveState);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', clearDriveState);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearDriveState();
    };
  }, [connected, runAction]);
}
