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
} from './types';

export type {
  DroneDriveCommand,
  DroneDriveState,
  DronePhase,
  DronePosture,
  DroneStatus,
};

export class DroneController {
  private readonly context: DroneControllerContext;

  constructor(
    private readonly onStatusChange: (status: DroneStatus) => void,
  ) {
    this.context = {
      drone: null,
      status: createInitialStatus(),
      driveState: createIdleDriveState(),
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

  async setDriveState(driveState: DroneDriveState) {
    return setDriveState(this.context, driveState);
  }

  async stop() {
    return stopDrone(this.context);
  }
}
