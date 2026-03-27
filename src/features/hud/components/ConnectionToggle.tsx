import styles from './ConnectionToggle.module.css';

interface ConnectionToggleProps {
  disabled: boolean;
  label: string;
  onToggle: () => void;
}

export function ConnectionToggle({
  disabled,
  label,
  onToggle,
}: ConnectionToggleProps) {
  return (
    <div className={styles.topControl}>
      <button
        className={`${styles.button} ${styles.buttonPrimary}`}
        disabled={disabled}
        onClick={onToggle}
        type="button"
      >
        {label}
      </button>
    </div>
  );
}
