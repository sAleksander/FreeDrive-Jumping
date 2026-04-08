import type { Socket as UdpSocket } from 'node:dgram';
import type { Socket as NetSocket } from 'node:net';

export type DronePhase = 'idle' | 'connecting' | 'connected' | 'error';
export type DronePosture =
  | 'standing'
  | 'jumper'
  | 'kicker'
  | 'stuck'
  | 'unknown'
  | null;
export type DroneDriveCommand = 'forward' | 'backward' | 'left' | 'right';
export interface DroneDriveState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  speed: number;
}

export interface DroneStatus {
  phase: DronePhase;
  connected: boolean;
  armed: boolean;
  battery: number | null;
  posture: DronePosture;
  activeCommands: DroneDriveCommand[];
  lastEvent: string | null;
  lastError: string | null;
  updatedAt: string | null;
}

export interface DroneVideoMetrics {
  sourceFps: number;
  deliveredFps: number;
  restartCount: number;
  lastFrameAgeMs: number | null;
  receivedFragments: number;
  incompleteFrames: number;
  missingFragments: number;
}

export interface NodeSumoArstreamFrame {
  frameNumber: number;
  frameFlags: number;
  fragmentNumber: number;
  fragmentsPerFrame: number;
  frame: Buffer;
}

export interface NodeSumoArstreamState {
  frameNumber: number;
  frameFlags?: number;
  frameACK?: Buffer;
  frame: Buffer;
  fragments: Array<Buffer | undefined>;
}

export interface NodeSumoClient {
  connect(callback?: (error?: unknown) => void): void;
  disconnect(): void;
  forward(speed: number): this;
  backward(speed: number): this;
  left(speed: number): this;
  right(speed: number): this;
  stop(): this;
  videoStreaming(options?: { enabled?: number }): this;
  on(event: string, listener: (...args: unknown[]) => void): this;
  once(event: string, listener: (...args: unknown[]) => void): this;
  removeAllListeners(): this;
  _createARStreamACK?: (frame: NodeSumoArstreamFrame) => Buffer;
  _arstreamFrame?: NodeSumoArstreamState;
  _c2dClient?: UdpSocket;
  _d2cServer?: UdpSocket;
  _discoveryClient?: NetSocket;
}

export interface NodeSumoModule {
  createClient(options?: { ip?: string }): NodeSumoClient;
}

export interface DroneControllerContext {
  drone: NodeSumoClient | null;
  status: DroneStatus;
  driveState: DroneDriveState;
  driveLoop: NodeJS.Timeout | null;
  driveLoopMode: 'stopped' | 'active' | 'armed-forward-zero';
  readonly driveRefreshIntervalMs: number;
  videoWatchdog: NodeJS.Timeout | null;
  videoRestartTimeout: NodeJS.Timeout | null;
  videoLastFrameAt: number | null;
  videoLastDeliveredAt: number | null;
  videoMetricsLoop: NodeJS.Timeout | null;
  videoSourceFrames: number;
  videoDeliveredFrames: number;
  videoRestartCount: number;
  videoReceivedFragments: number;
  videoIncompleteFrames: number;
  videoMissingFragments: number;
  videoCurrentFrameNumber: number | null;
  videoCurrentFrameExpectedFragments: number;
  videoCurrentFrameFragments: Set<number> | null;
  videoWarmupUntil: number | null;
  videoLastRestartAt: number | null;
  readonly videoFrameIntervalMs: number;
  readonly videoStallTimeoutMs: number;
  readonly videoRestartDelayMs: number;
  readonly videoWarmupDurationMs: number;
  readonly videoHighLatencyThresholdMs: number;
  readonly videoLowFpsThreshold: number;
  readonly videoRestartCooldownMs: number;
  readonly onDiagnosticEvent: (event: string, data?: unknown) => void;
  readonly onStatusChange: (status: DroneStatus) => void;
  readonly onVideoFrame: (frame: Buffer) => void;
  readonly onVideoMetrics: (metrics: DroneVideoMetrics) => void;
}
