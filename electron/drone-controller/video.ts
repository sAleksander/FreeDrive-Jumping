import { publishStatus } from './state';
import type {
  DroneControllerContext,
  NodeSumoArstreamFrame,
  NodeSumoArstreamState,
  DroneVideoMetrics,
  NodeSumoClient,
} from './types';

const videoWatchdogIntervalMs = 500;
const videoMetricsIntervalMs = 1_000;

function resetNodeSumoArstreamState(drone: NodeSumoClient) {
  drone._arstreamFrame = {
    frameNumber: 0,
    frameFlags: 0,
    frameACK: Buffer.alloc(16),
    frame: Buffer.alloc(0),
    fragments: [],
  };
}

function resetTrackedVideoFrameState(context: DroneControllerContext) {
  context.videoCurrentFrameNumber = null;
  context.videoCurrentFrameExpectedFragments = 0;
  context.videoCurrentFrameFragments = null;
}

function resetVideoStatsWindow(context: DroneControllerContext) {
  context.videoSourceFrames = 0;
  context.videoDeliveredFrames = 0;
  context.videoReceivedFragments = 0;
  context.videoIncompleteFrames = 0;
  context.videoMissingFragments = 0;
}

function publishVideoMetrics(context: DroneControllerContext) {
  const metrics: DroneVideoMetrics = {
    sourceFps: context.videoSourceFrames,
    deliveredFps: context.videoDeliveredFrames,
    restartCount: context.videoRestartCount,
    lastFrameAgeMs: context.videoLastFrameAt === null
      ? null
      : Math.max(0, Date.now() - context.videoLastFrameAt),
    receivedFragments: context.videoReceivedFragments,
    incompleteFrames: context.videoIncompleteFrames,
    missingFragments: context.videoMissingFragments,
  };

  context.onVideoMetrics(metrics);
}

function finalizeTrackedVideoFrame(context: DroneControllerContext) {
  if (
    context.videoCurrentFrameNumber === null ||
    context.videoCurrentFrameFragments === null
  ) {
    return;
  }

  const receivedFragments = context.videoCurrentFrameFragments.size;
  const expectedFragments = context.videoCurrentFrameExpectedFragments;

  if (expectedFragments > 0 && receivedFragments < expectedFragments) {
    context.videoIncompleteFrames += 1;
    context.videoMissingFragments += expectedFragments - receivedFragments;
  }
}

function trackVideoFragment(
  context: DroneControllerContext,
  frame: NodeSumoArstreamFrame,
) {
  context.videoReceivedFragments += 1;

  if (context.videoCurrentFrameNumber !== frame.frameNumber) {
    finalizeTrackedVideoFrame(context);
    context.videoCurrentFrameNumber = frame.frameNumber;
    context.videoCurrentFrameExpectedFragments = frame.fragmentsPerFrame;
    context.videoCurrentFrameFragments = new Set<number>();
  }

  if (context.videoCurrentFrameFragments === null) {
    context.videoCurrentFrameFragments = new Set<number>();
  }

  context.videoCurrentFrameExpectedFragments = Math.max(
    context.videoCurrentFrameExpectedFragments,
    frame.fragmentsPerFrame,
  );
  context.videoCurrentFrameFragments.add(frame.fragmentNumber);
}

function attachVideoTransportDiagnostics(
  context: DroneControllerContext,
  drone: NodeSumoClient,
) {
  if (!drone._createARStreamACK) {
    return;
  }

  const originalCreateARStreamAck = drone._createARStreamACK.bind(drone);

  drone._createARStreamACK = (frame: NodeSumoArstreamFrame) => {
    trackVideoFragment(context, frame);
    return originalCreateARStreamAck(frame);
  };
}

function disableVideoStreaming(context: DroneControllerContext) {
  if (!context.drone) {
    return;
  }

  try {
    context.drone.videoStreaming({ enabled: 0 });
  } catch {
    // Best effort cleanup for an old library.
  }

  context.videoWarmupUntil = null;
}

function enableVideoStreaming(context: DroneControllerContext) {
  if (!context.drone) {
    return;
  }

  resetNodeSumoArstreamState(context.drone);
  resetTrackedVideoFrameState(context);
  context.videoWarmupUntil = Date.now() + context.videoWarmupDurationMs;
  context.drone.videoStreaming({ enabled: 1 });
}

function clearVideoRestartTimeout(context: DroneControllerContext) {
  if (!context.videoRestartTimeout) {
    return;
  }

  clearTimeout(context.videoRestartTimeout);
  context.videoRestartTimeout = null;
}

function clearVideoWatchdog(context: DroneControllerContext) {
  if (!context.videoWatchdog) {
    return;
  }

  clearInterval(context.videoWatchdog);
  context.videoWatchdog = null;
}

