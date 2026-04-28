import { useEffect, useRef } from 'react';
import {
  getDriveSpeedFromModifiers,
  getDriveCommandForKey,
  toDriveState,
} from '../lib/driveState';
import type { RunDroneAction } from '../types';

export function useDriveKeyboard(
  connected: boolean,
  armed: boolean,
  runAction: RunDroneAction,
  speeds: { sneak: number; regular: number; run: number },
) {
  const LONG_PRESS_MS = 1000;

  const heldCommandsRef = useRef<Set<DroneDriveCommand>>(new Set());
  const modifiersRef = useRef({
    slow: false,
    shift: false,
  });
  const speedsRef = useRef(speeds);
  speedsRef.current = speeds;
  const spaceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!connected || !armed) {
      return;
    }

    const syncDriveState = () =>
      runAction((drone) =>
        drone.setDriveState(
          toDriveState(
            heldCommandsRef.current,
            getDriveSpeedFromModifiers(modifiersRef.current, speedsRef.current),
          ),
        ));

    const clearDriveState = () => {
      heldCommandsRef.current.clear();
      modifiersRef.current = {
        slow: false,
        shift: false,
      };
      if (spaceTimerRef.current !== null) {
        clearTimeout(spaceTimerRef.current);
        spaceTimerRef.current = null;
      }
      void runAction((drone) => drone.stop());
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        if (!event.repeat && spaceTimerRef.current === null) {
          event.preventDefault();
          spaceTimerRef.current = setTimeout(() => {
            spaceTimerRef.current = null;
            void runAction((drone) => drone.jump('high'));
          }, LONG_PRESS_MS);
        }
        return;
      }

      if (event.code === 'KeyC' || event.key === 'Shift') {
        const nextModifiers = {
          slow: modifiersRef.current.slow || event.code === 'KeyC',
          shift: event.shiftKey || event.key === 'Shift',
        };
        const changed =
          nextModifiers.slow !== modifiersRef.current.slow ||
          nextModifiers.shift !== modifiersRef.current.shift;

        modifiersRef.current = nextModifiers;

        if (changed && heldCommandsRef.current.size > 0) {
          event.preventDefault();
          void syncDriveState();
        }
        return;
      }

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
      if (event.code === 'Space') {
        if (spaceTimerRef.current !== null) {
          // Released before threshold — cancel high jump, do long jump instead
          event.preventDefault();
          clearTimeout(spaceTimerRef.current);
          spaceTimerRef.current = null;
          void runAction((drone) => drone.jump('long'));
        }
        return;
      }

      if (event.code === 'KeyC' || event.key === 'Shift') {
        modifiersRef.current = {
          slow: event.code !== 'KeyC' && modifiersRef.current.slow,
          shift: event.shiftKey && event.key !== 'Shift',
        };

        if (heldCommandsRef.current.size > 0) {
          event.preventDefault();
          void syncDriveState();
        }
        return;
      }

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
  }, [armed, connected, runAction]);

  useEffect(() => {
    if (connected && armed) {
      return;
    }

    heldCommandsRef.current.clear();
    modifiersRef.current = {
      slow: false,
      shift: false,
    };
  }, [armed, connected]);
}
