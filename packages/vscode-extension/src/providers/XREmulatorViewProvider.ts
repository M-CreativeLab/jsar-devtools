import * as vscode from 'vscode';

export default class XREmulatorViewProvider implements vscode.WebviewViewProvider {
  private webviewView: vscode.WebviewView;
  /**
   * The extension's resource path
   */
  private resourcePath: vscode.Uri;

  constructor(private context: vscode.ExtensionContext) {
    this.resourcePath = vscode.Uri.joinPath(context.extensionUri, 'res');
  }

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext<unknown>,
    _token: vscode.CancellationToken
  ): void | Thenable<void> {
    console.log('resolveWebviewView', webviewView);
    this.webviewView = webviewView;
    const { webview } = webviewView;
    const entryUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'res/js', 'xr-emulator.js'));

    webview.options = {
      enableScripts: true,
    };
    webview.html = this.getWebviewContent(entryUri);
  }

  getWebviewContent(scriptUri: vscode.Uri): string {
    const basePath = this.webviewView.webview.asWebviewUri(this.resourcePath);

    return `
<!DOCTYPE html>
<html lang="en-us">
<head>
  <meta charset="utf-8">
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
  <meta name="viewport" content="width=device-width, user-scalable=no, minimum-scale=1.0, maximum-scale=1.0">
  <base href="${basePath}">
  <title>WebXR Emulator</title>
  <style>
    html, body {
      height: 100% !important;
    }
  </style>
</head>
<body>
  <div id="app"></div>
  <script src="${scriptUri}"></script>
</body>
</html>
    `
  }
}
