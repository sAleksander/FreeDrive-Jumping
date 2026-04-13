# FreeDrive-Jumping

Electron + React + TypeScript desktop app for experimenting with Parrot
Jumping drone control from a computer (Tested on MacOS).

## Current Status

- Connect and disconnect from the drone through the Electron bridge
- Arm and disarm controls in the HUD
- Battery, warning, and connection state overlays
- FPV stage with live video when available and RX noise fallback when not
- Video diagnostics panel with log export
- Keyboard driving with arrow keys
- Drive speed modifiers: hold `C` for slow mode or `Shift` for boost

## Development

```bash
npm install
npm run dev
```

## Using The Prototype

1. Power on the Jumping drone and join its Wi-Fi network from your computer.
2. Start the app with `npm run dev`.
3. Click `Connect` and wait for the app to report `connected`.
4. Wait for status data to appear and for video to start if the stream is
   available.
5. Toggle `Arm`.
6. Press and hold the arrow keys to drive the drone.
7. Hold `C` for slow mode or `Shift` for boost while driving.
8. Release the keys, switch away from the window, or disconnect to trigger
   `Stop`.

## In Progress

- jumping
- kicking
- drone gestures

## Build

```bash
npm run build
npm run start
```
