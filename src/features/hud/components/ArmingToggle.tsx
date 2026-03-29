import styles from './ArmingToggle.module.css';

interface ArmingToggleProps {
  armed: boolean;
  disabled: boolean;
  onToggle: () => void;
}

export function ArmingToggle({
  armed,
  disabled,
  onToggle,
}: ArmingToggleProps) {
  return (
    <button
      aria-checked={armed}
      className={`${styles.toggle} ${armed ? styles.armed : styles.disarmed}`}
      disabled={disabled}
      onClick={onToggle}
      role="switch"
      type="button"
    >
      <span className={styles.track}>
        <span className={styles.thumb} />
      </span>
      <span className={styles.label}>{armed ? 'Armed' : 'Disarmed'}</span>
    </button>
  );
}
