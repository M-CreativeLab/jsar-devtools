import * as vscode from 'vscode';

type ContextifyCommandHandler = (this: vscode.ExtensionContext, uri: vscode.Uri) => any;
type CommandHandler = (uri: vscode.Uri) => any;

export default function createCommand(handler: ContextifyCommandHandler): (context: vscode.ExtensionContext) => CommandHandler {
  return (context: vscode.ExtensionContext) => handler.bind(context);
}
