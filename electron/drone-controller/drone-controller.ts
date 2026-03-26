import { connectDrone } from './connect';
import { disconnectDrone } from './disconnect';
import { driveDrone } from './drive';
import { createInitialStatus, getStatusSnapshot } from './state';
import { stopDrone } from './stop';
import type {
  DroneControllerContext,
  DroneDriveCommand,
  DronePhase,
  DronePosture,
  DroneStatus,
} from './types';

export type { DroneDriveCommand, DronePhase, DronePosture, DroneStatus };

export class DroneController {
  private readonly context: DroneControllerContext;

  constructor(
    private readonly onStatusChange: (status: DroneStatus) => void,
  ) {
    this.context = {
      drone: null,
      status: createInitialStatus(),
      driveSpeed: 30,
      driveLoop: null,
      driveRefreshIntervalMs: 25,
      onStatusChange: this.onStatusChange,
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

  async stop() {
    return stopDrone(this.context);
  }
}
