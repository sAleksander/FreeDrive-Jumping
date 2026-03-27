import type { PropsWithChildren, RefObject } from 'react';
import styles from './FpvStage.module.css';

interface FpvStageProps {
  noiseCanvasRef: RefObject<HTMLCanvasElement | null>;
}

export function FpvStage({
  children,
  noiseCanvasRef,
}: PropsWithChildren<FpvStageProps>) {
  return (
    <main className={styles.app}>
      <section className={styles.stage} aria-label="Drone camera view placeholder">
        <canvas
          aria-hidden="true"
          className={styles.noise}
          ref={noiseCanvasRef}
        />
        <div aria-hidden="true" className={styles.scanlines} />
        <div aria-hidden="true" className={styles.vignette} />
        {children}
      </section>
    </main>
  );
}
