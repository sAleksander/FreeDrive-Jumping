import { useEffect, useState } from 'react';
import styles from './SettingsModal.module.css';

interface SettingsModalProps {
  armOnStartup: boolean;
  sneakSpeed: number;
  regularSpeed: number;
  runSpeed: number;
  disabled?: boolean;
  open: boolean;
  onClose: () => void;
  onToggleArmOnStartup: () => void;
  onSneakSpeedChange: (v: number) => void;
  onRegularSpeedChange: (v: number) => void;
  onRunSpeedChange: (v: number) => void;
}

export function SettingsModal({
  armOnStartup,
  sneakSpeed,
  regularSpeed,
  runSpeed,
  disabled = false,
  open,
  onClose,
  onToggleArmOnStartup,
  onSneakSpeedChange,
  onRegularSpeedChange,
  onRunSpeedChange,
}: SettingsModalProps) {
  const [localSneak, setLocalSneak] = useState(sneakSpeed);
  const [localRegular, setLocalRegular] = useState(regularSpeed);
  const [localRun, setLocalRun] = useState(runSpeed);

  useEffect(() => { setLocalSneak(sneakSpeed); }, [sneakSpeed]);
  useEffect(() => { setLocalRegular(regularSpeed); }, [regularSpeed]);
  useEffect(() => { setLocalRun(runSpeed); }, [runSpeed]);

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

        <div className={styles.divider} />

        <div className={styles.sliderSection}>
          <div className={styles.sliderRow}>
            <div className={styles.sliderHeader}>
              <p className={styles.label}>Sneak speed</p>
              <span className={styles.sliderValue}>{localSneak}%</span>
            </div>
            <input
              className={styles.slider}
              disabled={disabled}
              max={100}
              min={0}
              step={5}
              type="range"
              value={localSneak}
              onChange={e => setLocalSneak(Number(e.target.value))}
              onPointerUp={e => onSneakSpeedChange(Number((e.target as HTMLInputElement).value))}
            />
          </div>

          <div className={styles.sliderRow}>
            <div className={styles.sliderHeader}>
              <p className={styles.label}>Regular speed</p>
              <span className={styles.sliderValue}>{localRegular}%</span>
            </div>
            <input
              className={styles.slider}
              disabled={disabled}
              max={100}
              min={0}
              step={5}
              type="range"
              value={localRegular}
              onChange={e => setLocalRegular(Number(e.target.value))}
              onPointerUp={e => onRegularSpeedChange(Number((e.target as HTMLInputElement).value))}
            />
          </div>

          <div className={styles.sliderRow}>
            <div className={styles.sliderHeader}>
              <p className={styles.label}>Run speed</p>
              <span className={styles.sliderValue}>{localRun}%</span>
            </div>
            <input
              className={styles.slider}
              disabled={disabled}
              max={100}
              min={0}
              step={5}
              type="range"
              value={localRun}
              onChange={e => setLocalRun(Number(e.target.value))}
              onPointerUp={e => onRunSpeedChange(Number((e.target as HTMLInputElement).value))}
            />
          </div>
        </div>
      </div>
    </>
  );
}
