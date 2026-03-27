import { useEffect, useRef } from 'react';

const noiseFrameIntervalMs = 90;
const noiseScaleDivisor = 4;

export function useRxNoiseCanvas(enabled: boolean) {
  const noiseCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = noiseCanvasRef.current;

    if (!canvas || !enabled) {
      return;
    }

    const context = canvas.getContext('2d', { alpha: false });

    if (!context) {
      return;
    }

    let frameId = 0;
    let timeoutId: number | null = null;
    let imageData = context.createImageData(1, 1);

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      const sourceWidth = parent?.clientWidth ?? window.innerWidth;
      const sourceHeight = parent?.clientHeight ?? window.innerHeight;
      const width = Math.max(240, Math.floor(sourceWidth / noiseScaleDivisor));
      const height = Math.max(135, Math.floor(sourceHeight / noiseScaleDivisor));

      canvas.width = width;
      canvas.height = height;
      imageData = context.createImageData(width, height);
    };

    const renderNoise = () => {
      const { data } = imageData;

      for (let index = 0; index < data.length; index += 4) {
        const value = Math.random() > 0.985
          ? 255
          : Math.max(0, Math.min(255, 96 + Math.floor((Math.random() - 0.5) * 180)));

        data[index] = value;
        data[index + 1] = value;
        data[index + 2] = value;
        data[index + 3] = 255;
      }

      context.putImageData(imageData, 0, 0);
      context.fillStyle = 'rgba(255, 255, 255, 0.16)';

      const glitchBandCount = 2 + Math.floor(Math.random() * 4);

      for (let bandIndex = 0; bandIndex < glitchBandCount; bandIndex += 1) {
        const bandY = Math.floor(Math.random() * canvas.height);
        const bandHeight = 1 + Math.floor(Math.random() * 4);

        context.fillRect(0, bandY, canvas.width, bandHeight);
      }

      timeoutId = window.setTimeout(() => {
        frameId = window.requestAnimationFrame(renderNoise);
      }, noiseFrameIntervalMs);
    };

    resizeCanvas();
    renderNoise();
    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);

      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }

      window.cancelAnimationFrame(frameId);
    };
  }, [enabled]);

  return noiseCanvasRef;
}
