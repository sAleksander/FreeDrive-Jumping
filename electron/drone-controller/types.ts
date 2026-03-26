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

export interface DroneStatus {
  phase: DronePhase;
  connected: boolean;
  battery: number | null;
  posture: DronePosture;
  activeCommand: DroneDriveCommand | null;
  lastEvent: string | null;
  lastError: string | null;
  updatedAt: string | null;
}

export interface NodeSumoClient {
  connect(callback?: (error?: unknown) => void): void;
  disconnect(): void;
  forward(speed: number): this;
  backward(speed: number): this;
  left(speed: number): this;
  right(speed: number): this;
  stop(): this;
  on(event: string, listener: (...args: unknown[]) => void): this;
  once(event: string, listener: (...args: unknown[]) => void): this;
  removeAllListeners(): this;
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
  readonly driveSpeed: number;
  driveLoop: NodeJS.Timeout | null;
  readonly driveRefreshIntervalMs: number;
  readonly onStatusChange: (status: DroneStatus) => void;
}
