import { useEffect, useState } from 'react';
import styles from '../SettingsModal.module.css';

interface SpeedOptionProps {
  label: string;
  value: number;
  disabled?: boolean;
  onChange: (v: number) => void;
}

export function SpeedOption({
  label,
  value,
  disabled = false,
  onChange,
}: SpeedOptionProps) {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  return (
    <div className={styles.sliderRow}>
      <div className={styles.sliderHeader}>
        <p className={styles.label}>{label}</p>
        <span className={styles.sliderValue}>{localValue}%</span>
      </div>
      <input
        className={styles.slider}
        disabled={disabled}
        max={100}
        min={0}
        step={5}
        type="range"
        value={localValue}
        onChange={e => setLocalValue(Number(e.target.value))}
        onPointerUp={e => onChange(Number((e.target as HTMLInputElement).value))}
      />
    </div>
  );
}
