import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap';
import './index.css';

import { createRoot } from 'react-dom/client';
import React from 'react';
import App from './App';

import { EmulatorSettings, emulatorStates } from './core/emulator-states';
import EmulatedDevice from './core/emulated-device';
import { syncDevicePose } from './core/messenger';

EmulatorSettings.instance.load().then(() => {
  const device = new EmulatedDevice();
  device.on('pose', syncDevicePose);
  emulatorStates.emulatedDevice = device;

  createRoot(document.getElementById('app')).render(
    <App device={device} />
  );
});
