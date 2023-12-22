import * as vscode from 'vscode';
import createCommand from './base';
import { ViewProviderManager } from '../providers/Manager';

export const createShowSceneViewCommand = createCommand(async function () {
  ViewProviderManager.GetOrCreateSceneViewProvider(this).open();
});

export const createOpenSceneViewWithSelected = createCommand(async function (uri: vscode.Uri) {
  if (uri) {
    ViewProviderManager.GetOrCreateSceneViewProvider(this).openWithPath(uri.fsPath);
  } else {
    vscode.window.showInformationMessage('No document is selected.');
  }
});
