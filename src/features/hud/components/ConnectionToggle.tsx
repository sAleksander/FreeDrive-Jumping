interface ConnectionToggleProps {
  disabled: boolean;
  label: string;
  onToggle: () => void;
}

export function ConnectionToggle({
  disabled,
  label,
  onToggle,
}: ConnectionToggleProps) {
  return (
    <div className="top-control">
      <button
        className="control-button control-button--primary"
        disabled={disabled}
        onClick={onToggle}
        type="button"
      >
        {label}
      </button>
    </div>
  );
}
