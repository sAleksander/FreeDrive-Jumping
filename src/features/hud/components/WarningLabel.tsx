import type { DroneHudAlert } from '../../drone/lib/hudAlert';
import styles from './WarningLabel.module.css';

interface WarningLabelProps {
  alert: DroneHudAlert | null;
  preview?: boolean;
}

export function WarningLabel({ alert, preview = false }: WarningLabelProps) {
  if (!alert) {
    if (!preview) {
      return null;
    }

    return (
      <>
        <div className={`${styles.label} ${styles.warning} ${styles.previewCritical}`}>
          warning label
        </div>
        <div className={`${styles.label} ${styles.info} ${styles.previewInfo}`}>
          info label
        </div>
      </>
    );
  }

  const activeAlert = alert;
  const toneClassName = {
    info: styles.info,
    warning: styles.warning,
    critical: styles.critical,
  }[activeAlert.tone];
  const positionClassName = {
    info: styles.positionInfo,
    warning: styles.positionCritical,
    critical: styles.positionCritical,
  }[activeAlert.tone];

  return (
    <div
      className={`${styles.label} ${toneClassName} ${positionClassName}`}
      role="status"
      aria-live="polite"
    >
      {activeAlert.message}
    </div>
  );
}