function clearVideoMetricsLoop(context: DroneControllerContext) {
  if (!context.videoMetricsLoop) {
    return;
  }

  clearInterval(context.videoMetricsLoop);
  context.videoMetricsLoop = null;
}

function scheduleVideoRestart(
  context: DroneControllerContext,
  reason: string,
) {
  if (!context.drone || context.videoRestartTimeout) {
    return;
  }

  if (
    context.videoLastRestartAt !== null &&
    Date.now() - context.videoLastRestartAt < context.videoRestartCooldownMs
  ) {
    return;
  }

  context.videoRestartCount += 1;
  context.videoLastRestartAt = Date.now();
  publishStatus(context, {
    lastEvent: reason,
  });
  publishVideoMetrics(context);

  disableVideoStreaming(context);
  resetTrackedVideoFrameState(context);

  context.videoRestartTimeout = setTimeout(() => {
    context.videoRestartTimeout = null;

    if (!context.drone || !context.status.connected) {
      return;
    }

    context.videoLastFrameAt = Date.now();
    context.videoLastDeliveredAt = null;
    resetVideoStatsWindow(context);

    try {
      enableVideoStreaming(context);
    } catch {
      // The watchdog will try again if the stream still does not resume.
    }
  }, context.videoRestartDelayMs);
}

export function stopVideoPipeline(context: DroneControllerContext) {
  clearVideoRestartTimeout(context);
  clearVideoWatchdog(context);
  clearVideoMetricsLoop(context);
  finalizeTrackedVideoFrame(context);
  context.videoLastFrameAt = null;
  context.videoLastDeliveredAt = null;
  context.videoWarmupUntil = null;
  context.videoLastRestartAt = null;
  resetVideoStatsWindow(context);
  resetTrackedVideoFrameState(context);

  if (context.drone) {
    resetNodeSumoArstreamState(context.drone);
  }

  disableVideoStreaming(context);
  publishVideoMetrics(context);
}

export function attachVideoListeners(
  context: DroneControllerContext,
  drone: NodeSumoClient,
) {
  attachVideoTransportDiagnostics(context, drone);

  drone.on('video', (frame: unknown) => {
    if (!Buffer.isBuffer(frame)) {
      return;
    }

    const now = Date.now();
    context.videoSourceFrames += 1;
    context.videoLastFrameAt = now;

    if (
      context.videoLastDeliveredAt !== null &&
      now - context.videoLastDeliveredAt < context.videoFrameIntervalMs
    ) {
      return;
    }

    context.videoLastDeliveredAt = now;
    context.videoDeliveredFrames += 1;
    context.onVideoFrame(frame);
  });
}

export function startVideoPipeline(context: DroneControllerContext) {
  if (!context.drone || !context.status.connected) {
    return;
  }

  stopVideoPipeline(context);

  context.videoLastFrameAt = Date.now();
  context.videoLastDeliveredAt = null;
  context.videoLastRestartAt = null;
  context.videoRestartCount = 0;
  resetVideoStatsWindow(context);
  resetTrackedVideoFrameState(context);
  publishVideoMetrics(context);
  enableVideoStreaming(context);

  context.videoWatchdog = setInterval(() => {
    if (!context.drone || !context.status.connected) {
      stopVideoPipeline(context);
      return;
    }

    const lastFrameAt = context.videoLastFrameAt;

    if (
      lastFrameAt !== null &&
      Date.now() - lastFrameAt > context.videoStallTimeoutMs
    ) {
      scheduleVideoRestart(context, 'Video stalled, restarting stream');
    }
  }, videoWatchdogIntervalMs);

  context.videoMetricsLoop = setInterval(() => {
    const lastFrameAgeMs = context.videoLastFrameAt === null
      ? null
      : Math.max(0, Date.now() - context.videoLastFrameAt);
    const inWarmup = (
      context.videoWarmupUntil !== null &&
      Date.now() < context.videoWarmupUntil
    );

    publishVideoMetrics(context);

    if (context.drone && context.status.connected && !context.videoRestartTimeout) {
      const startupLossDetected = (
        context.videoIncompleteFrames >= 2 ||
        context.videoMissingFragments >= 2
      );
      const latencyTooHigh = (
        lastFrameAgeMs !== null &&
        lastFrameAgeMs > context.videoHighLatencyThresholdMs
      );
      const fpsCollapsed = context.videoSourceFrames <= context.videoLowFpsThreshold;

      if (inWarmup && (startupLossDetected || (latencyTooHigh && fpsCollapsed))) {
        scheduleVideoRestart(context, 'Video startup unstable, restarting stream');
      } else if (latencyTooHigh && fpsCollapsed) {
        scheduleVideoRestart(context, 'Video latency high, restarting stream');
      }
    }

    resetVideoStatsWindow(context);
  }, videoMetricsIntervalMs);
}
