import { EventEmitter } from 'node:events';
import type { Socket as UdpSocket } from 'node:dgram';
import type { Socket as NetSocket } from 'node:net';
import type {
  NodeSumoArstreamFrame,
  NodeSumoArstreamState,
  NodeSumoClient,
} from './types';

export class VirtualDroneAdapter extends EventEmitter implements NodeSumoClient {
  _arstreamFrame?: NodeSumoArstreamState;
  _createARStreamACK?: (frame: NodeSumoArstreamFrame) => Buffer;
  _c2dClient?: UdpSocket;
  _d2cServer?: UdpSocket;
  _discoveryClient?: NetSocket;

  private battery = 100;
  private batteryInterval: NodeJS.Timeout | null = null;

  connect(callback?: (error?: unknown) => void): void {
    setTimeout(() => {
      callback?.();

      setTimeout(() => {
        this.emit('ready');
        this.emit('postureStanding');
        this.startBatteryDrain();
      }, 50);
    }, 500);
  }

  disconnect(): void {
    this.cleanup();
  }

  forward(_speed: number): this { return this; }
  backward(_speed: number): this { return this; }
  left(_speed: number): this { return this; }
  right(_speed: number): this { return this; }
  stop(): this { return this; }

  animationsLongJump(): this {
    this.emit('postureJumper');
    setTimeout(() => this.emit('postureStanding'), 2_000);
    return this;
  }

  animationsHighJump(): this {
    this.emit('postureJumper');
    setTimeout(() => this.emit('postureStanding'), 3_000);
    return this;
  }

  // Video streaming is a no-op — the renderer shows a noise screen in virtual mode.
  videoStreaming(_options?: { enabled?: number }): this { return this; }

  override removeAllListeners(event?: string | symbol): this {
    super.removeAllListeners(event);
    return this;
  }

  private startBatteryDrain() {
    this.batteryInterval = setInterval(() => {
      this.battery = Math.max(0, this.battery - 1);
      this.emit('battery', this.battery);
      if (this.battery === 15) this.emit('batteryLow');
      if (this.battery === 5) this.emit('batteryCritical');
    }, 5_000);
  }

  private cleanup() {
    if (this.batteryInterval) {
      clearInterval(this.batteryInterval);
      this.batteryInterval = null;
    }
    this.battery = 100;
  }
}
