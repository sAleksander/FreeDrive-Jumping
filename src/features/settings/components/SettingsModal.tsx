import styles from './SettingsModal.module.css';
import { ArmOnStartupOption } from './settingOptions/ArmOnStartupOption';
import { ShowVideoDiagnosticsOption } from './settingOptions/ShowVideoDiagnosticsOption';
import { SpeedSettingsGroup } from './settingOptions/SpeedSettingsGroup';
import { VirtualDroneOption } from './settingOptions/VirtualDroneOption';

interface SettingsModalProps {
  settings: AppSettings;
  disabled?: boolean;
  open: boolean;
  onClose: () => void;
  onUpdate: (patch: Partial<AppSettings>) => void;
}

export function SettingsModal({
  settings,
  disabled = false,
  open,
  onClose,
  onUpdate,
}: SettingsModalProps) {
  if (!open) return null;

  return (
    <>
      <div className={styles.backdrop} onClick={onClose} />
      <div className={styles.modal} role="dialog" aria-modal aria-label="Settings">
        <h2 className={styles.title}>Settings</h2>
        <ArmOnStartupOption
          disabled={disabled}
          value={settings.armOnStartup === 1}
          onToggle={() => onUpdate({ armOnStartup: settings.armOnStartup === 1 ? 0 : 1 })}
        />
        <VirtualDroneOption
          disabled={disabled}
          value={settings.virtualDrone === 1}
          onToggle={() => onUpdate({ virtualDrone: settings.virtualDrone === 1 ? 0 : 1 })}
        />
        <ShowVideoDiagnosticsOption
          disabled={disabled}
          value={settings.showVideoDiagnostics === 1}
          onToggle={() => onUpdate({ showVideoDiagnostics: settings.showVideoDiagnostics === 1 ? 0 : 1 })}
        />
        <div className={styles.divider} />
        <SpeedSettingsGroup
          disabled={disabled}
          sneakSpeed={settings.sneakSpeed}
          regularSpeed={settings.regularSpeed}
          runSpeed={settings.runSpeed}
          onSneakChange={v => onUpdate({ sneakSpeed: v })}
          onRegularChange={v => onUpdate({ regularSpeed: v })}
          onRunChange={v => onUpdate({ runSpeed: v })}
        />
      </div>
    </>
  );
}
