import * as vscode from 'vscode';
import type SceneViewProvider from './SceneViewProvider';
import { ViewProviderManager } from './Manager';

export default class ConsoleViewProvider implements vscode.WebviewViewProvider {
  private webviewView: vscode.WebviewView;

  constructor(private context: vscode.ExtensionContext) {
    const { cdpClient } = ViewProviderManager.GetOrCreateSceneViewProvider();
    cdpClient.rootSession.api.Log.onEntryAdded((params) => {
      this.webviewView.webview.postMessage(params.entry);
    });
  }

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext<unknown>,
    _token: vscode.CancellationToken
  ): void | Thenable<void> {
    const { webview } = webviewView;
    const entryUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'res/js', 'console.js'));

    webview.options = {
      enableScripts: true,
    };
    webview.html = this.getWebviewContent(entryUri);
    this.webviewView = webviewView;
  }

  getWebviewContent(scriptUri: vscode.Uri): string {
    return `
<!DOCTYPE html>
<html lang="en-us">
<head>
  <meta charset="utf-8">
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>JSAR Inspector</title>
  <style>
    body {
      width: 100vw;
      height: 100vh;
      overflow-x: hidden;
      padding: 0;
    }
  </style>
  <script type="module" src="${scriptUri}"></script>
</head>
<body>
  <div id="app"></div>
</body>
</html>
    `
  }
}
