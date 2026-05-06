import type { DroneModel, NodeSumoClient } from './types';

// ARNETWORKAL frame header size: type(1) + id(1) + seq(1) + size(4) = 7 bytes
const FRAME_HEADER_SIZE = 7;

// BD_NET_DC_EVENT_ID — event packets sent from drone to controller
const DC_EVENT_BUFFER_ID = 126;

// ARCOMMANDS identifiers for COMMON.SettingsState.ProductNameChanged
const PROJECT_COMMON = 0;
const CLASS_SETTINGSSTATE = 3;
const CMD_PRODUCTNAMECHANGED = 2;

function parseProductName(frame: Buffer): string | null {
  // Ensure there's at least a full ARNETWORKAL header
  if (frame.length < FRAME_HEADER_SIZE) return null;

  const bufferId = frame[1];
  if (bufferId !== DC_EVENT_BUFFER_ID) return null;

  const totalSize = frame.readUInt32LE(3);
  if (frame.length < totalSize || totalSize < FRAME_HEADER_SIZE + 4) return null;

  // ARCOMMANDS payload starts at byte 7
  const project = frame[7];
  const cls = frame[8];
  const cmd = frame.readUInt16LE(9);

  if (project !== PROJECT_COMMON || cls !== CLASS_SETTINGSSTATE || cmd !== CMD_PRODUCTNAMECHANGED) {
    return null;
  }

  // Product name is a null-terminated UTF-8 string starting at byte 11
  const nameStart = 11;
  const nullIdx = frame.indexOf(0, nameStart);
  const nameEnd = nullIdx === -1 ? frame.length : nullIdx;
  return frame.slice(nameStart, nameEnd).toString('utf8');
}

function mapProductNameToModel(name: string): DroneModel {
  const lower = name.toLowerCase();
  if (lower.includes('night')) return 'night';
  if (lower.includes('race')) return 'race';
  if (lower.includes('sumo') || lower.includes('jumping')) return 'sumo';
  return 'unknown';
}

export function detectDroneModel(
  drone: NodeSumoClient,
  onDetected: (model: DroneModel) => void,
  timeoutMs = 3_000,
): void {
  const socket = drone._d2cServer;
  if (!socket) {
    onDetected('unknown');
    return;
  }

  let settled = false;

  const finish = (model: DroneModel) => {
    if (settled) return;
    settled = true;
    clearTimeout(timer);
    socket.removeListener('message', onMessage);
    onDetected(model);
  };

  const onMessage = (msg: Buffer) => {
    const name = parseProductName(msg);
    if (name !== null) {
      finish(mapProductNameToModel(name));
    }
  };

  const timer = setTimeout(() => finish('unknown'), timeoutMs);

  socket.on('message', onMessage);
}
