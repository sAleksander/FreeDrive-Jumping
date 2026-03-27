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
    ? 'battery-indicator battery-indicator--offline'
    : 'battery-indicator';

  return (
    <div className={indicatorClassName}>
      <div aria-hidden="true" className="battery-indicator__icon">
        <span
          className="battery-indicator__fill"
          style={{ width: `${batteryValue ?? 0}%` }}
        />
      </div>
      <span className="battery-indicator__value">{batteryLabel}</span>
    </div>
  );
}
