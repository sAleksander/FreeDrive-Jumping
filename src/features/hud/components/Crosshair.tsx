import styles from './Crosshair.module.css';

export function Crosshair() {
  return (
    <div aria-hidden="true" className={styles.crosshair}>
      <span className={`${styles.corner} ${styles.cornerTopLeft}`} />
      <span className={`${styles.corner} ${styles.cornerTopRight}`} />
      <span className={`${styles.corner} ${styles.cornerBottomLeft}`} />
      <span className={`${styles.corner} ${styles.cornerBottomRight}`} />
      <span className={styles.ring} />
      <span className={styles.dot} />
    </div>
  );
}
