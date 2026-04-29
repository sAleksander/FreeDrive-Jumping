import styles from '../SettingsModal.module.css';

interface ToggleOptionProps {
  label: string;
  description: string;
  value: boolean;
  disabled?: boolean;
  onToggle: () => void;
}

export function ToggleOption({
  label,
  description,
  value,
  disabled = false,
  onToggle,
}: ToggleOptionProps) {
  return (
    <div className={styles.section}>
      <div className={styles.copy}>
        <p className={styles.label}>{label}</p>
        <p className={styles.description}>{description}</p>
      </div>
      <button
        aria-checked={value}
        className={`${styles.toggle} ${value ? styles.enabled : styles.disabled}`}
        disabled={disabled}
        onClick={onToggle}
        role="switch"
        type="button"
      >
        <span className={styles.track}>
          <span className={styles.thumb} />
        </span>
      </button>
    </div>
  );
}
