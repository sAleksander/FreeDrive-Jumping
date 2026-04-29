import { ToggleOption } from './ToggleOption';

interface ArmOnStartupOptionProps {
  value: boolean;
  disabled?: boolean;
  onToggle: () => void;
}

export function ArmOnStartupOption({ value, disabled, onToggle }: ArmOnStartupOptionProps) {
  return (
    <ToggleOption
      description="Automatically arm the drone after a successful connection."
      disabled={disabled}
      label="Arm drone on startup"
      value={value}
      onToggle={onToggle}
    />
  );
}
