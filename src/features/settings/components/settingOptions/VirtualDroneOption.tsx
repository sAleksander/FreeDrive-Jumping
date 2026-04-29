import { ToggleOption } from './ToggleOption';

interface VirtualDroneOptionProps {
  value: boolean;
  disabled?: boolean;
  onToggle: () => void;
}

export function VirtualDroneOption({ value, disabled, onToggle }: VirtualDroneOptionProps) {
  return (
    <ToggleOption
      description="Simulate the drone without hardware. Connect normally — no Wi-Fi needed."
      disabled={disabled}
      label="Virtual drone mode"
      value={value}
      onToggle={onToggle}
    />
  );
}
