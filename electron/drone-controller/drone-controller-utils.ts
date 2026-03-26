import type { Socket as UdpSocket } from 'node:dgram';
import type { Socket as NetSocket } from 'node:net';

export function toErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  if (typeof error === 'string' && error.trim()) {
    return error;
  }

  return fallback;
}

export function closeUdpSocket(socket?: UdpSocket) {
  if (!socket) {
    return;
  }

  try {
    socket.close();
  } catch {
    // Best effort cleanup for old library internals.
  }
}

export function destroyNetSocket(socket?: NetSocket) {
  if (!socket) {
    return;
  }

  try {
    socket.destroy();
  } catch {
    // Best effort cleanup for old library internals.
  }
}
