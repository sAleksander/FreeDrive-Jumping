import { ToggleOption } from './ToggleOption';

interface ShowVideoDiagnosticsOptionProps {
  value: boolean;
  disabled?: boolean;
  onToggle: () => void;
}

export function ShowVideoDiagnosticsOption({ value, disabled, onToggle }: ShowVideoDiagnosticsOptionProps) {
  return (
    <ToggleOption
      description="Show the video diagnostics panel in the top-left corner."
      disabled={disabled}
      label="Video diagnostics"
      value={value}
      onToggle={onToggle}
    />
  );
}
