import styles from '../SettingsModal.module.css';
import { SpeedOption } from './SpeedOption';

interface SpeedSettingsGroupProps {
  sneakSpeed: number;
  regularSpeed: number;
  runSpeed: number;
  disabled?: boolean;
  onSneakChange: (v: number) => void;
  onRegularChange: (v: number) => void;
  onRunChange: (v: number) => void;
}

export function SpeedSettingsGroup({
  sneakSpeed,
  regularSpeed,
  runSpeed,
  disabled,
  onSneakChange,
  onRegularChange,
  onRunChange,
}: SpeedSettingsGroupProps) {
  return (
    <div className={styles.sliderSection}>
      <SpeedOption
        disabled={disabled}
        label="Sneak speed"
        value={sneakSpeed}
        onChange={onSneakChange}
      />
      <SpeedOption
        disabled={disabled}
        label="Regular speed"
        value={regularSpeed}
        onChange={onRegularChange}
      />
      <SpeedOption
        disabled={disabled}
        label="Run speed"
        value={runSpeed}
        onChange={onRunChange}
      />
    </div>
  );
}
