/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React from 'react';
import { DEFAULT_TRANSFORMS, TRIGGER_MODES } from './core/constants';
import {
  changeEmulatedDeviceType,
  notifyExitImmersive,
} from './core/messenger';

import { DEVICE_DEFINITIONS } from './core/devices';
import { EmulatorSettings } from './core/emulator-states';

export function HeadsetBar({ device }) {
  const headsetSelectRef = React.useRef<any>();
  const [showDropDown, setShowDropDown] = React.useState(false);
  const [triggerMode, setTriggerMode] = React.useState(
    EmulatorSettings.instance.triggerMode,
  );

  function onChangeDevice() {
    const deviceId = headsetSelectRef.current?.value;
    if (DEVICE_DEFINITIONS[deviceId]) {
      EmulatorSettings.instance.deviceKey = deviceId;
      changeEmulatedDeviceType(DEVICE_DEFINITIONS[deviceId]);
      EmulatorSettings.instance.write();
    }
  }

  return (
    <div className="card headset-card">
      <div className="card-body">
        <div className="row">
          <div className="col-4 d-flex justify-content-start align-items-center">
            <img src="./res/icons/xr-emulator/headset.png" className="control-icon" />
            <select
              id="vr-device-select"
              className="form-select headset-select"
              ref={headsetSelectRef}
              defaultValue={EmulatorSettings.instance.deviceKey}
              onChange={onChangeDevice}
            >
              {Object.values(DEVICE_DEFINITIONS).map(({ shortName, name }) => (
                <option key={name} value={name}>
                  {shortName}
                </option>
              ))}
            </select>
          </div>
          <div className="col-8 d-flex justify-content-end align-items-center">
            <div className="control-button-group">
              <button
                className="btn headset-action-button"
                onClick={notifyExitImmersive}
              >
                <img src="./res/icons/xr-emulator/exit.png" className="action-icon" />
              </button>
              <button
                className={
                  'btn headset-action-button' +
                  (showDropDown ? ' button-pressed' : '')
                }
                onClick={() => {
                  setShowDropDown(!showDropDown);
                }}
              >
                <img
                  src="./res/icons/xr-emulator/settings.png"
                  className="action-icon"
                />
              </button>
            </div>
            {showDropDown && (
              <div className="drop-down-container">
                <button
                  className="btn special-button"
                  onClick={() => {
                    const currentModeIndex = TRIGGER_MODES.indexOf(
                      EmulatorSettings.instance.triggerMode,
                    );
                    const nextModeIndex =
                      (currentModeIndex + 1) % TRIGGER_MODES.length;
                    EmulatorSettings.instance.triggerMode =
                      TRIGGER_MODES[nextModeIndex];
                    EmulatorSettings.instance.write().then(() => {
                      setTriggerMode(EmulatorSettings.instance.triggerMode);
                    });
                  }}
                >
                  Trigger: {triggerMode}
                </button>
                <button
                  className="btn special-button"
                  onClick={() => {
                    EmulatorSettings.instance.defaultPose = DEFAULT_TRANSFORMS;
                    EmulatorSettings.instance.write().then(() => {
                      device.resetPose();
                    });
                  }}
                >
                  Clear default pose
                </button>
                <button
                  className="btn special-button"
                  onClick={() => {
                    EmulatorSettings.instance.clear();
                  }}
                >
                  Clear all settings
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}