import styles from './DroneModelBadge.module.css';

const MODEL_LABELS: Record<DroneModel, string | null> = {
  sumo: 'SUMO',
  race: 'RACE',
  night: 'NIGHT',
  unknown: null,
};

interface DroneModelBadgeProps {
  connected: boolean;
  model: DroneModel;
}

export function DroneModelBadge({ connected, model }: DroneModelBadgeProps) {
  const label = MODEL_LABELS[model];
  if (!connected || label === null) return null;

  return (
    <div className={`${styles.badge} ${styles[model]}`}>
      {label}
    </div>
  );
}
