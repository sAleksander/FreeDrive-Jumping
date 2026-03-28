import { connectDrone } from './connect';
import { disconnectDrone } from './disconnect';
import { driveDrone, setDriveState } from './drive';
import {
  createIdleDriveState,
  createInitialStatus,
  getStatusSnapshot,
} from './state';
import { stopDrone } from './stop';
import type {
  DroneControllerContext,
  DroneDriveCommand,
  DroneDriveState,
  DronePhase,
  DronePosture,
  DroneStatus,
  DroneVideoMetrics,
} from './types';

export type {
  DroneDriveCommand,
  DroneDriveState,
  DronePhase,
  DronePosture,
  DroneStatus,
  DroneVideoMetrics,
};

export class DroneController {
  private readonly context: DroneControllerContext;

  constructor(
    private readonly onStatusChange: (status: DroneStatus) => void,
    private readonly onVideoFrame: (frame: Buffer) => void,
    private readonly onVideoMetrics: (metrics: DroneVideoMetrics) => void,
  ) {
    this.context = {
      drone: null,
      status: createInitialStatus(),
      driveState: createIdleDriveState(),
      driveSpeed: 30,
      driveLoop: null,
      driveRefreshIntervalMs: 25,
      videoWatchdog: null,
      videoRestartTimeout: null,
      videoLastFrameAt: null,
      videoLastDeliveredAt: null,
      videoMetricsLoop: null,
      videoSourceFrames: 0,
      videoDeliveredFrames: 0,
      videoRestartCount: 0,
      videoReceivedFragments: 0,
      videoIncompleteFrames: 0,
      videoMissingFragments: 0,
      videoCurrentFrameNumber: null,
      videoCurrentFrameExpectedFragments: 0,
      videoCurrentFrameFragments: null,
      videoWarmupUntil: null,
      videoLastRestartAt: null,
      videoFrameIntervalMs: 33,
      videoStallTimeoutMs: 1_500,
      videoRestartDelayMs: 250,
      videoWarmupDurationMs: 3_000,
      videoHighLatencyThresholdMs: 900,
      videoLowFpsThreshold: 2,
      videoRestartCooldownMs: 4_000,
      onStatusChange: this.onStatusChange,
      onVideoFrame: this.onVideoFrame,
      onVideoMetrics: this.onVideoMetrics,
    };
  }

  getStatus() {
    return getStatusSnapshot(this.context);
  }

  async connect() {
    return connectDrone(this.context);
  }

  async disconnect() {
    return disconnectDrone(this.context);
  }

  async drive(command: DroneDriveCommand) {
    return driveDrone(this.context, command);
  }

  async setDriveState(driveState: DroneDriveState) {
    return setDriveState(this.context, driveState);
  }

  async stop() {
    return stopDrone(this.context);
  }
}
