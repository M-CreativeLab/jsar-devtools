import * as vscode from 'vscode';
import createCommand from './base';
import Packager from '../packager';

export const createPackageProjectCommand = createCommand(async (uri) => {
  const selectedPath = uri.fsPath;
  const workspaceFolder = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(selectedPath));
  if (workspaceFolder) {
    vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
    }, async (progress) => {
      try {
        const packager = new Packager(workspaceFolder.uri.fsPath);
        progress.report({
          message: 'Packaging project...',
          increment: 0,
        });

        await packager.pack((value: number, message: string) => {
          progress.report({ message, increment: value });
        });
        const archiveFilename = await packager.save();
        vscode.window.showInformationMessage(`Project packaged to ${archiveFilename}`);
      } catch (err: any) {
        vscode.window.showErrorMessage(err?.message || 'Unknown error');
      }
    });
  }
});
