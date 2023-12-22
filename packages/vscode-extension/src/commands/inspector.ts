// import * as vscode from 'vscode';
import createCommand from './base';
import { ViewProviderManager } from '../providers/Manager';

export const createInspectElement = createCommand(async function (inspectable) {
  ViewProviderManager.GetOrCreateInspectorViewProvider(this).inspect(inspectable);
});
