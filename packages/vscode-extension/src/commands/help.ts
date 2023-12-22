import * as vscode from 'vscode';
import createCommand from './base';

export const createOpenDocumentation = createCommand(async function () {
  vscode.env.openExternal(vscode.Uri.parse('https://jsar.netlify.app/manual/latest/introduction'));
});
