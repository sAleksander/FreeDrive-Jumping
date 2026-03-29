import { useEffect, useState } from 'react';

export function useArmingState(connected: boolean) {
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!connected) {
      setArmed(false);
    }
  }, [connected]);

  return {
    armed,
    toggleArmed: () => {
      if (!connected) {
        return;
      }

      setArmed((currentArmed) => !currentArmed);
    },
  };
}
