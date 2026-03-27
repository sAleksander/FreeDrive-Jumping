type ElectronApi = NonNullable<Window['electronAPI']>;

export type DroneApi = ElectronApi['drone'];
export type DroneAction = (drone: DroneApi) => Promise<DroneStatus>;
export type RunDroneAction = (action: DroneAction) => Promise<void>;
