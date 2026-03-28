import type { PropsWithChildren, RefObject } from 'react';
import styles from './FpvStage.module.css';

interface FpvStageProps {
  noiseCanvasRef: RefObject<HTMLCanvasElement | null>;
  showNoise: boolean;
  showVideo: boolean;
  videoCanvasRef: RefObject<HTMLCanvasElement | null>;
}

export function FpvStage({
  children,
  noiseCanvasRef,
  showNoise,
  showVideo,
  videoCanvasRef,
}: PropsWithChildren<FpvStageProps>) {
  return (
    <main className={styles.app}>
      <section className={styles.stage} aria-label="Drone camera view placeholder">
        <canvas
          aria-hidden="true"
          className={`${styles.videoCanvas} ${showVideo ? styles.videoCanvasVisible : ''}`}
          ref={videoCanvasRef}
        />
        {showNoise ? (
          <canvas
            aria-hidden="true"
            className={styles.noise}
            ref={noiseCanvasRef}
          />
        ) : null}
        <div aria-hidden="true" className={styles.scanlines} />
        <div aria-hidden="true" className={styles.vignette} />
        {children}
      </section>
    </main>
  );
}
