import * as vscode from 'vscode';
import createCommand from './base';
import { DeviceManager } from '../devices/DeviceManager';
import Packager from '../packager';

export const createConnectDeviceCommand = createCommand(async function () {
  vscode.window.showInputBox({
    prompt: 'Input the target device ip and an optional port(5555 by default)',
    placeHolder: 'Such as 192.168.1.101 or 192.168.1.102:5555',
    value: '',
  }).then(async ipAndPort => {
    if (ipAndPort) {
      try {
        let portNumber = 5555;
        const [ip, port] = ipAndPort.split(':');
        if (port) {
          portNumber = parseInt(port);
        }
        if (isNaN(portNumber)) {
          portNumber = 5555;
        }
        await DeviceManager.getInstance().connectDevice(ip, portNumber);
        vscode.window.showInformationMessage(`Device ${ip}:${portNumber} connected`);
      } catch (err) {
        vscode.window.showErrorMessage(err?.message || 'Unknown error');
      }
    } else {
      vscode.window.showInformationMessage('Please input the IP address');
    }
  });
});

export const createInstallToConnectedDeviceCommand = createCommand(async function (uri: vscode.Uri) {
  const deviceManager = DeviceManager.getInstance();
  const availableDevices = await deviceManager.getDevices();
  if (availableDevices.length <= 0) {
    vscode.window.showErrorMessage('No device connected, execute "jsar-devtools.connectDevice" first');
    return;
  }

  vscode.window.showQuickPick(
    availableDevices.map(device => device.serial),
    {
      placeHolder: 'Select the device to install',
    }
  ).then(async (selectedDeviceSerial) => {
    try {
      let selectedPath: string;
      if (!uri) {
        if (vscode.workspace.workspaceFolders.length > 0) {
          selectedPath = vscode.workspace.workspaceFolders[0].uri.fsPath;
        } else {
          throw new TypeError('Failed to load workspace.');
        }
      } else {
        selectedPath = uri.fsPath;
      }

      const workspaceFolder = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(selectedPath));
      if (!workspaceFolder) {
        vscode.window.showErrorMessage('Please open a workspace folder first');
        return;
      }

      await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
      }, async (progress) => {
        const packager = new Packager(workspaceFolder.uri.fsPath);

        progress.report({
          message: 'Packaging project...',
          increment: 0,
        });
        await packager.pack((value: number, message: string) => {
          progress.report({ message, increment: value });
        });
        const archiveFilename = await packager.save();

        progress.report({
          message: `Installing project to device ${selectedDeviceSerial}`,
          increment: 0,
        });
        await deviceManager.installToDebugFolder(selectedDeviceSerial, archiveFilename);
        vscode.window.showInformationMessage(`Project(${packager.projectFullName}) installed to device ${selectedDeviceSerial}`);
      });
    } catch (err) {
      vscode.window.showErrorMessage(err.message || 'Unknown error');
    }
  });
});

export const createDisableDeviceCommand = createCommand(async function () {
  DeviceManager.getInstance().disposeClient();
});
