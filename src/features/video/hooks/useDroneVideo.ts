import { useEffect, useRef, useState, type RefObject } from 'react';

const frameStallTimeoutMs = 1_500;
const diagnosticsUpdateIntervalMs = 1_000;

export type VideoStreamState = 'idle' | 'starting' | 'streaming' | 'stalled';

export interface VideoDiagnostics {
  sourceFps: number;
  deliveredFps: number;
  renderedFps: number;
  restartCount: number;
  lastFrameAgeMs: number | null;
  streamState: VideoStreamState;
}

interface UseDroneVideoResult {
  diagnostics: VideoDiagnostics;
  showVideo: boolean;
  videoCanvasRef: RefObject<HTMLCanvasElement | null>;
}

const initialDiagnostics: VideoDiagnostics = {
  sourceFps: 0,
  deliveredFps: 0,
  renderedFps: 0,
  restartCount: 0,
  lastFrameAgeMs: null,
  streamState: 'idle',
};

const emptyBackendMetrics: DroneVideoMetrics = {
  sourceFps: 0,
  deliveredFps: 0,
  restartCount: 0,
  lastFrameAgeMs: null,
  receivedFragments: 0,
  incompleteFrames: 0,
  missingFragments: 0,
};

function resizeCanvasToParent(canvas: HTMLCanvasElement) {
  const parent = canvas.parentElement;

  if (!parent) {
    return;
  }

  const width = Math.max(1, parent.clientWidth);
  const height = Math.max(1, parent.clientHeight);

  if (canvas.width === width && canvas.height === height) {
    return;
  }

  canvas.width = width;
  canvas.height = height;
}

function clearCanvas(canvas: HTMLCanvasElement | null) {
  if (!canvas) {
    return;
  }

  const context = canvas.getContext('2d');

  if (!context) {
    return;
  }

  context.clearRect(0, 0, canvas.width, canvas.height);
}

function drawBitmapCover(
  context: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  bitmap: ImageBitmap,
) {
  const scale = Math.max(
    canvas.width / bitmap.width,
    canvas.height / bitmap.height,
  );
  const targetWidth = bitmap.width * scale;
  const targetHeight = bitmap.height * scale;
  const offsetX = (canvas.width - targetWidth) / 2;
  const offsetY = (canvas.height - targetHeight) / 2;

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(bitmap, offsetX, offsetY, targetWidth, targetHeight);
}

export function useDroneVideo(connected: boolean): UseDroneVideoResult {
  const droneApi = window.electronAPI?.drone;
  const diagnosticsApi = window.electronAPI?.diagnostics;
  const videoCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const pendingFrameRef = useRef<Uint8Array | null>(null);
  const decodingRef = useRef(false);
  const lastFrameAtRef = useRef<number | null>(null);
  const renderedFramesRef = useRef(0);
  const backendMetricsRef = useRef<DroneVideoMetrics>(emptyBackendMetrics);
  const streamStateRef = useRef<VideoStreamState>('idle');
  const [showVideo, setShowVideo] = useState(false);
  const [diagnostics, setDiagnostics] = useState<VideoDiagnostics>(
    initialDiagnostics,
  );

  useEffect(() => {
    const canvas = videoCanvasRef.current;

    if (!canvas) {
      return;
    }

    const handleResize = () => {
      resizeCanvasToParent(canvas);
    };

    handleResize();

    const observer = new ResizeObserver(handleResize);
    observer.observe(canvas.parentElement ?? canvas);
    window.addEventListener('resize', handleResize);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    if (!connected || !droneApi) {
      pendingFrameRef.current = null;
      decodingRef.current = false;
      lastFrameAtRef.current = null;
      backendMetricsRef.current = emptyBackendMetrics;
      streamStateRef.current = 'idle';
      renderedFramesRef.current = 0;
      setShowVideo(false);
      setDiagnostics(initialDiagnostics);
      clearCanvas(videoCanvasRef.current);
      return;
    }

    streamStateRef.current = 'starting';
    setShowVideo(false);
    setDiagnostics((currentDiagnostics) => ({
      ...currentDiagnostics,
      streamState: 'starting',
    }));

    const processLatestFrame = async () => {
      if (decodingRef.current) {
        return;
      }

      const nextFrame = pendingFrameRef.current;

      if (!nextFrame) {
        return;
      }

      decodingRef.current = true;
      pendingFrameRef.current = null;

      try {
        const normalizedFrame = new Uint8Array(nextFrame.byteLength);
        normalizedFrame.set(nextFrame);
        const bitmap = await createImageBitmap(
          new Blob([normalizedFrame.buffer], { type: 'image/jpeg' }),
        );
        const canvas = videoCanvasRef.current;

        if (canvas) {
          resizeCanvasToParent(canvas);
          const context = canvas.getContext('2d');

          if (context) {
            drawBitmapCover(context, canvas, bitmap);
            renderedFramesRef.current += 1;
            setShowVideo(true);
            streamStateRef.current = 'streaming';
          }
        }

        bitmap.close();
      } catch (error) {
        console.error('Failed to decode a video frame.', error);
      } finally {
        decodingRef.current = false;

        if (pendingFrameRef.current) {
          void processLatestFrame();
        }
      }
    };

    const unsubscribeFrames = droneApi.onVideoFrame((frame) => {
      lastFrameAtRef.current = Date.now();
      pendingFrameRef.current = frame.slice();
      void processLatestFrame();
    });

    const unsubscribeMetrics = droneApi.onVideoMetrics((metrics) => {
      backendMetricsRef.current = metrics;
    });

    return () => {
      unsubscribeFrames();
      unsubscribeMetrics();
      pendingFrameRef.current = null;
      decodingRef.current = false;
      lastFrameAtRef.current = null;
      streamStateRef.current = 'idle';
      renderedFramesRef.current = 0;
      setShowVideo(false);
      clearCanvas(videoCanvasRef.current);
    };
  }, [connected, droneApi]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      const lastFrameAt = lastFrameAtRef.current;
      const lastFrameAgeMs = lastFrameAt === null
        ? null
        : Math.max(0, Date.now() - lastFrameAt);

      if (
        connected &&
        lastFrameAgeMs !== null &&
        lastFrameAgeMs > frameStallTimeoutMs
      ) {
        lastFrameAtRef.current = null;
        streamStateRef.current = 'stalled';
        setShowVideo(false);
      }

      const nextDiagnostics: VideoDiagnostics = {
        sourceFps: backendMetricsRef.current.sourceFps,
        deliveredFps: backendMetricsRef.current.deliveredFps,
        renderedFps: renderedFramesRef.current,
        restartCount: backendMetricsRef.current.restartCount,
        lastFrameAgeMs,
        streamState: streamStateRef.current,
      };

      setDiagnostics(nextDiagnostics);
      diagnosticsApi?.reportVideoDiagnostics(nextDiagnostics);

      renderedFramesRef.current = 0;
    }, diagnosticsUpdateIntervalMs);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [connected, diagnosticsApi]);

  return {
    diagnostics,
    showVideo,
    videoCanvasRef,
  };
}
