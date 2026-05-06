import { ToggleOption } from './ToggleOption';

interface VirtualDroneOptionProps {
  value: boolean;
  disabled?: boolean;
  onToggle: () => void;
}

export function VirtualDroneOption({ value, disabled, onToggle }: VirtualDroneOptionProps) {
  return (
    <ToggleOption
      description="Simulate a drone locally without a physical device."
      disabled={disabled}
      label="Virtual drone"
      value={value}
      onToggle={onToggle}
    />
  );
}
