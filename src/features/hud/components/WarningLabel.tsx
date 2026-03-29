import type { DroneHudAlert } from '../../drone/lib/hudAlert';
import styles from './WarningLabel.module.css';

interface WarningLabelProps {
  alert: DroneHudAlert | null;
}

export function WarningLabel({ alert }: WarningLabelProps) {
  if (!alert) {
    return null;
  }

  return (
    <div
      className={`${styles.label} ${alert.tone === 'error' ? styles.error : styles.warning}`}
      role="status"
      aria-live="polite"
    >
      {alert.message}
    </div>
  );
}
