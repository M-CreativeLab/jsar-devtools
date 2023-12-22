import * as vscode from 'vscode';
import { createPackageProjectCommand } from './package';
import {
  createShowSceneViewCommand,
  createOpenSceneViewWithSelected,
} from './scene';
import {
  createInspectElement,
} from './inspector';
import {
  createConnectDeviceCommand,
  createInstallToConnectedDeviceCommand,
  createDisableDeviceCommand,
} from './device';
import {
  createOpenDocumentation,
} from './help';

export function createCommandsList(context: vscode.ExtensionContext) {
  return {
    // package
    packageProject: createPackageProjectCommand(context),

    // scene
    showSceneView: createShowSceneViewCommand(context),
    openSceneViewWithSelected: createOpenSceneViewWithSelected(context),

    // inspector
    inspectElement: createInspectElement(context),

    // device
    connectDevice: createConnectDeviceCommand(context),
    installToConnectedDevice: createInstallToConnectedDeviceCommand(context),
    disableDevice: createDisableDeviceCommand(context),

    // help
    openDocumentation: createOpenDocumentation(context),
  };
}
