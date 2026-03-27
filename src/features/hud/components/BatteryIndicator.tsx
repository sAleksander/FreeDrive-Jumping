import styles from './BatteryIndicator.module.css';

interface BatteryIndicatorProps {
  battery: number | null;
  connected: boolean;
}

export function BatteryIndicator({
  battery,
  connected,
}: BatteryIndicatorProps) {
  const batteryValue = connected && battery !== null
    ? Math.max(0, Math.min(100, battery))
    : null;
  const batteryLabel = batteryValue === null ? '-//-' : `${batteryValue}%`;
  const indicatorClassName = batteryValue === null
    ? `${styles.indicator} ${styles.offline}`
    : styles.indicator;

  return (
    <div className={indicatorClassName}>
      <div aria-hidden="true" className={styles.icon}>
        <span
          className={styles.fill}
          style={{ width: `${batteryValue ?? 0}%` }}
        />
      </div>
      <span className={styles.value}>{batteryLabel}</span>
    </div>
  );
}
