/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DEFAULT_TRANSFORMS } from './constants';

const STORAGE_KEY = 'immersive-web-emulator-settings';

export const emulatorStates = {
  inImmersive: false,
  actionMappingOn: true,
  assetNodes: {},
  controllers: {
    'left-controller': {
      joystick: {
        touched: false,
        pressed: false,
        valueX: 0,
        valueY: 0,
      },
      trigger: {
        touched: false,
        value: 0,
      },
      grip: {
        touched: false,
        value: 0,
      },
      button1: {
        touched: false,
        pressed: false,
      },
      button2: {
        touched: false,
        pressed: false,
      },
    },
    'right-controller': {
      joystick: {
        touched: false,
        pressed: false,
        valueX: 0,
        valueY: 0,
      },
      trigger: {
        touched: false,
        value: 0,
      },
      grip: {
        touched: false,
        value: 0,
      },
      button1: {
        touched: false,
        pressed: false,
      },
      button2: {
        touched: false,
        pressed: false,
      },
    },
  },
  playbackInProgress: false,
  pinchValues: {
    'left-hand': 0,
    'right-hand': 0,
  },
  joysticks: {},
  buttons: {},
  sliders: {},
  emulatedDevice: null,
};

export class EmulatorSettings {
  static _instance: EmulatorSettings = null;
  static get instance() {
    if (!EmulatorSettings._instance) {
      EmulatorSettings._instance = new EmulatorSettings();
    }
    return EmulatorSettings._instance;
  }

  stereoOn: boolean;
  actionMappingOn: boolean;
  defaultPose: any;
  deviceKey: string;
  keyboardMappingOn: boolean;
  roomDimension: any;
  polyfillExcludes: Set<any>;
  inputMode: string;
  handPoses: any;
  userObjects: any;
  triggerMode: string;

  constructor() {
    this.stereoOn = false;
    this.actionMappingOn = true;
    this.defaultPose = DEFAULT_TRANSFORMS;
    this.deviceKey = 'Rokid Max Pro';
    this.keyboardMappingOn = true;
    this.roomDimension = { x: 6, y: 3, z: 6 };
    this.polyfillExcludes = new Set();
    this.inputMode = 'controllers';
    this.handPoses = {
      'left-hand': 'relaxed',
      'right-hand': 'relaxed',
    };
    this.userObjects = {};
    this.triggerMode = 'normal';
  }

  load() {
    return new Promise((resolve) => {
      const result = window.localStorage;
      const settings = result.getItem(STORAGE_KEY)
        ? JSON.parse(result.getItem(STORAGE_KEY))
        : null;
      this.stereoOn = settings?.stereoOn ?? false;
      this.actionMappingOn = settings?.actionMappingOn ?? true;
      this.defaultPose = settings?.defaultPose ?? DEFAULT_TRANSFORMS;
      this.deviceKey = settings?.deviceKey ?? 'Meta Quest 3';
      this.keyboardMappingOn = settings?.keyboardMappingOn ?? true;
      this.roomDimension = settings?.roomDimension ?? { x: 6, y: 3, z: 6 };
      this.polyfillExcludes = new Set(settings?.polyfillExcludes ?? []);
      this.inputMode = settings?.inputMode ?? 'controllers';
      this.handPoses = settings?.handPoses ?? this.handPoses;
      this.userObjects = settings?.userObjects ?? {};
      this.triggerMode = settings?.triggerMode ?? 'normal';
      resolve(result);
    });
  }

  write() {
    const settings = {};
    settings[STORAGE_KEY] = JSON.stringify({
      stereoOn: this.stereoOn,
      actionMappingOn: this.actionMappingOn,
      defaultPose: this.defaultPose,
      deviceKey: this.deviceKey,
      keyboardMappingOn: this.keyboardMappingOn,
      roomDimension: this.roomDimension,
      polyfillExcludes: Array.from(this.polyfillExcludes),
      inputMode: this.inputMode,
      handPoses: this.handPoses,
      userObjects: this.userObjects,
      triggerMode: this.triggerMode,
    });
    return new Promise((resolve) => {
      window.localStorage.setItem(STORAGE_KEY, settings[STORAGE_KEY]);
      resolve(settings);
    });
  }

  clear() {
    const settings = {};
    settings[STORAGE_KEY] = null;
    return new Promise((resolve) => {
      window.localStorage.removeItem(STORAGE_KEY);
      resolve(settings);
    });
  }
}