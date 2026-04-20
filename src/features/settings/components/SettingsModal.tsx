import styles from './SettingsModal.module.css';

interface SettingsModalProps {
  armOnStartup: boolean;
  disabled?: boolean;
  open: boolean;
  onClose: () => void;
  onToggleArmOnStartup: () => void;
}

export function SettingsModal({
  armOnStartup,
  disabled = false,
  open,
  onClose,
  onToggleArmOnStartup,
}: SettingsModalProps) {
  if (!open) return null;

  return (
    <>
      <div className={styles.backdrop} onClick={onClose} />
      <div className={styles.modal} role="dialog" aria-modal aria-label="Settings">
        <h2 className={styles.title}>Settings</h2>
        <div className={styles.section}>
          <div className={styles.copy}>
            <p className={styles.label}>Arm drone on startup</p>
            <p className={styles.description}>
              Automatically arm the drone after a successful connection.
            </p>
          </div>
          <button
            aria-checked={armOnStartup}
            className={`${styles.toggle} ${armOnStartup ? styles.enabled : styles.disabled}`}
            disabled={disabled}
            onClick={onToggleArmOnStartup}
            role="switch"
            type="button"
          >
            <span className={styles.track}>
              <span className={styles.thumb} />
            </span>
          </button>
        </div>
      </div>
    </>
  );
}
