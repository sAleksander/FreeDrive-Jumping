import type { Socket as UdpSocket } from 'node:dgram';
import type { Socket as NetSocket } from 'node:net';

type DronePhase = 'idle' | 'connecting' | 'connected' | 'error';
type DronePosture = 'standing' | 'jumper' | 'kicker' | 'stuck' | 'unknown' | null;
type DroneDriveCommand = 'forward' | 'backward' | 'left' | 'right';

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

interface NodeSumoClient {
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

interface NodeSumoModule {
  createClient(options?: { ip?: string }): NodeSumoClient;
}

const sumo = require('node-sumo') as NodeSumoModule;

const initialStatus: DroneStatus = {
  phase: 'idle',
  connected: false,
  battery: null,
  posture: null,
  activeCommand: null,
  lastEvent: null,
  lastError: null,
  updatedAt: null,
};

function toErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  if (typeof error === 'string' && error.trim()) {
    return error;
  }

  return fallback;
}

function closeUdpSocket(socket?: UdpSocket) {
  if (!socket) {
    return;
  }

  try {
    socket.close();
  } catch {
    // Best effort cleanup for old library internals.
  }
}

function destroyNetSocket(socket?: NetSocket) {
  if (!socket) {
    return;
  }

  try {
    socket.destroy();
  } catch {
    // Best effort cleanup for old library internals.
  }
}

export class DroneController {
  private drone: NodeSumoClient | null = null;
  private status: DroneStatus = initialStatus;
  private readonly driveSpeed = 30;

  constructor(
    private readonly onStatusChange: (status: DroneStatus) => void,
  ) {}

  getStatus() {
    return { ...this.status };
  }

  async connect() {
    if (this.status.phase === 'connecting' || this.status.connected) {
      return this.getStatus();
    }

    this.teardownDrone();
    const drone = sumo.createClient();
    this.drone = drone;
    this.attachDroneListeners(drone);
    this.publishStatus({
      phase: 'connecting',
      connected: false,
      battery: null,
      posture: null,
      activeCommand: null,
      lastError: null,
      lastEvent: 'Starting discovery handshake',
    });

    try {
      await new Promise<void>((resolve, reject) => {
        let settled = false;

        const finish = (callback: () => void) => {
          if (settled) {
            return;
          }

          settled = true;
          clearTimeout(timeoutId);
          callback();
        };

        const timeoutId = setTimeout(() => {
          finish(() => {
            reject(
              new Error(
                'Connection timed out after 10 seconds. Verify the Mac is joined to the drone Wi-Fi and no other controller is active.',
              ),
            );
          });
        }, 10_000);

        drone.once('ready', () => {
          finish(() => {
            this.publishStatus({
              phase: 'connected',
              connected: true,
              lastError: null,
              lastEvent: 'Drone ready for commands',
            });
            resolve();
          });
        });

        drone.connect((error) => {
          if (error) {
            finish(() => {
              reject(
                new Error(
                  toErrorMessage(
                    error,
                    'The drone rejected the discovery handshake.',
                  ),
                ),
              );
            });
          }
        });
      });

      return this.getStatus();
    } catch (error) {
      const message = toErrorMessage(
        error,
        'Unable to connect to the drone.',
      );

      this.teardownDrone();
      this.publishStatus({
        phase: 'error',
        connected: false,
        battery: null,
        posture: null,
        activeCommand: null,
        lastError: message,
        lastEvent: 'Connection failed',
      });

      throw new Error(message);
    }
  }

  async disconnect() {
    if (this.drone) {
      try {
        this.drone.stop();
      } catch {
        // Ignore stop failures during disconnect.
      }
    }

    this.teardownDrone();
    this.publishStatus({
      ...initialStatus,
      lastEvent: 'Disconnected',
    });
    return this.getStatus();
  }

  async drive(command: DroneDriveCommand) {
    if (!this.drone || !this.status.connected) {
      return this.getStatus();
    }

    if (this.status.activeCommand === command) {
      return this.getStatus();
    }

    try {
      this.drone[command](this.driveSpeed);
      this.publishStatus({
        activeCommand: command,
        lastError: null,
        lastEvent: `Drive command: ${command} at ${this.driveSpeed}% speed`,
      });
      return this.getStatus();
    } catch (error) {
      const message = toErrorMessage(
        error,
        `Failed to send the ${command} command.`,
      );

      this.publishStatus({
        phase: 'error',
        connected: false,
        activeCommand: null,
        lastError: message,
        lastEvent: `${command} command failed`,
      });
      throw new Error(message);
    }
  }

  async stop() {
    if (!this.drone || !this.status.connected) {
      return this.getStatus();
    }

    try {
      this.drone.stop();
      this.publishStatus({
        activeCommand: null,
        lastEvent: 'Stop command sent',
        lastError: null,
      });
      return this.getStatus();
    } catch (error) {
      const message = toErrorMessage(
        error,
        'Failed to send the stop command.',
      );

      this.publishStatus({
        phase: 'error',
        connected: false,
        activeCommand: null,
        lastError: message,
        lastEvent: 'Stop command failed',
      });
      throw new Error(message);
    }
  }

  private attachDroneListeners(drone: NodeSumoClient) {
    drone.on('battery', (battery) => {
      if (typeof battery === 'number') {
        this.publishStatus({
          battery,
          lastEvent: `Battery update: ${battery}%`,
        });
      }
    });

    drone.on('batteryLow', () => {
      this.publishStatus({
        lastEvent: 'Battery low warning',
      });
    });

    drone.on('batteryCritical', () => {
      this.publishStatus({
        lastEvent: 'Battery critical warning',
      });
    });

    drone.on('postureStanding', () => {
      this.publishStatus({
        posture: 'standing',
        lastEvent: 'Posture changed to standing',
      });
    });

    drone.on('postureJumper', () => {
      this.publishStatus({
        posture: 'jumper',
        lastEvent: 'Posture changed to jumper',
      });
    });

    drone.on('postureKicker', () => {
      this.publishStatus({
        posture: 'kicker',
        lastEvent: 'Posture changed to kicker',
      });
    });

    drone.on('postureStuck', () => {
      this.publishStatus({
        posture: 'stuck',
        lastEvent: 'Drone reports it is stuck',
      });
    });

    drone.on('postureUnknown', () => {
      this.publishStatus({
        posture: 'unknown',
        lastEvent: 'Drone posture is unknown',
      });
    });
  }

  private publishStatus(patch: Partial<DroneStatus>) {
    this.status = {
      ...this.status,
      ...patch,
      updatedAt: new Date().toISOString(),
    };

    this.onStatusChange(this.getStatus());
  }

  private teardownDrone() {
    if (!this.drone) {
      return;
    }

    const drone = this.drone;
    this.drone = null;

    try {
      drone.removeAllListeners();
    } catch {
      // Best effort cleanup for old library internals.
    }

    try {
      drone.disconnect();
    } catch {
      // Best effort cleanup for old library internals.
    }

    closeUdpSocket(drone._d2cServer);
    closeUdpSocket(drone._c2dClient);
    destroyNetSocket(drone._discoveryClient);
  }
}
